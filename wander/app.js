'use strict';
(() => {
  const DATA = window.WANDER_DATA;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const storage = (() => {
    try { localStorage.setItem('__wander_test','1'); localStorage.removeItem('__wander_test'); return localStorage; }
    catch { return {getItem:()=>null,setItem:()=>{},removeItem:()=>{}}; }
  })();
  const read = (key, fallback) => { try { const v=storage.getItem(key); return v===null?fallback:JSON.parse(v); } catch { return fallback; } };
  const write = (key, value) => { try { storage.setItem(key, JSON.stringify(value)); } catch {} };

  const routeLookup = new Map();
  DATA.cities.forEach(city => city.routes.forEach(route => routeLookup.set(route.id, {city, route})));

  const state = {
    view: 'home', city: null, route: null, stop: 0,
    home: read('wander-home-v20', DATA.defaultHome),
    progress: read('wander-progress-v20', {}),
    position: null, gpsWatch: null, gpsAsked: false,
    map: null, tileLayer: null, routeLayer: null, markerLayer: null,
    userMarker: null, accuracyCircle: null, mapRouteId: null,
    media: read('wander-media-v20', {}),
    detailStop: null, nearSorted: false, closeBuzzedFor: null,
  };

  const views = {home:$('#homeView'), routes:$('#routesView'), active:$('#activeView')};
  const backBtn=$('#backBtn');

  function stripHtml(value='') {
    const d=document.createElement('div'); d.innerHTML=value; return (d.textContent||'').trim().replace(/\s+/g,' ');
  }
  function slugKey(title, lang='en'){ return `${lang}:${title}`; }

  async function wikiMedia(title, lang='en') {
    if (!title) return null;
    const key=slugKey(title,lang);
    if (state.media[key]) return state.media[key];
    try {
      const api=`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages%7Cinfo&inprop=url&piprop=name%7Cthumbnail&pithumbsize=1200&titles=${encodeURIComponent(title)}`;
      const data=await fetch(api,{cache:'force-cache'}).then(r=>r.json());
      const page=Object.values(data?.query?.pages||{})[0];
      if (!page || page.missing!==undefined) throw new Error('No page');
      let media={src:page.thumbnail?.source||'',source:page.fullurl||`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ','_'))}`,credit:'Wikipedia / Wikimedia Commons',license:'See source'};
      if (page.pageimage) {
        try {
          const cApi=`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1200&titles=${encodeURIComponent('File:'+page.pageimage)}`;
          const cData=await fetch(cApi,{cache:'force-cache'}).then(r=>r.json());
          const cPage=Object.values(cData?.query?.pages||{})[0];
          const info=cPage?.imageinfo?.[0];
          if(info){
            media={
              src:info.thumburl||info.url||media.src,
              source:info.descriptionurl||media.source,
              credit:stripHtml(info.extmetadata?.Artist?.value||info.extmetadata?.Credit?.value||'Wikimedia Commons'),
              license:stripHtml(info.extmetadata?.LicenseShortName?.value||info.extmetadata?.UsageTerms?.value||'See source')
            };
          }
        } catch {}
      }
      state.media[key]=media; write('wander-media-v20',state.media); return media;
    } catch {
      const media={src:'',source:`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ','_'))}`,credit:'',license:''};
      state.media[key]=media; write('wander-media-v20',state.media); return media;
    }
  }

  function loadPhoto(img, fallback, title, accent='#7559ff', callback=null) {
    if(!img || !fallback) return;
    img.style.display='none'; img.removeAttribute('src');
    fallback.style.background=`linear-gradient(135deg,${accent},#ff3ec9)`;
    fallback.style.display='grid';
    img.dataset.title=title||'';
    wikiMedia(title).then(media=>{
      if(img.dataset.title!==(title||'')) return;
      if(media?.src){
        img.onload=()=>{img.style.display='block';fallback.style.display='none';};
        img.onerror=()=>{img.style.display='none';fallback.style.display='grid';};
        img.src=media.src;
      }
      callback?.(media);
    });
  }

  function toast(text, ms=2600){ const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),ms); }

  function haversine(a,b){
    const R=6371000,rad=x=>x*Math.PI/180;
    const p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon);
    const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }
  function fmtDistance(m){ if(!Number.isFinite(m))return 'GPS off'; return m<1000?`${Math.max(1,Math.round(m/10)*10)} m`:`${(m/1000).toFixed(m<10000?1:0)} km`; }
  function walkMinutes(m){ if(!Number.isFinite(m))return '—'; return Math.max(1,Math.round((m*1.23)/78)); }
  function mapsNav(stop){
    const d=`${stop.lat},${stop.lon}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}&travelmode=walking&dir_action=navigate&utm_source=wander_portugal&utm_campaign=directions_request`;
  }
  function mapsTransit(stop){
    const d=`${stop.lat},${stop.lon}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}&travelmode=transit&utm_source=wander_portugal&utm_campaign=transit_request`;
  }
  function mapsHome(){
    const d=`${state.home.lat},${state.home.lon}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d)}&travelmode=transit&utm_source=wander_portugal&utm_campaign=home_request`;
  }
  function streetView(stop){
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(`${stop.lat},${stop.lon}`)}&utm_source=wander_portugal&utm_campaign=place_preview`;
  }

  function getProgress(routeId){
    if(!state.progress[routeId]) state.progress[routeId]={stop:0,visited:[],complete:false};
    return state.progress[routeId];
  }
  function saveProgress(){ write('wander-progress-v20',state.progress); }
  function isVisited(stop){ return state.route?getProgress(state.route.id).visited.includes(stop.id):false; }

  function setView(name){
    state.view=name;
    Object.entries(views).forEach(([k,v])=>v.classList.toggle('hidden',k!==name));
    backBtn.classList.toggle('hidden',name==='home');
    window.scrollTo({top:0,behavior:'auto'});
    if(name==='active') setTimeout(()=>state.map?.invalidateSize(),80);
  }

  function smartRoute(){
    const h=new Date().getHours();
    let id;
    if(h>=20||h<5) id='lisbon-night';
    else if(h<10) id='sintra-peaks';
    else if(h<14) id='lisbon-hills';
    else if(h<17) id='cascais-loop';
    else if(h<20) id='almada-sunset';
    else id='lisbon-night';
    return routeLookup.get(id);
  }

  function routeCardHtml(route, mini=false){
    const cls=mini?'mini-route':'route-card';
    const inner=mini
      ? `<span class="fallback">${route.emoji}</span><img alt="" loading="lazy"><div class="mini-route-copy"><span class="pill glass">${route.when}</span><h3>${route.name}</h3><p>${route.time} · ${route.steps} steps</p></div>`
      : `<span class="fallback">${route.emoji}</span><img alt="" loading="lazy"><div class="route-card-copy"><div class="route-badges"><span>${route.when}</span><span>${route.time}</span><span>${route.steps}</span></div><h3>${route.name}</h3><p>${route.subtitle}</p></div>`;
    return `<article class="${cls}" data-route="${route.id}" style="background:linear-gradient(135deg,${route.accent},#7559ff)">${inner}</article>`;
  }

  function hydrateRouteCards(root=document){
    $$('[data-route]',root).forEach(card=>{
      const hit=routeLookup.get(card.dataset.route); if(!hit)return;
      const img=$('img',card),fb=$('.fallback',card); if(img&&fb)loadPhoto(img,fb,hit.route.heroWiki,hit.route.accent);
      card.addEventListener('click',()=>openRoute(hit.city,hit.route));
    });
  }

  function renderHome(){
    const smart=smartRoute();
    $('#smartTitle').textContent=`${smart.route.emoji} ${smart.city.name} · ${smart.route.name}`;
    $('#smartMeta').textContent=`${smart.route.time} · ${smart.route.steps} steps · ${smart.route.when}`;
    $('#smartBadge').textContent=new Date().getHours()>=20||new Date().getHours()<5?'BEST TONIGHT':'BEST NOW';
    loadPhoto($('#smartImg'),$('.smart-fallback'),smart.route.heroWiki,smart.route.accent);
    const activateSmart=()=>openRoute(smart.city,smart.route);
    $('#smartCard').onclick=activateSmart; $('#smartCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' ')activateSmart()};

    const top=DATA.topFive.map(id=>routeLookup.get(id)?.route).filter(Boolean);
    $('#topRoutes').innerHTML=top.map(r=>routeCardHtml(r,true)).join(''); hydrateRouteCards($('#topRoutes'));

    const cities=[...DATA.cities];
    if(state.nearSorted&&state.position){cities.sort((a,b)=>haversine(state.position,a.routes[0].waypoints[0])-haversine(state.position,b.routes[0].waypoints[0]));}
    else cities.sort((a,b)=>a.priority-b.priority);
    $('#cityGrid').innerHTML=cities.map(city=>`<article class="city-card" data-city="${city.id}" style="background:linear-gradient(135deg,${city.accent},#7559ff)"><span class="fallback">${city.emoji}</span><img alt="" loading="lazy"><span class="city-meta">${city.routes.length} walk${city.routes.length>1?'s':''}</span><div class="city-card-copy"><h3>${city.name}</h3><p>${city.tagline}</p></div></article>`).join('');
    $$('[data-city]',$('#cityGrid')).forEach(card=>{
      const city=DATA.cities.find(c=>c.id===card.dataset.city);loadPhoto($('img',card),$('.fallback',card),city.heroWiki,city.accent);card.onclick=()=>showCity(city);
    });
  }

  function showCity(city){
    state.city=city; setView('routes');
    $('#cityName').textContent=city.name;$('#cityTagline').textContent=city.tagline;$('#cityTransport').textContent=city.transport;$('#citySource').href=city.source;
    $('#cityHeroFallback').textContent=city.emoji;loadPhoto($('#cityHeroImg'),$('#cityHeroFallback'),city.heroWiki,city.accent);
    $('#routeGrid').innerHTML=city.routes.map(r=>routeCardHtml(r,false)).join('');hydrateRouteCards($('#routeGrid'));
    history.replaceState(null,'',`?city=${encodeURIComponent(city.id)}&v=20`);
  }

  function openRoute(city,route){
    state.city=city;state.route=route;const p=getProgress(route.id);state.stop=Math.min(p.stop,route.waypoints.length-1);
    $('#sheetRouteBadge').textContent=route.when;$('#sheetRouteName').textContent=`${route.emoji} ${route.name}`;$('#sheetRouteMeta').textContent=`${city.name} · ${route.time} · ${route.steps} steps · ${route.level}`;
    $('#routeNotice').textContent=route.notice;$('#getThereBtn').href=mapsTransit(route.waypoints[0]);$('#routeSourceBtn').href=route.source||city.source;
    $('#ticketBtn').classList.toggle('hidden',!route.ticketUrl);if(route.ticketUrl)$('#ticketBtn').href=route.ticketUrl;
    renderStopList();openSheet($('#routeSheet'));
    history.replaceState(null,'',`?route=${encodeURIComponent(route.id)}&v=20`);
  }

  function renderStopList(){
    const route=state.route,p=getProgress(route.id);
    $('#stopList').innerHTML=route.waypoints.map((s,i)=>`<article class="stop-row ${i===state.stop?'active':''} ${p.visited.includes(s.id)?'done':''}" data-stop="${i}"><span class="stop-index">${p.visited.includes(s.id)?'✓':i+1}</span><div><h3>${s.icon} ${s.name}</h3><p>${s.cue}</p></div><button aria-label="Select stop">→</button></article>`).join('');
    $$('[data-stop]',$('#stopList')).forEach(row=>row.onclick=()=>{state.stop=Number(row.dataset.stop);p.stop=state.stop;saveProgress();closeSheets();startActive(false);});
  }

  function openSheet(el){el.classList.add('open');el.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeSheets(){ $$('.sheet-backdrop.open').forEach(s=>{s.classList.remove('open');s.setAttribute('aria-hidden','true')});document.body.style.overflow=''; }

  function startActive(reset=false){
    if(!state.route)return;
    const p=getProgress(state.route.id);if(reset){p.stop=0;p.visited=[];p.complete=false;state.stop=0;saveProgress();}else state.stop=Math.min(state.stop??p.stop,state.route.waypoints.length-1);
    p.stop=state.stop;saveProgress();setView('active');
    $('#activeRouteName').textContent=`${state.city.name} · ${state.route.name}`;
    initMap();drawMap();renderActive();startGps();history.replaceState(null,'',`?route=${encodeURIComponent(state.route.id)}&active=1&stop=${state.stop}&v=20`);
  }

  function currentStop(){return state.route.waypoints[Math.max(0,Math.min(state.stop,state.route.waypoints.length-1))];}

  function renderActive(){
    if(!state.route)return;const stop=currentStop(),p=getProgress(state.route.id),n=state.route.waypoints.length;
    $('#stopCount').textContent=`${state.stop+1} / ${n}`;$('#stopName').textContent=stop.name;$('#stopCue').textContent=stop.cue;$('#activeRouteName').textContent=`${state.city.name} · ${state.route.name}`;
    let mediaForCredit=null;loadPhoto($('#stopImg'),$('#stopFallback'),stop.wiki,state.route.accent,m=>mediaForCredit=m);$('#stopFallback').textContent=stop.icon;
    const d=state.position?haversine(state.position,stop):NaN,close=Number.isFinite(d)&&d<120;
    $('#stopDistance').textContent=fmtDistance(d);$('#walkEstimate').textContent=`≈ ${walkMinutes(d)} min`;
    $('#navStateText').textContent=p.complete?'COMPLETE':close?'YOU ARE HERE':'NEXT';$('#navCard').classList.toggle('close',close);
    $('#goBtn').href=p.complete?mapsHome():mapsNav(stop);$('#goLabel').textContent=p.complete?'HOME':'GO';
    $('#streetBtn').href=streetView(stop);$('#skipBtn').disabled=state.stop>=n-1;
    const visitedCount=p.visited.length;$('#progressBar').style.width=`${Math.min(100,Math.round((visitedCount/n)*100))}%`;
    renderMapMarkers();
  }

  function initMap(){
    if(state.map||!window.L)return;
    state.map=L.map('map',{zoomControl:false,attributionControl:true,minZoom:5,maxZoom:20,rotate:false}).setView([38.72,-9.14],13);
    state.tileLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:'© OpenStreetMap © CARTO'}).addTo(state.map);
    state.markerLayer=L.layerGroup().addTo(state.map);
    state.map.on('dragstart',()=>{});
  }

  function markerIcon(stop,index,status){
    const cls=`route-pin ${status}`;return L.divIcon({className:'route-line-label',html:`<div class="${cls}" style="background:${state.route.accent}">${status==='done'?'✓':index+1}</div>`,iconSize:status==='next'?[44,44]:[34,34],iconAnchor:status==='next'?[22,22]:[17,17]});
  }
  function drawMap(){
    if(!state.map||!state.route)return;state.markerLayer.clearLayers();if(state.routeLayer)state.map.removeLayer(state.routeLayer);
    const p=getProgress(state.route.id),pts=state.route.waypoints.map(s=>[s.lat,s.lon]);
    state.routeLayer=L.polyline(pts,{color:state.route.accent,weight:6,opacity:.88,dashArray:'11 8',lineCap:'round'}).addTo(state.map);
    state.route.waypoints.forEach((s,i)=>{const status=p.visited.includes(s.id)?'done':i===state.stop?'next':'';const m=L.marker([s.lat,s.lon],{icon:markerIcon(s,i,status),zIndexOffset:i===state.stop?1000:0}).addTo(state.markerLayer);m.on('click',()=>showStopDetail(s,i));});
    const bounds=L.latLngBounds(pts);state.map.fitBounds(bounds.pad(.13),{animate:false});state.mapRouteId=state.route.id;
    if(state.position)drawUser();
  }
  function renderMapMarkers(){if(!state.map||state.mapRouteId!==state.route?.id)return;drawMapKeepView();}
  function drawMapKeepView(){
    if(!state.map||!state.route)return;const center=state.map.getCenter(),zoom=state.map.getZoom();drawMap();state.map.setView(center,zoom,{animate:false});
  }
  function drawUser(){
    if(!state.map||!state.position)return;const p=[state.position.lat,state.position.lon];
    if(!state.userMarker){state.userMarker=L.marker(p,{icon:L.divIcon({className:'route-line-label',html:'<div class="user-puck"></div>',iconSize:[26,26],iconAnchor:[13,13]}),zIndexOffset:2000}).addTo(state.map);state.accuracyCircle=L.circle(p,{radius:state.position.acc||20,color:'#2389ff',weight:1,fillColor:'#2389ff',fillOpacity:.1}).addTo(state.map);}else{state.userMarker.setLatLng(p);state.accuracyCircle.setLatLng(p).setRadius(state.position.acc||20);}
  }
  function fitMap(){if(!state.map||!state.route)return;state.map.fitBounds(L.latLngBounds(state.route.waypoints.map(s=>[s.lat,s.lon])).pad(.13));}
  function recenter(){if(!state.map)return;if(state.position)state.map.flyTo([state.position.lat,state.position.lon],16,{duration:.6});else{const s=currentStop();state.map.flyTo([s.lat,s.lon],16,{duration:.6});}}

  function updatePosition(pos){
    state.position={lat:pos.coords.latitude,lon:pos.coords.longitude,acc:pos.coords.accuracy||0,ts:pos.timestamp};state.gpsAsked=true;$('#gpsStatus').textContent=`GPS ±${Math.round(state.position.acc)}m`;$('#gpsPill').textContent=`YOU · ±${Math.round(state.position.acc)}m`;drawUser();
    if(state.view==='home'&&state.nearSorted)renderHome();
    if(state.view==='active'){
      const d=haversine(state.position,currentStop());
      if(d<120&&state.closeBuzzedFor!==currentStop().id){state.closeBuzzedFor=currentStop().id;navigator.vibrate?.([80,50,110]);toast(`You’re at ${currentStop().name} — tap HERE`,3200);}
      renderActive();
    }
  }
  function gpsError(err){state.gpsAsked=true;$('#gpsStatus').textContent='GPS blocked';$('#gpsPill').textContent='GPS blocked';if(err.code===1)toast('Allow Location in Chrome site settings. Google Maps navigation still works.',4200);}
  function startGps(){
    if(!navigator.geolocation)return;
    if(state.gpsWatch!==null)return;
    state.gpsWatch=navigator.geolocation.watchPosition(updatePosition,gpsError,{enableHighAccuracy:true,maximumAge:5000,timeout:18000});
  }
  function getOnePosition(done){
    if(state.position){done?.(state.position);return;}
    if(!navigator.geolocation){toast('Location is unavailable');return;}
    navigator.geolocation.getCurrentPosition(p=>{updatePosition(p);done?.(state.position)},gpsError,{enableHighAccuracy:true,maximumAge:3000,timeout:15000});
  }

  function nearestStop(){
    getOnePosition(pos=>{
      const distances=state.route.waypoints.map((s,i)=>({i,d:haversine(pos,s)})).sort((a,b)=>a.d-b.d);const best=distances[0];state.stop=best.i;const p=getProgress(state.route.id);p.stop=best.i;saveProgress();renderActive();drawMapKeepView();state.map?.flyTo([state.route.waypoints[best.i].lat,state.route.waypoints[best.i].lon],15);toast(`Joined at ${state.route.waypoints[best.i].name}`);
    });
  }

  function markArrived(){
    const p=getProgress(state.route.id),stop=currentStop();if(!p.visited.includes(stop.id))p.visited.push(stop.id);
    if(state.stop>=state.route.waypoints.length-1){p.complete=true;saveProgress();navigator.vibrate?.([100,60,100,60,180]);toast('Route complete ✨');renderActive();renderStopList();return;}
    state.stop++;p.stop=state.stop;state.closeBuzzedFor=null;saveProgress();renderActive();drawMapKeepView();state.map?.flyTo([currentStop().lat,currentStop().lon],15,{duration:.55});toast(`Next: ${currentStop().name}`);
    history.replaceState(null,'',`?route=${encodeURIComponent(state.route.id)}&active=1&stop=${state.stop}&v=20`);
  }
  function skipStop(){if(state.stop>=state.route.waypoints.length-1)return;state.stop++;const p=getProgress(state.route.id);p.stop=state.stop;saveProgress();renderActive();drawMapKeepView();toast(`Skipped · next ${currentStop().name}`);}

  function showStopDetail(stop,index=state.stop){
    state.detailStop=stop;$('#detailName').textContent=`${stop.icon} ${stop.name}`;$('#detailCue').textContent=stop.cue;$('#detailTip').textContent=stop.tip||'Use the photo and Street View preview to recognise the place; Google Maps handles the actual turns.';$('#detailBadge').textContent=`STOP ${index+1}`;$('#detailGoBtn').href=mapsNav(stop);
    $('#detailOfficialBtn').classList.toggle('hidden',!stop.official);if(stop.official)$('#detailOfficialBtn').href=stop.official;
    $('#detailFallback').textContent=stop.icon;loadPhoto($('#detailImg'),$('#detailFallback'),stop.wiki,state.route?.accent||'#7559ff',media=>{$('#photoCredit').innerHTML=media?.src?`Photo: ${escapeHtml(media.credit||'Wikimedia Commons')} · ${escapeHtml(media.license||'')} · <a href="${media.source}" target="_blank" rel="noopener">source ↗</a>`:`<a href="${media?.source||'#'}" target="_blank" rel="noopener">place reference ↗</a>`;});openSheet($('#detailSheet'));
  }
  function escapeHtml(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function resetRoute(){const p=getProgress(state.route.id);p.stop=0;p.visited=[];p.complete=false;state.stop=0;saveProgress();renderStopList();toast('Route reset');}

  function goBack(){
    closeSheets();
    if(state.view==='active'){showCity(state.city);return;}
    if(state.view==='routes'){setView('home');history.replaceState(null,'','?v=20');return;}
  }

  async function share(){
    const route=state.route;const url=new URL(location.href);if(route)url.searchParams.set('route',route.id);url.searchParams.set('v','20');
    try{if(navigator.share)await navigator.share({title:route?`${route.name} · Wander Portugal`:'Wander Portugal',text:'Phone-down walking routes around Portugal.',url:url.href});else{await navigator.clipboard.writeText(url.href);toast('Link copied')}}catch{}
  }

  function bind(){
    backBtn.onclick=goBack;$('#brandBtn').onclick=()=>{closeSheets();setView('home');history.replaceState(null,'','?v=20')};$('#shareBtn').onclick=share;$('#homeNavBtn').onclick=()=>window.open(mapsHome(),'_blank');
    $('#nearMeBtn').onclick=()=>{state.nearSorted=true;getOnePosition(()=>{renderHome();toast('Places sorted from you')})};
    $('#closeSheetBtn').onclick=closeSheets;$('#closeDetailBtn').onclick=closeSheets;$$('.sheet-backdrop').forEach(b=>b.addEventListener('click',e=>{if(e.target===b)closeSheets()}));
    $('#startWalkBtn').onclick=()=>{closeSheets();startActive(false)};$('#resetRouteBtn').onclick=resetRoute;
    $('#routeInfoBtn').onclick=()=>{renderStopList();openSheet($('#routeSheet'))};$('#nearestBtn').onclick=nearestStop;$('#recenterBtn').onclick=recenter;$('#fitRouteBtn').onclick=fitMap;
    $('#arrivedBtn').onclick=markArrived;$('#skipBtn').onclick=skipStop;$('#detailsBtn').onclick=()=>showStopDetail(currentStop(),state.stop);$('#photoInfoBtn').onclick=()=>showStopDetail(currentStop(),state.stop);
    $('#goBtn').addEventListener('click',()=>{write('wander-last-nav-v20',{route:state.route.id,stop:state.stop,ts:Date.now()});navigator.vibrate?.(35)});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.view==='active'&&navigator.geolocation){navigator.geolocation.getCurrentPosition(updatePosition,()=>{}, {enableHighAccuracy:true,maximumAge:4000,timeout:10000});}});
  }

  function restoreFromUrl(){
    const q=new URLSearchParams(location.search),routeId=q.get('route'),cityId=q.get('city');
    if(routeId&&routeLookup.has(routeId)){
      const hit=routeLookup.get(routeId);state.city=hit.city;state.route=hit.route;const p=getProgress(routeId);const s=Number(q.get('stop'));state.stop=Number.isFinite(s)&&s>=0?Math.min(s,hit.route.waypoints.length-1):Math.min(p.stop,hit.route.waypoints.length-1);
      if(q.get('active')==='1')startActive(false);else{showCity(hit.city);openRoute(hit.city,hit.route);}return;
    }
    if(cityId){const city=DATA.cities.find(c=>c.id===cityId);if(city){showCity(city);return;}}
    setView('home');
  }

  function registerSW(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=20',{scope:'./'}).catch(()=>{});}

  bind();renderHome();restoreFromUrl();registerSW();
})();
