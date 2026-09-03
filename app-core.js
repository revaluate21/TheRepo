'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store=(()=>{try{localStorage.setItem('__lq','1');localStorage.removeItem('__lq');return localStorage}catch(e){return{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}}})();
const read=(k,f)=>{try{const v=store.getItem(k);return v===null?f:JSON.parse(v)}catch(e){return f}};
const state={preset:read('lq-preset','long'),current:read('lq-current',0),tracked:read('lq-tracked',0),gps:null,prev:null,heading:null,watch:null,follow:true,home:read('lq-home',DATA.defaultHome),visited:new Set(read('lq-visited',[])),installPrompt:null,selected:null,lastAuto:0};
const busRef=['00:30','01:00','01:30','02:00','02:30','03:30','04:30','05:00','05:35'];
let map,tileLayer,routeShadow,routeLine,targetLine,userMarker,accuracyCircle,homeMarker,routeMarkers=[],sideMarkers=[],tileErrors=0;
const categoryNames={view:'Viewpoint',architecture:'Architecture',quiet:'Quiet / green',arcade:'Arcade',river:'River',street:'Street visual',transport:'Transport'};
const save=()=>{store.setItem('lq-preset',JSON.stringify(state.preset));store.setItem('lq-current',JSON.stringify(state.current));store.setItem('lq-tracked',JSON.stringify(state.tracked));store.setItem('lq-home',JSON.stringify(state.home));store.setItem('lq-visited',JSON.stringify([...state.visited]));};
const rad=x=>x*Math.PI/180, deg=x=>x*180/Math.PI;
function hav(a,b){const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon);const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));}
function bearing(a,b){const p1=rad(a.lat),p2=rad(b.lat),dl=rad(b.lon-a.lon);return (deg(Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl)))+360)%360;}
function fmtDist(m){if(!Number.isFinite(m))return '—';return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(m<10000?2:1)} km`;}
function timeToMin(v){const[h,m]=v.split(':').map(Number);return h*60+m}function fmtTime(v){v=((Math.round(v)%1440)+1440)%1440;return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;}
function mapsSearch(x){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.query||x.name)}`;}
function mapsDir(o,d,mode='walking'){return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=${mode}`;}
function photoUrl(p,w=1000){return p?`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(p.file)}?width=${w}`:'';}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2600);}
function route(){const opts=new Set(DATA.presets[state.preset]?.opts||DATA.presets.long.opts);return DATA.route.filter(s=>!s.optional||opts.has(s.optional));}
function target(){const r=route();state.current=Math.max(0,Math.min(state.current,r.length-1));return r[state.current];}
function routeStats(){const r=route();let km=0;for(let i=1;i<r.length;i++)km+=hav(r[i-1],r[i])/1000;return{km,stepsLow:Math.round(km*1300),stepsHigh:Math.round(km*1450)};}
function etaFor(i){const r=route();let m=timeToMin($('#startTime').value||'20:00');for(let x=0;x<=i;x++){if(x>0)m+=Math.max(5,Math.round(hav(r[x-1],r[x])/78));m+=r[x].dwell||5;}return m;}
function emojiFallback(el,item){el.textContent=item.icon||'📍';el.style.background=`linear-gradient(135deg,${item.color||'#7b61ff'},#ff3ec9)`;}
function setImage(img,fallback,item,eager=false){emojiFallback(fallback,item);if(item.photo){img.style.display='block';img.alt=item.name;img.loading=eager?'eager':'lazy';img.src=photoUrl(item.photo,eager?1200:720);img.onerror=()=>{img.style.display='none'};}else{img.removeAttribute('src');img.style.display='none';}}
function pointIcon(item,index,current=false,side=false){if(side)return L.divIcon({className:'',html:`<div class="side-marker" style="background:${item.color}">${item.icon}</div>`,iconSize:[40,40],iconAnchor:[20,20]});return L.divIcon({className:'',html:`<div class="marker-wrap"><div class="poi-number">${index+1}</div><div class="poi-marker ${current?'current':''}" style="background:${item.color}"><span>${item.icon}</span></div></div>`,iconSize:[42,50],iconAnchor:[21,47]});}
function userIcon(){const rot=Number.isFinite(state.heading)?state.heading:0;return L.divIcon({className:'',html:`<div class="user-pin"><div class="user-pulse"></div><div class="user-arrow" style="transform:rotate(${rot}deg)"><svg viewBox="0 0 28 38" aria-hidden="true"><path d="M14 1 L26 34 L14 28 L2 34 Z" fill="#45c7f4" stroke="white" stroke-width="3" stroke-linejoin="round"/></svg></div></div>`,iconSize:[44,44],iconAnchor:[22,22]});}
function initMap(){if(!window.L){$('#offlineBanner').textContent='Map library unavailable — reload online. Route list still works.';$('#offlineBanner').classList.remove('hidden');return;}
  map=L.map('map',{zoomControl:false,attributionControl:true,minZoom:11,maxZoom:19}).setView([38.7165,-9.1395],14);
  tileLayer=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:20,attribution:'&copy; OpenStreetMap contributors &copy; CARTO'}).addTo(map);
  tileLayer.on('tileerror',()=>{tileErrors++;if(tileErrors>3)$('#offlineBanner').classList.remove('hidden')});tileLayer.on('load',()=>{tileErrors=0;$('#offlineBanner').classList.add('hidden')});
  map.createPane('routeShadow');map.getPane('routeShadow').style.zIndex=405;map.createPane('routeBright');map.getPane('routeBright').style.zIndex=406;
  map.on('dragstart',()=>{state.follow=false;$('#followBtn').classList.remove('active')});map.on('moveend',renderNearby);
  drawMap();
}
function drawMap(){if(!map)return;[routeShadow,routeLine,targetLine,homeMarker].forEach(x=>x&&map.removeLayer(x));routeMarkers.forEach(x=>map.removeLayer(x));sideMarkers.forEach(x=>map.removeLayer(x));routeMarkers=[];sideMarkers=[];
  const r=route(),ll=r.map(s=>[s.lat,s.lon]);
  routeShadow=L.polyline(ll,{pane:'routeShadow',color:'#171c34',weight:11,opacity:.7,lineCap:'round',lineJoin:'round'}).addTo(map);
  routeLine=L.polyline(ll,{pane:'routeBright',color:'#ff3ec9',weight:5,opacity:.98,lineCap:'round',lineJoin:'round',dashArray:'1 0'}).addTo(map);
  r.forEach((s,i)=>{const mk=L.marker([s.lat,s.lon],{icon:pointIcon(s,i,i===state.current),zIndexOffset:i===state.current?1000:0}).addTo(map);mk.on('click',()=>openItem(s,'route',i));routeMarkers.push(mk)});
  DATA.sidequests.forEach(s=>{const mk=L.marker([s.lat,s.lon],{icon:pointIcon(s,0,false,true),zIndexOffset:300}).addTo(map);mk.on('click',()=>openItem(s,'side'));sideMarkers.push(mk)});
  homeMarker=L.marker([state.home.lat,state.home.lon],{icon:L.divIcon({className:'',html:'<div class="side-marker" style="background:#18213a">🏠</div>',iconSize:[40,40],iconAnchor:[20,20]})});
  updateTargetLine();
}
function fitRoute(){if(!map)return;const r=route();map.fitBounds(L.latLngBounds(r.map(s=>[s.lat,s.lon])).pad(.12),{animate:true});}
function focusItem(item){if(!map)return;map.flyTo([item.lat,item.lon],Math.max(map.getZoom(),16),{duration:.8});}
function updateTargetLine(){if(!map)return;if(targetLine)map.removeLayer(targetLine);if(state.gps){const t=target();targetLine=L.polyline([[state.gps.lat,state.gps.lon],[t.lat,t.lon]],{color:'#7b61ff',weight:3,opacity:.8,dashArray:'7 10'}).addTo(map);}}
function renderMapMarkers(){if(!map)return;const r=route();routeMarkers.forEach((m,i)=>m.setIcon(pointIcon(r[i],i,i===state.current)));updateTargetLine();}
