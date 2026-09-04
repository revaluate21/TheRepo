'use strict';
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const ROUTES = window.WANDER_ROUTES || [];
  const HOME = { lat:38.81087, lon:-9.16087, label:'2660-213 Santo António dos Cavaleiros' };
  const VERSION = '1.0.0';
  const WEATHER_TTL = 25 * 60 * 1000;
  const CITY_POINTS = {
    Lisbon:{lat:38.7223,lon:-9.1393}, Almada:{lat:38.6800,lon:-9.1580}, Sintra:{lat:38.7979,lon:-9.3908},
    Cascais:{lat:38.6979,lon:-9.4215}, Coimbra:{lat:40.2100,lon:-8.4292}, Tomar:{lat:39.6038,lon:-8.4154},
    'Óbidos':{lat:39.3617,lon:-9.1570}, Ericeira:{lat:38.9634,lon:-9.4175}
  };
  const WEATHER = {
    0:['☀️','Clear'],1:['🌤️','Mostly clear'],2:['⛅','Partly cloudy'],3:['☁️','Cloudy'],45:['🌫️','Fog'],48:['🌫️','Fog'],
    51:['🌦️','Drizzle'],53:['🌦️','Drizzle'],55:['🌧️','Drizzle'],61:['🌧️','Rain'],63:['🌧️','Rain'],65:['🌧️','Heavy rain'],
    71:['🌨️','Snow'],73:['🌨️','Snow'],75:['🌨️','Snow'],80:['🌦️','Showers'],81:['🌧️','Showers'],82:['⛈️','Heavy showers'],
    95:['⛈️','Thunderstorm'],96:['⛈️','Thunderstorm'],99:['⛈️','Thunderstorm']
  };

  const safeStore = {
    get(key, fallback){ try { const v=localStorage.getItem(key); return v===null?fallback:JSON.parse(v); } catch(_){ return fallback; } },
    set(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(_){} }
  };

  const state = {
    mood:'all', best:null, plan:[], weather:new Map(), position:null, gpsWatch:null, route:null,
    index:0, visited:new Set(), nearHits:0, lastAuto:0, voice:safeStore.get('wu-voice',true),
    map:null, mapReady:false, mapLayers:[], userMarker:null, accuracyCircle:null, installPrompt:null,
    currentPhotoVariant:0, sheetItem:null, locationRequested:false
  };

  const rad = n => n*Math.PI/180;
  function hav(a,b){ const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon); const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)); }
  function fmtDistance(m){ if(!Number.isFinite(m)) return '—'; return m<1000?`${Math.max(1,Math.round(m))} m`:`${(m/1000).toFixed(m<10000?1:0)} km`; }
  function routeById(id){ return ROUTES.find(r=>r.id===id); }
  function currentStop(){ return state.route?.stops?.[Math.min(state.index,state.route.stops.length-1)]; }
  function stopKey(route){ return `wu-progress:${route.id}`; }
  function savedProgress(route){ return safeStore.get(stopKey(route),{index:0,visited:[]}); }
  function saveProgress(){ if(!state.route)return; safeStore.set(stopKey(state.route),{index:state.index,visited:[...state.visited]}); }
  function weatherIcon(code){ return WEATHER[code] || ['🌤️','Weather']; }
  function nowLisbon(){ return new Date(); }
  function minutes(hhmm){ const [h,m]=String(hhmm||'00:00').slice(-5).split(':').map(Number); return h*60+m; }
  function localMinutes(date=new Date()){ return date.getHours()*60+date.getMinutes(); }
  function toast(text,ms=2700){ const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('show'),ms); }
  function stripHtml(value){ return String(value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }

  function mapsUrl(destination, mode='walking', navigate=true){
    const url=new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api','1');
    url.searchParams.set('destination',destination);
    url.searchParams.set('travelmode',mode);
    if(navigate) url.searchParams.set('dir_action','navigate');
    return url.toString();
  }
  function mapsHomeUrl(){ return mapsUrl(HOME.label,'transit',false); }
  function mapsStartUrl(route){ const first=route.stops[0]; return mapsUrl(`${first.lat},${first.lon}`,'transit',false); }

  async function fetchWeather(city, force=false){
    const point=CITY_POINTS[city]||CITY_POINTS.Lisbon;
    const key=`wu-weather:${city}`;
    if(!force){ const cached=safeStore.get(key,null); if(cached&&Date.now()-cached.at<WEATHER_TTL){ state.weather.set(city,cached.data); return cached.data; } }
    const url=new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude',point.lat); url.searchParams.set('longitude',point.lon);
    url.searchParams.set('current','temperature_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m');
    url.searchParams.set('hourly','temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index');
    url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max');
    url.searchParams.set('timezone','Europe/Lisbon'); url.searchParams.set('forecast_days','7');
    try{
      const res=await fetch(url,{cache:'no-store'}); if(!res.ok) throw new Error(`Weather ${res.status}`);
      const data=await res.json(); state.weather.set(city,data); safeStore.set(key,{at:Date.now(),data}); return data;
    }catch(error){
      const cached=safeStore.get(key,null); if(cached?.data){state.weather.set(city,cached.data);return cached.data;}
      return null;
    }
  }

  function dayData(weather,offset=0){
    if(!weather?.daily?.time?.[offset]) return null;
    return {
      date:weather.daily.time[offset], code:weather.daily.weather_code[offset], max:weather.daily.temperature_2m_max[offset],
      min:weather.daily.temperature_2m_min[offset], sunset:weather.daily.sunset[offset], sunrise:weather.daily.sunrise[offset],
      rain:weather.daily.precipitation_probability_max[offset], uv:weather.daily.uv_index_max[offset]
    };
  }
  function timeBucket(weather){
    const now=nowLisbon(),n=localMinutes(now),today=dayData(weather,0);
    const sunset=today?.sunset?minutes(today.sunset):20*60;
    const sunrise=today?.sunrise?minutes(today.sunrise):7*60;
    if(n<sunrise+120) return 'morning';
    if(n>=sunset-100&&n<sunset+50) return 'sunset';
    if(n>=sunset+50||n<sunrise) return 'night';
    return 'day';
  }
  function weatherContext(weather,offset=0){
    const daily=dayData(weather,offset);
    const current=offset===0?weather?.current:null;
    return {
      apparent:current?.apparent_temperature ?? daily?.max ?? 24,
      temp:current?.temperature_2m ?? daily?.max ?? 24,
      wind:current?.wind_speed_10m ?? 10,
      rain:daily?.rain ?? 0,
      code:current?.weather_code ?? daily?.code ?? 1,
      max:daily?.max ?? 24,
      sunset:daily?.sunset, bucket:offset===0?timeBucket(weather):'day'
    };
  }

  function scoreRoute(route,ctx,{offset=0,mood=state.mood,usedCities=new Set(),usedRoutes=new Set()}={}){
    let score=0; const hour=nowLisbon().getHours(); const bucket=ctx.bucket;
    if(route.best.includes(bucket)) score+=30; else score-=8;
    if(mood!=='all') score+=route.moods.includes(mood)?35:-32;
    if(bucket==='night'){
      if(route.nightSafe) score+=42; else score-=95;
      if(route.dayOnly) score-=140;
      if(['Lisbon','Almada'].includes(route.city)) score+=10; else score-=45;
    }
    if(bucket==='sunset'){
      if(route.best.includes('sunset')) score+=28;
      if(route.climate.some(x=>['river','coast','breeze','open'].includes(x))) score+=18;
      if(route.city==='Almada') score+=14;
    }
    const hot=(ctx.apparent>=30||ctx.max>=32);
    if(hot){
      if(route.climate.some(x=>['coast','river','breeze','forest','shade','garden'].includes(x))) score+=24;
      if(route.climate.includes('exposed')&&bucket==='day') score-=20;
      if(route.climate.includes('hills')&&bucket==='day') score-=12;
    }
    if(ctx.rain>=40){
      if(route.climate.includes('city')) score+=9;
      if(route.climate.some(x=>['coast','exposed','forest'].includes(x))) score-=22;
    }
    if(ctx.wind>=35&&route.climate.includes('coast')) score-=18;
    if(offset===0){
      if(hour>=15&&route.dayOnly) score-=60;
      if(hour>=13&&!['Lisbon','Almada','Cascais','Ericeira'].includes(route.city)) score-=55;
    }else{
      if(route.dayOnly) score+=12;
      if(usedCities.has(route.city)) score-=15;
      if(usedRoutes.has(route.id)) score-=80;
      if(offset===1&&route.city==='Sintra') score+=7;
    }
    if(state.position){
      const d=hav(state.position,route.stops[0]);
      if(d<3000) score+=18; else if(d<15000) score+=7;
    }
    if(route.moods.includes('mindblown')) score+=3;
    return score;
  }

  function recommendationReason(route,ctx){
    if(ctx.bucket==='night') return route.nightSafe?'lit route + cooler air':'night option';
    if(ctx.bucket==='sunset') return route.climate.includes('river')||route.climate.includes('coast')?'sunset + breeze':'golden-hour views';
    if((ctx.apparent>=30||ctx.max>=32)&&route.climate.some(x=>['forest','shade','coast','river','breeze'].includes(x))) return route.climate.includes('forest')?'forest shade':'cooler by water';
    if(ctx.rain>=40) return 'best fit for showers';
    if(route.city!=='Lisbon'&&ctx.bucket==='morning') return 'leave early for a full day';
    return route.vibe.toLowerCase();
  }

  async function chooseBest(force=false){
    const weather=await fetchWeather('Lisbon',force); const ctx=weatherContext(weather||{},0);
    const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,ctx)})).sort((a,b)=>b.score-a.score);
    state.best=ranked[0]?.route||ROUTES[0]; renderWeatherHeader(weather); await renderBest(state.best,ctx); return state.best;
  }

  function renderWeatherHeader(weather){
    const ctx=weatherContext(weather||{},0),[icon,label]=weatherIcon(ctx.code);
    $('#weatherIcon').textContent=icon; $('#weatherTemp').textContent=`${Math.round(ctx.temp)}°`;
    const bucket=ctx.bucket.toUpperCase(); $('#timeLabel').textContent=`PORTUGAL · ${bucket} · PHONE-DOWN MODE`;
    $('#weatherBtn').title=`${label}, feels ${Math.round(ctx.apparent)}°`;
  }

  async function renderBest(route,ctx){
    if(!route)return; $('#bestCard').classList.remove('skeleton');
    $('#bestTitle').textContent=`${route.city} · ${route.title}`;
    $('#bestMeta').textContent=`${route.duration[0]}–${route.duration[1]}h · ${Math.round(route.steps[0]/1000)}–${Math.round(route.steps[1]/1000)}k steps · ${route.vibe}`;
    $('#bestReason').textContent=recommendationReason(route,ctx);
    $('#bestGo').disabled=false; $('#bestGo').onclick=()=>openRoute(route.id,true);
    await PhotoHub.load($('#bestPhoto'),$('#bestCard .photo-fallback'),route);
  }

  function routeCard(route,extra={}){
    const card=document.createElement('button'); card.className='route-card'; card.dataset.moods=route.moods.join(' '); card.dataset.id=route.id;
    card.innerHTML=`<div class="media"><div class="photo-fallback">${route.icon}</div><img alt="" referrerpolicy="no-referrer"></div><span class="corner">${extra.corner||route.city}</span><div class="copy"><span class="badge glass">${route.vibe}</span><h3>${route.title}</h3><p>${route.duration[0]}–${route.duration[1]}h · ${Math.round(route.steps[0]/1000)}–${Math.round(route.steps[1]/1000)}k steps</p></div>`;
    card.addEventListener('click',()=>openRoute(route.id,true)); PhotoHub.load(card.querySelector('img'),card.querySelector('.photo-fallback'),route); return card;
  }

  function renderGrid(){
    const grid=$('#routeGrid'); grid.innerHTML=''; let shown=0;
    const sorted=[...ROUTES].sort((a,b)=>{ if(a.id===state.best?.id)return -1;if(b.id===state.best?.id)return 1; return a.city.localeCompare(b.city)||a.title.localeCompare(b.title); });
    sorted.forEach(route=>{ const card=routeCard(route); const match=state.mood==='all'||route.moods.includes(state.mood); if(!match)card.classList.add('filtered'); else shown++; grid.appendChild(card); });
    $('#routeCount').textContent=`${shown} routes`;
  }

  async function buildFiveDayPlan(force=false){
    $('#fiveDayRow').innerHTML='<div class="loading-card"></div><div class="loading-card"></div><div class="loading-card"></div>';
    const cities=[...new Set(ROUTES.map(r=>r.city))];
    await Promise.all(cities.map(c=>fetchWeather(c,force)));
    const usedRoutes=new Set(),usedCities=new Set(),plan=[];
    for(let offset=0;offset<5;offset++){
      let best=null;
      for(const route of ROUTES){
        const w=state.weather.get(route.city)||state.weather.get('Lisbon');
        const ctx=weatherContext(w||{},offset); if(offset>0)ctx.bucket='day';
        let score=scoreRoute(route,ctx,{offset,mood:'all',usedCities,usedRoutes});
        if(offset===0&&localMinutes()>16*60&&!route.best.some(x=>['sunset','night'].includes(x)))score-=60;
        if(offset>0&&route.city==='Lisbon'&&usedCities.has('Lisbon'))score-=15;
        if(!best||score>best.score)best={route,score,ctx,day:dayData(w,offset)};
      }
      if(best){plan.push(best);usedRoutes.add(best.route.id);usedCities.add(best.route.city);}
    }
    state.plan=plan; renderFiveDay();
  }

  function renderFiveDay(){
    const row=$('#fiveDayRow'); row.innerHTML='';
    state.plan.forEach((item,index)=>{
      const card=document.createElement('button'); card.className='day-card'; const date=new Date(`${item.day?.date||new Date().toISOString().slice(0,10)}T12:00:00`);
      const day=index===0?'TODAY':date.toLocaleDateString('en-GB',{weekday:'short',day:'numeric'}).toUpperCase(); const [icon]=weatherIcon(item.day?.code??1);
      card.innerHTML=`<div class="media"><div class="photo-fallback">${item.route.icon}</div><img alt="" referrerpolicy="no-referrer"></div><span class="corner">${day} · ${icon} ${Math.round(item.day?.max??item.ctx.max)}°</span><div class="copy"><span class="badge glass">${recommendationReason(item.route,item.ctx)}</span><h3>${item.route.city} · ${item.route.title}</h3><p>${item.route.duration[0]}–${item.route.duration[1]}h · ${Math.round(item.route.steps[0]/1000)}–${Math.round(item.route.steps[1]/1000)}k steps</p></div>`;
      card.addEventListener('click',()=>openRoute(item.route.id,true)); row.appendChild(card); PhotoHub.load(card.querySelector('img'),card.querySelector('.photo-fallback'),item.route);
    });
  }

  function setMood(mood){ state.mood=mood; $$('.mood').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood)); renderGrid(); const weather=state.weather.get('Lisbon'); const ctx=weatherContext(weather||{},0); const options=ROUTES.filter(r=>mood==='all'||r.moods.includes(mood)).map(route=>({route,score:scoreRoute(route,ctx,{mood})})).sort((a,b)=>b.score-a.score); if(options[0])renderBest(options[0].route,ctx); }

  function routePhotoItem(route){ return route; }
  async function openRoute(id,push=false){
    const route=routeById(id); if(!route)return;
    state.route=route; const progress=savedProgress(route); state.index=Math.min(progress.index||0,route.stops.length-1); state.visited=new Set(progress.visited||[]); state.currentPhotoVariant=0;
    $('#homeView').classList.add('hidden'); $('#routeView').classList.remove('hidden'); window.scrollTo({top:0,behavior:'instant'});
    if(push){ const url=new URL(location.href);url.searchParams.set('route',id);history.pushState({route:id},'',url); }
    renderRoute(); checkGrantedLocation();
  }
  function closeRoute(push=false){
    stopGPS(); state.route=null; $('#routeView').classList.add('hidden'); $('#homeView').classList.remove('hidden'); if(state.map){state.map.remove();state.map=null;state.mapReady=false;}
    $('#mapPanel').classList.add('hidden'); if(push){const url=new URL(location.href);url.searchParams.delete('route');history.pushState({},'',url);} window.scrollTo({top:0,behavior:'instant'});
  }

  async function renderRoute(){
    const r=state.route,s=currentStop(); if(!r||!s)return;
    $('#routeCity').textContent=`${r.city} · ${r.vibe}`; $('#routeTitle').textContent=r.title; $('#stopProgress').textContent=`${state.index+1} / ${r.stops.length}`;
    $('#stopType').textContent=s.type||'STOP'; $('#stopType').style.background=typeColour(s.type); $('#stopName').textContent=s.name; $('#stopClue').textContent=s.clue;
    $('#routeMeta').textContent=`${r.km} km · ${Math.round(r.steps[0]/1000)}–${Math.round(r.steps[1]/1000)}k`; $('#startHint').textContent=r.transport.startHint; $('#transportNote').textContent=r.transport.note||'';
    $('#officialBtn').classList.toggle('hidden',!r.transport.officialUrl); if(r.transport.officialUrl)$('#officialBtn').href=r.transport.officialUrl;
    $('#prevStopBtn').disabled=state.index===0; $('#skipStopBtn').disabled=state.index>=r.stops.length-1; $('#arrivedBtn').textContent=state.index>=r.stops.length-1?'FINISH ✓':"I'M HERE ✓";
    $('#voiceBtn').classList.toggle('active',state.voice); updateDistance(); renderStopStrip(); updateMap(); saveProgress();
    await PhotoHub.load($('#stopPhoto'),$('#stopFallback'),s,state.currentPhotoVariant);
  }

  function typeColour(type=''){ const t=type.toUpperCase(); if(/RIVER|SEA|COAST/.test(t))return '#2c9cff';if(/QUIET|FOREST|GREEN|GARDEN|RDR2/.test(t))return '#2ebd87';if(/NIGHT|NEON|FUTURE|OTHERWORLD/.test(t))return '#7757ff';if(/EPIC|FANTASY/.test(t))return '#ff3f91';if(/FINISH|START/.test(t))return '#171c35';return '#ff5b73'; }

  function updateDistance(){
    const s=currentStop(); if(!s)return;
    if(!state.position){ $('#distanceText').textContent='Tap GO'; $('#walkTimeText').textContent='Google Maps will handle every turn'; $('#gpsStatus').textContent='GPS off'; $('#navigateLabel').textContent=state.index===0?'GET TO START':'GO WITH VOICE'; return; }
    const d=hav(state.position,s),mins=Math.max(1,Math.round(d/75)); $('#distanceText').textContent=fmtDistance(d); $('#walkTimeText').textContent=d>2000?`about ${mins} min on foot — transit may be better`:`about ${mins} min walk`;
    $('#gpsStatus').textContent=`GPS ±${Math.round(state.position.accuracy||0)}m`; $('#navigateLabel').textContent=(state.index===0&&d>1800)?'GET TO START':'GO WITH VOICE';
  }

  function renderStopStrip(){
    const strip=$('#stopStrip');strip.innerHTML='';state.route.stops.forEach((stop,index)=>{
      const b=document.createElement('button'); b.className=`stop-chip ${index===state.index?'current':''} ${state.visited.has(index)?'done':''}`;
      b.innerHTML=`<div class="stop-thumb"><div class="photo-fallback">${stop.type==='VIEW'?'🌅':'📍'}</div><img alt="" referrerpolicy="no-referrer"></div><b>${index+1}. ${stop.short||stop.name}</b><small>${stop.type||'STOP'}</small>`;
      b.addEventListener('click',()=>{state.index=index;state.currentPhotoVariant=0;renderRoute();b.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});}); strip.appendChild(b);
      if(Math.abs(index-state.index)<=2)PhotoHub.load(b.querySelector('img'),b.querySelector('.photo-fallback'),stop);
    });
    setTimeout(()=>strip.querySelector('.current')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}),60);
  }

  function advance(auto=false){
    if(!state.route)return; const old=currentStop(); state.visited.add(state.index);
    if(state.index<state.route.stops.length-1){state.index++;state.currentPhotoVariant=0;saveProgress();renderRoute(); const next=currentStop(); if(auto)announce(`Arrived at ${old.short||old.name}. Next: ${next.short||next.name}.`); toast(`✓ ${old.short||old.name} · next: ${next.short||next.name}`);}
    else{saveProgress();announce(`Route complete. You made it.`);toast('Route complete 🏁',4000);}
  }
  function skip(){ if(state.index<state.route.stops.length-1){state.index++;state.currentPhotoVariant=0;renderRoute();toast(`Skipped · next: ${currentStop().short||currentStop().name}`);} }

  function announce(text){
    navigator.vibrate?.([90,55,150]); if(!state.voice||!('speechSynthesis'in window))return;
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.03;u.pitch=1;speechSynthesis.speak(u);}catch(_){}
  }

  function requestPosition(options={}){
    return new Promise((resolve,reject)=>{ if(!navigator.geolocation)return reject(new Error('No GPS support')); navigator.geolocation.getCurrentPosition(p=>{applyPosition(p);resolve(state.position)},reject,{enableHighAccuracy:true,timeout:18000,maximumAge:options.fresh?0:5000}); });
  }
  function applyPosition(position){
    state.position={lat:position.coords.latitude,lon:position.coords.longitude,accuracy:position.coords.accuracy,at:position.timestamp}; updateDistance(); updateUserMap();
    if(state.route&&state.gpsWatch!==null){ const d=hav(state.position,currentStop()); const threshold=Math.max(55,Math.min(120,(state.position.accuracy||30)*1.3+35)); state.nearHits=d<threshold?state.nearHits+1:0; if((state.nearHits>=2||d<35)&&Date.now()-state.lastAuto>45000){state.lastAuto=Date.now();state.nearHits=0;advance(true);} }
  }
  function startGPS(){
    if(state.gpsWatch!==null||!navigator.geolocation)return;
    state.locationRequested=true; state.gpsWatch=navigator.geolocation.watchPosition(applyPosition,error=>{ if(error.code===1)toast('Location blocked — Chrome site settings → Location → Allow'); else toast('GPS is struggling. Move outdoors and retry.'); stopGPS(); },{enableHighAccuracy:true,timeout:20000,maximumAge:2500});
  }
  function stopGPS(){ if(state.gpsWatch!==null){navigator.geolocation.clearWatch(state.gpsWatch);state.gpsWatch=null;} }
  async function checkGrantedLocation(){ try{if(!navigator.permissions)return;const p=await navigator.permissions.query({name:'geolocation'});if(p.state==='granted')startGPS();}catch(_){} }

  async function navigate(){
    const stop=currentStop();if(!stop)return; startGPS(); try{await requestPosition({fresh:true});}catch(_){}
    const d=state.position?hav(state.position,stop):Infinity; let mode=stop.legMode||'walking'; if(state.index===0&&d>1800)mode='transit';
    saveProgress(); const url=mapsUrl(`${stop.lat},${stop.lon}`,mode,true); toast('Opening Google Maps voice navigation…',1100); setTimeout(()=>location.href=url,180);
  }

  async function nearestStop(){
    try{await requestPosition({fresh:true});startGPS();}catch(error){toast(error.code===1?'Allow Location in Chrome site settings':'Could not get a GPS fix');return;}
    const candidates=state.route.stops.map((s,i)=>({i,d:hav(state.position,s)})).sort((a,b)=>a.d-b.d); state.index=candidates[0].i;state.currentPhotoVariant=0;renderRoute();toast(`Joined at ${currentStop().short||currentStop().name}`);
  }

  async function locateHome(){
    try{await requestPosition({fresh:true}); state.locationRequested=true; renderGrid(); const weather=state.weather.get('Lisbon'),ctx=weatherContext(weather||{},0); const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,ctx)})).sort((a,b)=>b.score-a.score); if(ranked[0])renderBest(ranked[0].route,ctx); toast(`Location ready · accuracy ±${Math.round(state.position.accuracy)}m`);}catch(error){toast(error.code===1?'Location denied — allow it in Chrome site settings':'Could not get location');}
  }

  function openInfo(item,isRoute=false){
    state.sheetItem=item;$('#infoSheet').classList.remove('hidden');$('#sheetTitle').textContent=item.title||item.name;$('#sheetText').textContent=isRoute?item.description:(item.clue||'');$('#sheetVibe').textContent=isRoute?item.vibe:(item.type||'STOP');$('#sheetVibe').style.background=isRoute?'#7757ff':typeColour(item.type);
    const tags=isRoute?[`${item.duration[0]}–${item.duration[1]} hours`,`${Math.round(item.steps[0]/1000)}–${Math.round(item.steps[1]/1000)}k steps`,item.difficulty,...item.moods.slice(0,3)]:[item.type||'landmark','real photo reference'];
    $('#sheetTags').innerHTML=tags.map(x=>`<span class="tag">${x}</span>`).join('');$('#sheetCredit').textContent='Loading photo credit…';
    PhotoHub.load($('#sheetPhoto'),$('#sheetFallback'),item).then(photo=>{$('#sheetCredit').innerHTML=photo?`Photo: <a href="${photo.page}" target="_blank" rel="noopener">${stripHtml(photo.artist)}</a> · ${stripHtml(photo.licence)}`:'Photo unavailable; visual fallback shown.';});
  }
  function closeSheet(){ $('#infoSheet').classList.add('hidden'); }

  function weatherSheet(){
    const weather=state.weather.get('Lisbon');if(!weather)return toast('Weather is still loading');const ctx=weatherContext(weather,0),[icon,label]=weatherIcon(ctx.code);$('#weatherBigIcon').textContent=icon;$('#weatherTitle').textContent=`Lisbon · ${Math.round(ctx.temp)}°`;$('#weatherSummary').textContent=`${label} · feels ${Math.round(ctx.apparent)}° · wind ${Math.round(ctx.wind)} km/h`;
    const row=$('#forecastRow');row.innerHTML='';for(let i=0;i<5;i++){const d=dayData(weather,i);if(!d)continue;const date=new Date(`${d.date}T12:00:00`),[ic]=weatherIcon(d.code);const el=document.createElement('div');el.className='forecast-day';el.innerHTML=`<b>${i===0?'Today':date.toLocaleDateString('en-GB',{weekday:'short'})}</b><span>${ic}</span><strong>${Math.round(d.max)}°</strong><small>${d.rain||0}% rain</small>`;row.appendChild(el);}$('#weatherSheet').classList.remove('hidden');
  }

  async function loadLeaflet(){
    if(window.L)return true;
    if(!document.querySelector('link[data-leaflet]')){const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';link.dataset.leaflet='1';document.head.appendChild(link);}
    return new Promise(resolve=>{const existing=document.querySelector('script[data-leaflet]');if(existing){existing.addEventListener('load',()=>resolve(true),{once:true});setTimeout(()=>resolve(!!window.L),3000);return;}const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.dataset.leaflet='1';script.onload=()=>resolve(true);script.onerror=()=>resolve(false);document.head.appendChild(script);});
  }
  function pinIcon(stop,index,current=false){return L.divIcon({className:'',html:`<div class="map-pin ${current?'current':''}" style="background:${typeColour(stop.type)}"><span>${index+1}</span></div>`,iconSize:[38,42],iconAnchor:[19,39]});}
  async function toggleMap(){
    const panel=$('#mapPanel');if(!panel.classList.contains('hidden')){panel.classList.add('hidden');return;}panel.classList.remove('hidden');
    const ok=await loadLeaflet();if(!ok){$('#mapFallback').classList.remove('hidden');return;}if(!state.mapReady)initMap();else{setTimeout(()=>state.map.invalidateSize(),60);fitMap();}
  }
  function initMap(){
    try{
      state.map=L.map('routeMap',{zoomControl:false,attributionControl:true}).setView([state.route.stops[0].lat,state.route.stops[0].lon],13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:'© OpenStreetMap © CARTO'}).addTo(state.map);state.mapReady=true;updateMap();setTimeout(()=>{state.map.invalidateSize();fitMap();},100);
    }catch(error){$('#mapFallback').classList.remove('hidden');}
  }
  function updateMap(){
    if(!state.mapReady||!state.route)return;state.mapLayers.forEach(layer=>state.map.removeLayer(layer));state.mapLayers=[];const points=state.route.stops.map(s=>[s.lat,s.lon]);
    state.mapLayers.push(L.polyline(points,{color:'#171c35',weight:11,opacity:.55,lineCap:'round'}).addTo(state.map));state.mapLayers.push(L.polyline(points,{color:'#ff3f91',weight:5,opacity:.97,lineCap:'round'}).addTo(state.map));
    state.route.stops.forEach((s,i)=>{const marker=L.marker([s.lat,s.lon],{icon:pinIcon(s,i,i===state.index)}).addTo(state.map);marker.on('click',()=>{state.index=i;state.currentPhotoVariant=0;renderRoute();});state.mapLayers.push(marker);});updateUserMap();
  }
  function updateUserMap(){
    if(!state.mapReady||!state.position)return;const ll=[state.position.lat,state.position.lon];if(!state.userMarker){state.userMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="user-dot"></div>',iconSize:[25,25],iconAnchor:[12,12]}),zIndexOffset:1000}).addTo(state.map);state.accuracyCircle=L.circle(ll,{radius:state.position.accuracy||30,color:'#4dc8ff',weight:1,fillColor:'#4dc8ff',fillOpacity:.14}).addTo(state.map);}else{state.userMarker.setLatLng(ll);state.accuracyCircle.setLatLng(ll).setRadius(state.position.accuracy||30);}
  }
  function fitMap(){if(!state.mapReady||!state.route)return;state.map.fitBounds(L.latLngBounds(state.route.stops.map(s=>[s.lat,s.lon])).pad(.12));}

  async function saveOffline(){
    if(!state.route)return;const btn=$('#offlineBtn');btn.disabled=true;const label=btn.querySelector('small');const items=[routePhotoItem(state.route),...state.route.stops];await PhotoHub.prefetch(items,(done,total)=>label.textContent=`${done}/${total}`);label.textContent='saved';btn.disabled=false;toast('Route photos saved. Google Maps still needs data.');
  }

  function bind(){
    $('#brandBtn').addEventListener('click',()=>closeRoute(true));$('#backBtn').addEventListener('click',()=>closeRoute(true));$('#shareBtn').addEventListener('click',shareApp);$('#weatherBtn').addEventListener('click',weatherSheet);$('#closeWeather').addEventListener('click',()=>$('#weatherSheet').classList.add('hidden'));$('#weatherSheet').addEventListener('click',e=>{if(e.target===$('#weatherSheet'))$('#weatherSheet').classList.add('hidden');});
    $$('.mood').forEach(b=>b.addEventListener('click',()=>setMood(b.dataset.mood)));$('#locateBtn').addEventListener('click',locateHome);$('#refreshPlanBtn').addEventListener('click',async()=>{toast('Refreshing weather…');await chooseBest(true);renderGrid();await buildFiveDayPlan(true);toast('Plan refreshed');});
    $('#navigateBtn').addEventListener('click',navigate);$('#arrivedBtn').addEventListener('click',()=>advance(false));$('#skipStopBtn').addEventListener('click',skip);$('#prevStopBtn').addEventListener('click',()=>{if(state.index>0){state.index--;state.currentPhotoVariant=0;renderRoute();}});$('#nearestStopBtn').addEventListener('click',nearestStop);$('#mapToggle').addEventListener('click',toggleMap);$('#centreMapBtn').addEventListener('click',()=>{if(state.position&&state.mapReady)state.map.setView([state.position.lat,state.position.lon],16);else fitMap();});$('#offlineBtn').addEventListener('click',saveOffline);$('#voiceBtn').addEventListener('click',()=>{state.voice=!state.voice;safeStore.set('wu-voice',state.voice);$('#voiceBtn').classList.toggle('active',state.voice);toast(state.voice?'Arrival voice on':'Arrival voice off');});
    $('#routeInfoBtn').addEventListener('click',()=>openInfo(state.route,true));$('#stopPhoto').parentElement.addEventListener('click',e=>{if(e.target.closest('button'))return;openInfo(currentStop(),false);});$('#altPhotoBtn').addEventListener('click',async e=>{e.stopPropagation();state.currentPhotoVariant++;await PhotoHub.alternate($('#stopPhoto'),$('#stopFallback'),currentStop());const p=PhotoHub.creditFrom($('#stopPhoto'));toast(p?`Photo by ${stripHtml(p.artist)}`:'No alternate photo found');});
    $('#closeSheet').addEventListener('click',closeSheet);$('#infoSheet').addEventListener('click',e=>{if(e.target===$('#infoSheet'))closeSheet();});
    $('#getThereBtn').addEventListener('click',()=>location.href=mapsStartUrl(state.route));$('#goHomeBtn').addEventListener('click',()=>location.href=mapsHomeUrl());
    window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('route');if(id)openRoute(id,false);else closeRoute(false);});
    document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&state.route){try{await requestPosition({fresh:true});const d=hav(state.position,currentStop());if(d<110&&Date.now()-state.lastAuto>45000){toast(`You appear to be at ${currentStop().short||currentStop().name}. Tap I'M HERE or wait for GPS confirmation.`);startGPS();}}catch(_){}}});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;$('#installBtn').classList.remove('hidden');});$('#installBtn').addEventListener('click',async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$('#installBtn').classList.add('hidden');});$('#reloadBtn').addEventListener('click',()=>location.reload());
  }

  async function shareApp(){ try{if(navigator.share)await navigator.share({title:'Wander Portugal',text:'Photo-first walking worlds with phone-down Google Maps navigation.',url:location.origin+location.pathname});else{await navigator.clipboard.writeText(location.origin+location.pathname);toast('Link copied');}}catch(_){} }

  function registerSW(){
    if(!('serviceWorker'in navigator))return;navigator.serviceWorker.register('./sw.js').then(reg=>{if(reg.waiting)$('#updateBar').classList.remove('hidden');reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)$('#updateBar').classList.remove('hidden');});});}).catch(()=>{});
  }

  async function init(){
    bind();renderGrid();registerSW();await chooseBest();renderGrid();buildFiveDayPlan();
    const id=new URL(location.href).searchParams.get('route');if(id&&routeById(id))openRoute(id,false);
    console.info(`Wander Portugal ${VERSION}: ${ROUTES.length} routes loaded.`);
  }
  init();
})();
