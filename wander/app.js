'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const DATA = window.WANDER_DATA;
  const ROUTES = DATA.routes;
  const HOME = DATA.home;
  const WEATHER_TTL = 30 * 60 * 1000;
  const WEATHER_POINTS = {
    Lisbon:{lat:38.7223,lon:-9.1393}, Almada:{lat:38.686,lon:-9.158},
    Sintra:{lat:38.7979,lon:-9.3908}, Cascais:{lat:38.6979,lon:-9.4215},
    Coimbra:{lat:40.2100,lon:-8.4292}, 'Óbidos':{lat:39.3617,lon:-9.1570},
    Tomar:{lat:39.6038,lon:-8.4154}, 'Évora':{lat:38.5714,lon:-7.9093}
  };
  const WEATHER_CODES = {
    0:['☀️','clear'],1:['🌤️','mostly clear'],2:['⛅','partly cloudy'],3:['☁️','cloudy'],45:['🌫️','foggy'],48:['🌫️','foggy'],
    51:['🌦️','drizzle'],53:['🌦️','drizzle'],55:['🌧️','drizzle'],61:['🌧️','rain'],63:['🌧️','rain'],65:['🌧️','heavy rain'],
    80:['🌦️','showers'],81:['🌧️','showers'],82:['⛈️','heavy showers'],95:['⛈️','thunderstorm'],96:['⛈️','thunderstorm'],99:['⛈️','thunderstorm']
  };

  const store = {
    get(key, fallback){ try { const raw=localStorage.getItem(key); return raw===null?fallback:JSON.parse(raw); } catch(_){ return fallback; } },
    set(key, value){ try { localStorage.setItem(key,JSON.stringify(value)); } catch(_){} }
  };

  const state = {
    mood:'all', position:null, route:null, index:0, visited:new Set(), watch:null, nearHits:0,
    weather:new Map(), installPrompt:null, swRegistration:null, sheetMode:null
  };

  const rad = value => value*Math.PI/180;
  function hav(a,b){
    const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon);
    const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }
  function fmtDistance(m){ return !Number.isFinite(m)?'GPS optional':m<1000?`${Math.max(1,Math.round(m))} m`:`${(m/1000).toFixed(m<10000?1:0)} km`; }
  function toast(message, ms=2800){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(el._timer); el._timer=setTimeout(()=>el.classList.remove('show'),ms); }
  function routeById(id){ return ROUTES.find(route=>route.id===id); }
  function currentStop(){ return state.route?.stops[Math.min(state.index,state.route.stops.length-1)]; }
  function progressKey(route){ return `wander-progress:${route.id}`; }
  function saveProgress(){ if(state.route)store.set(progressKey(state.route),{index:state.index,visited:[...state.visited]}); }
  function loadProgress(route){ const p=store.get(progressKey(route),{index:0,visited:[]}); state.index=Math.min(Number(p.index)||0,route.stops.length-1); state.visited=new Set(Array.isArray(p.visited)?p.visited:[]); }
  function safeText(value){ return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }

  function imageElement(src, alt, className=''){
    const img=document.createElement('img'); img.src=src; img.alt=alt; img.loading='lazy'; img.decoding='async'; img.className=className;
    img.addEventListener('error',()=>{img.style.display='none';});
    return img;
  }
  function setStablePhoto(img, fallback, src, alt){
    fallback.textContent='✨'; fallback.classList.remove('hidden');
    img.style.display='block'; img.alt=alt; img.onerror=()=>{img.style.display='none'; fallback.classList.remove('hidden');};
    img.onload=()=>{fallback.classList.add('hidden');};
    img.src=src;
  }

  function mapsUrl({destination,origin='',mode='walking',navigate=true,waypoints=[]}){
    const url=new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api','1');
    if(origin)url.searchParams.set('origin',origin);
    url.searchParams.set('destination',destination);
    url.searchParams.set('travelmode',mode);
    if(waypoints.length)url.searchParams.set('waypoints',waypoints.join('|'));
    if(navigate)url.searchParams.set('dir_action','navigate');
    return url.toString();
  }
  function openExternal(url){ window.location.href=url; }
  function currentOrigin(){ return state.position?`${state.position.lat},${state.position.lon}`:''; }

  function localClock(){ return new Date(); }
  function parseLocalDateTime(value){ return value?new Date(value):null; }
  function bucketFor(weather){
    const now=localClock(), mins=now.getHours()*60+now.getMinutes();
    const sunrise=parseLocalDateTime(weather?.daily?.sunrise?.[0]);
    const sunset=parseLocalDateTime(weather?.daily?.sunset?.[0]);
    const riseM=sunrise?sunrise.getHours()*60+sunrise.getMinutes():7*60;
    const setM=sunset?sunset.getHours()*60+sunset.getMinutes():20*60;
    if(mins<riseM+110)return 'morning';
    if(mins>=setM-100&&mins<=setM+45)return 'sunset';
    if(mins>setM+45||mins<riseM)return 'night';
    return 'day';
  }
  function fallbackWeather(){ return {current:{temperature_2m:24,apparent_temperature:24,weather_code:1,wind_speed_10m:10},daily:{temperature_2m_max:[29,29,28,28,27,28],temperature_2m_min:[19,19,18,18,18,18],precipitation_probability_max:[5,5,10,10,10,10],weather_code:[1,1,2,2,1,1],uv_index_max:[7,7,6,6,6,6],sunrise:['2026-09-04T07:10'],sunset:['2026-09-04T20:05']},fallback:true}; }
  async function fetchWeather(city='Lisbon', force=false){
    const point=WEATHER_POINTS[city]||WEATHER_POINTS.Lisbon;
    const key=`wander-weather:${city}`;
    if(!force){ const cached=store.get(key,null); if(cached&&Date.now()-cached.at<WEATHER_TTL){state.weather.set(city,cached.data);return cached.data;} }
    const url=new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude',point.lat);url.searchParams.set('longitude',point.lon);url.searchParams.set('timezone','Europe/Lisbon');url.searchParams.set('forecast_days','6');
    url.searchParams.set('current','temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day');
    url.searchParams.set('daily','weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max');
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),6500);
    try{
      const response=await fetch(url,{cache:'no-store',signal:controller.signal}); if(!response.ok)throw new Error(`weather ${response.status}`);
      const data=await response.json(); state.weather.set(city,data); store.set(key,{at:Date.now(),data}); return data;
    }catch(_){ const cached=store.get(key,null); if(cached?.data){state.weather.set(city,cached.data);return cached.data;} return null; }
    finally{clearTimeout(timer);}
  }
  function weatherContext(weather, offset=0){
    const w=weather||fallbackWeather();
    const current=offset===0?w.current:null;
    return {
      bucket:offset===0?bucketFor(w):'day',
      temp:current?.temperature_2m??w.daily?.temperature_2m_max?.[offset]??27,
      feels:current?.apparent_temperature??w.daily?.temperature_2m_max?.[offset]??27,
      code:current?.weather_code??w.daily?.weather_code?.[offset]??1,
      wind:current?.wind_speed_10m??10,
      max:w.daily?.temperature_2m_max?.[offset]??28,
      min:w.daily?.temperature_2m_min?.[offset]??18,
      rain:w.daily?.precipitation_probability_max?.[offset]??10,
      uv:w.daily?.uv_index_max?.[offset]??6,
      sunrise:w.daily?.sunrise?.[offset]||'', sunset:w.daily?.sunset?.[offset]||'', fallback:!!w.fallback
    };
  }

  function scoreRoute(route,ctx,{future=false,usedRoutes=new Set(),usedCities=new Set()}={}){
    let score=0; const hour=localClock().getHours();
    score+=route.times.includes(ctx.bucket)?45:-22;
    if(ctx.bucket==='night'){
      score+=route.nightSafe?55:-135;
      if(route.dayOnly)score-=220;
      if(route.city==='Lisbon')score+=18;
      if(route.city==='Almada'&&hour<23)score+=6;
    }
    if(ctx.bucket==='sunset'){
      if(route.times.includes('sunset'))score+=30;
      if(route.climate.some(x=>['river','coast','breeze','views'].includes(x)))score+=25;
    }
    if(ctx.bucket==='morning'&&route.dayOnly)score+=22;
    const hot=ctx.feels>=30||ctx.max>=32||ctx.uv>=7;
    if(hot){
      if(route.climate.some(x=>['coast','river','breeze','forest','shade'].includes(x)))score+=28;
      if(route.climate.includes('exposed')&&ctx.bucket==='day')score-=28;
      if(route.climate.includes('hot'))score-=25;
    }
    if(ctx.rain>=40){
      if(route.climate.includes('city'))score+=10;
      if(route.climate.some(x=>['coast','exposed','forest'].includes(x)))score-=30;
    }
    if(ctx.wind>=32&&route.climate.includes('coast'))score-=20;
    if(!future){
      if(hour>=13&&route.travelMin>=110)score-=100;
      if(hour>=16&&route.travelMin>=75)score-=120;
      if(hour>=18&&route.travelMin>=55)score-=80;
      if(hour>=15&&route.dayOnly)score-=120;
      if(state.position){ const d=hav(state.position,route.stops[0]); if(d<3000)score+=28;else if(d<12000)score+=12;else if(d>80000)score-=15; }
    }else{
      if(route.dayOnly)score+=18;
      if(route.times.includes('morning'))score+=8;
      if(usedRoutes.has(route.id))score-=180;
      if(usedCities.has(route.city))score-=35;
      if(route.moods.includes('trip'))score+=15;
    }
    return score;
  }
  function reasonFor(route,ctx){
    if(ctx.bucket==='night')return route.city==='Lisbon'?'lit + easy tonight':'cooler evening option';
    if(ctx.bucket==='sunset'&&route.climate.includes('river'))return 'sunset by water';
    if(ctx.bucket==='sunset'&&route.climate.includes('views'))return 'golden-hour skyline';
    if((ctx.feels>=30||ctx.uv>=7)&&route.climate.includes('forest'))return 'shade for the heat';
    if((ctx.feels>=30||ctx.uv>=7)&&route.climate.some(x=>['coast','river','breeze'].includes(x)))return 'cooler air';
    if(ctx.rain>=40&&route.climate.includes('city'))return 'compact in showers';
    if(route.moods.includes('mindblown'))return 'maximum wow';
    if(route.moods.includes('peaceful'))return 'quiet wander';
    return route.vibe.toLowerCase();
  }

  function renderImageInto(container,src,alt){
    const fallback=document.createElement('div'); fallback.className='card-fallback'; fallback.textContent='✨'; container.appendChild(fallback);
    const img=imageElement(src,alt); img.addEventListener('load',()=>fallback.classList.add('hidden')); container.appendChild(img);
  }
  function routeMeta(route){ return `${route.duration[0]}–${route.duration[1]}h · ${Math.round(route.steps[0]/1000)}–${Math.round(route.steps[1]/1000)}k steps`; }

  function renderNow(weather){
    const ctx=weatherContext(weather||fallbackWeather());
    const ranked=ROUTES.map(route=>({route,score:scoreRoute(route,ctx)})).sort((a,b)=>b.score-a.score).slice(0,6);
    const grid=$('#nowGrid'); grid.innerHTML='';
    ranked.forEach(({route},index)=>{
      const card=document.createElement('button');card.className='now-card';
      const fallback=document.createElement('div');fallback.className='card-fallback';fallback.textContent=route.icon;card.appendChild(fallback);
      const img=imageElement(route.cover,route.title);img.addEventListener('load',()=>fallback.classList.add('hidden'));card.appendChild(img);
      card.insertAdjacentHTML('beforeend',`<span class="now-rank">${index+1}</span><span class="now-reason">${safeText(reasonFor(route,ctx))}</span><div class="now-copy"><p>${safeText(route.city)} · ${safeText(route.vibe)}</p><h3>${safeText(route.title)}</h3><div class="now-meta"><span>${route.duration[0]}–${route.duration[1]}h</span><span>${Math.round(route.steps[0]/1000)}–${Math.round(route.steps[1]/1000)}k</span><span>~${route.travelMin}m away</span></div></div>`);
      card.addEventListener('click',()=>openRoute(route.id));grid.appendChild(card);
    });
    const [icon,label]=WEATHER_CODES[ctx.code]||['🌤️','weather'];
    $('#weatherIcon').textContent=icon;$('#weatherTemp').textContent=`${Math.round(ctx.temp)}°`;
    $('#contextLine').textContent=`PORTUGAL · ${ctx.bucket.toUpperCase()} · SIX PICKS NOW`;
    $('#weatherLine').textContent=weather?`${label}, feels ${Math.round(ctx.feels)}° · ${Math.round(ctx.wind)} km/h wind · ${ctx.rain}% rain risk`:'Time-based picks are ready. Live weather is temporarily unavailable.';
  }

  function routeCard(route){
    const card=document.createElement('button');card.className='world-card';card.dataset.moods=route.moods.join(' ');
    const media=document.createElement('div');media.className='world-media';renderImageInto(media,route.cover,route.title);media.insertAdjacentHTML('beforeend',`<span class="world-city">${safeText(route.city)}</span>`);
    const copy=document.createElement('div');copy.className='world-copy';copy.innerHTML=`<p>${safeText(route.vibe)}</p><h3>${safeText(route.title)}</h3><span>${routeMeta(route)}</span>`;
    card.append(media,copy);card.addEventListener('click',()=>openRoute(route.id));return card;
  }
  function renderAll(){
    const grid=$('#allGrid');grid.innerHTML='';let count=0;
    ROUTES.forEach(route=>{const card=routeCard(route);const show=state.mood==='all'||route.moods.includes(state.mood);if(!show)card.classList.add('filtered');else count++;grid.appendChild(card);});
    $('#routeCount').textContent=`${count} walking worlds`;
  }

  function dayName(dateText,offset){
    if(offset===0)return 'TODAY';if(offset===1)return 'TOMORROW';
    const d=dateText?new Date(`${dateText}T12:00:00`):new Date(Date.now()+offset*86400000);
    return d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase();
  }
  function renderFiveDay(plans){
    const grid=$('#fiveDayGrid');grid.innerHTML='';
    plans.forEach((plan,index)=>{
      const {route,ctx,date}=plan;const card=document.createElement('button');card.className='day-card';
      const fallback=document.createElement('div');fallback.className='card-fallback';fallback.textContent=route.icon;card.appendChild(fallback);
      const img=imageElement(route.cover,route.title);img.addEventListener('load',()=>fallback.classList.add('hidden'));card.appendChild(img);
      const [icon]=WEATHER_CODES[ctx.code]||['🌤️'];
      card.insertAdjacentHTML('beforeend',`<span class="day-weather">${icon} ${Math.round(ctx.max)}°</span><div class="day-copy"><span class="day-name">${dayName(date,index)} · ${safeText(route.city)}</span><h3>${safeText(route.title)}</h3><p>${safeText(reasonFor(route,{...ctx,bucket:'day'}))} · ${routeMeta(route)}</p></div>`);
      card.addEventListener('click',()=>openRoute(route.id));grid.appendChild(card);
    });
  }
  function immediatePlan(){
    const fallback=fallbackWeather(), usedRoutes=new Set(), usedCities=new Set(), plans=[];
    for(let offset=0;offset<5;offset++){
      let best=null;
      for(const route of ROUTES){
        const ctx=weatherContext(fallback,offset);if(offset>0)ctx.bucket='day';
        const score=scoreRoute(route,ctx,{future:offset>0,usedRoutes,usedCities});
        if(!best||score>best.score)best={route,ctx,score,date:new Date(Date.now()+offset*86400000).toISOString().slice(0,10)};
      }
      if(best){plans.push(best);usedRoutes.add(best.route.id);usedCities.add(best.route.city);}
    }
    return plans;
  }

  async function buildPlan(force=false){
    $('#planStatus').textContent='Updating the next five days…';
    const cities=[...new Set(ROUTES.map(r=>r.city))];
    await Promise.all(cities.map(city=>fetchWeather(city,force)));
    const usedRoutes=new Set(),usedCities=new Set(),plans=[];
    for(let offset=0;offset<5;offset++){
      let best=null;
      for(const route of ROUTES){
        const weather=state.weather.get(route.city)||state.weather.get('Lisbon')||fallbackWeather();
        const ctx=weatherContext(weather,offset);if(offset>0)ctx.bucket='day';
        const score=scoreRoute(route,ctx,{future:offset>0,usedRoutes,usedCities});
        if(!best||score>best.score)best={route,ctx,score,date:weather.daily?.time?.[offset]};
      }
      if(best){plans.push(best);usedRoutes.add(best.route.id);usedCities.add(best.route.city);}
    }
    renderFiveDay(plans);$('#planStatus').textContent='Weather-matched and deliberately varied.';
  }

  function renderRoute(){
    const route=state.route,stop=currentStop();if(!route||!stop)return;
    $('#routeCity').textContent=`${route.city} · ${route.vibe}`;$('#routeTitle').textContent=route.title;
    $('#stopProgress').textContent=`${state.index+1} / ${route.stops.length}`;$('#stopName').textContent=stop.name;$('#stopClue').textContent=stop.clue;
    setStablePhoto($('#stopPhoto'),$('#stopFallback'),stop.photo,stop.name);
    const d=state.position?hav(state.position,stop):NaN;$('#distanceText').textContent=Number.isFinite(d)?fmtDistance(d):'Ready';
    $('#distanceSub').textContent=Number.isFinite(d)?`about ${Math.max(1,Math.round(d/80))} min walking · Maps handles turns`:'Google Maps will speak every turn';
    $('#gpsPill').textContent=state.position?`GPS ±${Math.round(state.position.accuracy||0)}m`:'GPS optional';
    $('#previousButton').disabled=state.index===0;$('#nextButton').disabled=state.index>=route.stops.length-1;
    $('#routeMeta').textContent=routeMeta(route);$('#transportText').textContent=route.transport;
    $('#bookButton').classList.toggle('hidden',!route.book);if(route.book)$('#bookButton').href=route.book;
    renderStopList();saveProgress();
  }
  function renderStopList(){
    const list=$('#stopList');list.innerHTML='';
    state.route.stops.forEach((stop,index)=>{
      const row=document.createElement('button');row.className=`stop-row ${index===state.index?'current':''} ${state.visited.has(stop.id)?'done':''}`;
      const thumb=document.createElement('div');thumb.className='stop-thumb';const img=imageElement(stop.photo,stop.name);thumb.appendChild(img);
      const copy=document.createElement('div');copy.innerHTML=`<h3>${safeText(stop.name)}</h3><p>${safeText(stop.clue)}</p>`;
      const number=document.createElement('span');number.className='stop-number';number.textContent=state.visited.has(stop.id)?'✓':index+1;
      row.append(thumb,copy,number);row.addEventListener('click',()=>{state.index=index;renderRoute();window.scrollTo({top:0,behavior:'smooth'});});list.appendChild(row);
    });
  }
  function openRoute(id){
    const route=routeById(id);if(!route)return;state.route=route;loadProgress(route);
    $('#homeView').classList.add('hidden');$('#routeView').classList.remove('hidden');renderRoute();
    history.replaceState({route:id},'',`?route=${encodeURIComponent(id)}`);window.scrollTo(0,0);
  }
  function closeRoute(){
    stopWatching();state.route=null;$('#routeView').classList.add('hidden');$('#homeView').classList.remove('hidden');history.replaceState({},'',location.pathname);window.scrollTo(0,0);
  }
  function advance(mark=true){
    if(!state.route)return;const stop=currentStop();if(mark)state.visited.add(stop.id);
    if(state.index<state.route.stops.length-1){state.index++;navigator.vibrate?.([70,45,70]);renderRoute();toast(`Next: ${currentStop().name}`);}else{toast('Route complete — excellent work.');}
  }

  function onPosition(pos){
    state.position={lat:pos.coords.latitude,lon:pos.coords.longitude,accuracy:pos.coords.accuracy};
    $('#gpsPill').textContent=`GPS ±${Math.round(pos.coords.accuracy)}m`;
    if(state.route){
      const d=hav(state.position,currentStop());
      if(pos.coords.accuracy<=80&&d<=65&&document.visibilityState==='visible')state.nearHits++;else state.nearHits=0;
      if(state.nearHits>=2&&state.index<state.route.stops.length-1){state.nearHits=0;state.visited.add(currentStop().id);advance(false);toast('Landmark reached automatically.');}
      renderRoute();
    }
  }
  function locationError(error){ const text=error.code===1?'Location is blocked. Allow it in Chrome site settings.':'Could not get a reliable location yet.';toast(text); }
  function startLocation(watch=false){
    return new Promise((resolve,reject)=>{
      if(!navigator.geolocation){toast('Location is not available in this browser.');reject(new Error('no geolocation'));return;}
      navigator.geolocation.getCurrentPosition(pos=>{onPosition(pos);if(watch&&state.watch===null)state.watch=navigator.geolocation.watchPosition(onPosition,locationError,{enableHighAccuracy:true,maximumAge:3000,timeout:18000});resolve(state.position);},err=>{locationError(err);reject(err);},{enableHighAccuracy:true,maximumAge:5000,timeout:18000});
    });
  }
  function stopWatching(){ if(state.watch!==null){navigator.geolocation.clearWatch(state.watch);state.watch=null;} }

  function openSheet(html,mode='info'){$('#sheetContent').innerHTML=html;$('#sheet').classList.remove('hidden');state.sheetMode=mode;}
  function closeSheet(){$('#sheet').classList.add('hidden');state.sheetMode=null;}
  function routeInfoSheet(){
    const r=state.route;openSheet(`<div class="sheet-hero"><img src="${r.cover}" alt="${safeText(r.title)}" onerror="this.style.display='none'"></div><p class="eyebrow">${safeText(r.city)} · ${safeText(r.vibe)}</p><h2>${safeText(r.title)}</h2><p>${safeText(r.subtitle)}</p><div class="diagnostic"><div><span>Time</span><b>${r.duration[0]}–${r.duration[1]}h</b></div><div><span>Walking</span><b>${Math.round(r.steps[0]/1000)}–${Math.round(r.steps[1]/1000)}k steps</b></div><div><span>From home</span><b>about ${r.travelMin} min</b></div></div><p>${safeText(r.transport)}</p>`, 'route');
  }
  async function saveRoutePhotos(){
    if(!state.route)return;const button=$('#saveRouteButton');button.disabled=true;button.querySelector('b').textContent='SAVING…';
    try{
      const cache=await caches.open('wander-route-photos-v2');const urls=[...new Set([state.route.cover,...state.route.stops.map(s=>s.photo)])];
      let done=0;for(const url of urls){try{await cache.add(new Request(url,{cache:'reload'}));done++;button.querySelector('b').textContent=`${done}/${urls.length}`;}catch(_){}}
      toast(`${done}/${urls.length} route photos saved.`);
    }catch(_){toast('Photo saving is unavailable in this browser.');}
    finally{button.disabled=false;button.querySelector('b').textContent='SAVE PHOTOS';}
  }

  async function installDiagnostics(){
    const rows=[];
    const check=async(label,url)=>{try{const r=await fetch(url,{cache:'no-store'});rows.push([label,r.ok?'ready':`HTTP ${r.status}`,r.ok]);}catch(_){rows.push([label,'unavailable',false]);}};
    await check('Manifest','./manifest.webmanifest');await check('192px PNG','./icons/icon-192.png');await check('512px PNG','./icons/icon-512.png');
    rows.push(['Secure HTTPS',location.protocol==='https:'?'ready':'not secure',location.protocol==='https:']);
    rows.push(['Service worker',state.swRegistration?'ready':'registering',!!state.swRegistration]);
    return rows;
  }
  function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
  async function showInstallSheet(){
    const rows=await installDiagnostics();
    const status=standalone()?'Wander is already installed.':state.installPrompt?'Wander is ready to install.':'Chrome has not offered the native install prompt yet.';
    openSheet(`<p class="eyebrow">INSTALL WANDER</p><h2>Add it without the endless spinner</h2><p class="sheet-status">${status}</p><div class="diagnostic">${rows.map(([a,b,ok])=>`<div><span>${a}</span><b class="${ok?'good':'bad'}">${b}</b></div>`).join('')}</div><p>Best fallback on Android Chrome: tap <b>⋮</b> → <b>Add to Home screen</b>. This new app has a separate identity from the broken older build.</p><div class="sheet-actions"><button id="nativeInstall" class="sheet-button primary">INSTALL NOW</button><button id="repairInstall" class="sheet-button">RESET THIS APP</button></div>`, 'install');
    $('#nativeInstall').addEventListener('click',triggerInstall);$('#repairInstall').addEventListener('click',repairInstall);
  }
  async function triggerInstall(){
    if(standalone()){toast('Wander is already installed.');closeSheet();return;}
    if(!state.installPrompt){toast('Use Chrome ⋮ → Add to Home screen. No spinner needed.',4200);return;}
    const prompt=state.installPrompt;state.installPrompt=null;closeSheet();
    try{
      await prompt.prompt();
      const choice=await Promise.race([prompt.userChoice,new Promise(resolve=>setTimeout(()=>resolve({outcome:'timeout'}),9000))]);
      if(choice.outcome==='accepted')toast('Install accepted. Check your home screen in a moment.',4500);
      else if(choice.outcome==='timeout')toast('Chrome did not finish the prompt. Use ⋮ → Add to Home screen.',5000);
      else toast('Install cancelled. You can try again from Chrome’s menu.');
    }catch(_){toast('Use Chrome ⋮ → Add to Home screen.',4000);}
  }
  async function repairInstall(){
    try{
      const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.filter(r=>r.scope.includes('/wander/')).map(r=>r.unregister()));
      const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('wander-v2')).map(k=>caches.delete(k)));
      toast('Reset complete. Reloading cleanly…');setTimeout(()=>location.reload(),900);
    }catch(_){toast('Reset failed. Clear this site in Chrome settings.');}
  }

  async function showWeatherSheet(){
    const weather=state.weather.get('Lisbon')||await fetchWeather('Lisbon');const w=weather||fallbackWeather();const ctx=weatherContext(w);
    const days=(w.daily?.time||[]).slice(0,5).map((date,i)=>{const [icon]=WEATHER_CODES[w.daily.weather_code[i]]||['🌤️'];return `<div><b>${i===0?'Today':new Date(date+'T12:00').toLocaleDateString('en-GB',{weekday:'short'})}</b><span>${icon} ${Math.round(w.daily.temperature_2m_max[i])}°</span><small>${w.daily.precipitation_probability_max[i]}% rain</small></div>`;}).join('');
    openSheet(`<p class="eyebrow">LISBON WEATHER</p><h2>${(WEATHER_CODES[ctx.code]||['','Weather'])[0]} ${Math.round(ctx.temp)}° · feels ${Math.round(ctx.feels)}°</h2><p>${Math.round(ctx.wind)} km/h wind · ${ctx.rain}% daily rain risk. Recommendations use this automatically.</p><div class="diagnostic">${days}</div><p>For official warnings and monument closures, check the relevant official service before a long day trip.</p>`,'weather');
  }

  function bind(){
    $('#homeBtn').addEventListener('click',closeRoute);$('#backButton').addEventListener('click',closeRoute);
    $('#weatherButton').addEventListener('click',showWeatherSheet);$('#installButton').addEventListener('click',showInstallSheet);
    $('#locateButton').addEventListener('click',async()=>{try{await startLocation(false);toast('Location added to the ranking.');const w=await fetchWeather('Lisbon',true);renderNow(w);renderAll();}catch(_){}});
    $('#refreshButton').addEventListener('click',async()=>{const w=await fetchWeather('Lisbon',true);renderNow(w);await buildPlan(true);});
    $$('.mood').forEach(button=>button.addEventListener('click',()=>{state.mood=button.dataset.mood;$$('.mood').forEach(b=>b.classList.toggle('active',b===button));renderAll();}));
    $('#routeInfoButton').addEventListener('click',routeInfoSheet);$('#goButton').addEventListener('click',()=>{const s=currentStop();openExternal(mapsUrl({origin:currentOrigin(),destination:`${s.lat},${s.lon}`,mode:'walking',navigate:true}));});
    $('#previousButton').addEventListener('click',()=>{if(state.index>0){state.index--;renderRoute();}});$('#nextButton').addEventListener('click',()=>advance(false));$('#arrivedButton').addEventListener('click',()=>advance(true));
    $('#nearestButton').addEventListener('click',async()=>{try{await startLocation(true);let best={index:0,distance:Infinity};state.route.stops.forEach((s,i)=>{const d=hav(state.position,s);if(d<best.distance)best={index:i,distance:d};});state.index=best.index;renderRoute();toast(`Joined at ${currentStop().name}.`);}catch(_){}});
    $('#saveRouteButton').addEventListener('click',saveRoutePhotos);$('#overviewButton').addEventListener('click',()=>{$('#routeOverview').classList.toggle('hidden');});
    $('#startButton').addEventListener('click',()=>{const first=state.route.stops[0];openExternal(mapsUrl({origin:HOME.name,destination:`${first.lat},${first.lon}`,mode:'transit',navigate:false}));});
    $('#homeButton').addEventListener('click',()=>openExternal(mapsUrl({origin:currentOrigin(),destination:HOME.name,mode:'transit',navigate:false})));
    $('#closeSheet').addEventListener('click',closeSheet);$('#sheet').addEventListener('click',event=>{if(event.target===$('#sheet'))closeSheet();});
    window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.installPrompt=event;$('#installButton').textContent='↓';});
    window.addEventListener('appinstalled',()=>{state.installPrompt=null;$('#installButton').textContent='✓';toast('Wander installed successfully.');});
    window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('route');if(id)openRoute(id);else if(state.route)closeRoute();});
  }

  async function registerSW(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registration=await navigator.serviceWorker.register('./sw.js?v=2.0.0',{scope:'./',updateViaCache:'none'});state.swRegistration=registration;registration.update().catch(()=>{});
    }catch(error){console.warn('Service worker registration failed',error);}
  }

  async function init(){
    renderAll();renderNow(fallbackWeather());renderFiveDay(immediatePlan());buildPlan(false);
    bind();registerSW();
    const routeId=new URLSearchParams(location.search).get('route');if(routeById(routeId))openRoute(routeId);
    const weather=await fetchWeather('Lisbon');renderNow(weather||fallbackWeather());buildPlan(false);
  }
  init();
})();
