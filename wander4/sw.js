const BUILD='5.0.0';
const SHELL=`wander4-shell-${BUILD}`;
const PHOTOS='wander4-photos-v1';
const CORE=['./','./index.html','./app.css','./app.js','./logic.js','./travel.js','./pois.json','./icons.js','./catalog.json','./geometry.json','./photos.json','./vendor/leaflet.js','./vendor/leaflet.css','./manifest.webmanifest','./icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);await cache.addAll(CORE);
 const data=await (await cache.match('./photos.json')).json();
 const urls=[...new Set(Object.values(data).map(p=>'./'+p.thumb))];
 for(let i=0;i<urls.length;i+=6)await cache.addAll(urls.slice(i,i+6));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('wander4-shell-')&&n!==SHELL).map(n=>caches.delete(n)));await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;
 if(u.pathname.endsWith('/connectivity.txt'))return;
 if(r.mode==='navigate'){
  event.respondWith((async()=>{try{const response=await fetch(r,{signal:AbortSignal.timeout(4500)});if(response.ok)return response;}catch(_){}return(await caches.open(SHELL)).match('./index.html');})());return;
 }
 if(u.pathname.includes('/photos/')){
  event.respondWith((async()=>{const hit=await caches.match(r);if(hit)return hit;try{const response=await fetch(r);if(response.ok){const c=await caches.open(PHOTOS);await c.put(r,response.clone());}return response;}catch(_){return Response.error();}})());return;
 }
 event.respondWith((async()=>{const hit=await (await caches.open(SHELL)).match(r,{ignoreSearch:true});return hit||fetch(r);})());
});
