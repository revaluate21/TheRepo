const STATIC='wander-portugal-static-v20';
const RUNTIME='wander-portugal-runtime-v20';
const CORE=['./','./index.html','./styles.css?v=20','./routes.js?v=20','./app.js?v=20','./manifest.webmanifest','./icon.svg'];
const THIRD=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const c=await caches.open(STATIC);await c.addAll(CORE);for(const url of THIRD){try{const r=await fetch(url,{mode:'cors'});if(r.ok)await c.put(url,r)}catch{}}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('wander-portugal-')&&![STATIC,RUNTIME].includes(k)).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request,url=new URL(req.url);
  if(req.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(req);const c=await caches.open(STATIC);c.put('./index.html',fresh.clone());return fresh}catch{return(await caches.match(req))||(await caches.match('./index.html'))}})());return;
  }
  const external=url.origin!==self.location.origin;
  const cacheExternal=external&&(url.hostname.includes('wikipedia.org')||url.hostname.includes('wikimedia.org')||url.hostname.includes('cartocdn.com')||url.hostname.includes('unpkg.com'));
  if(cacheExternal){event.respondWith((async()=>{const c=await caches.open(RUNTIME);const hit=await c.match(req);const network=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>null);return hit||(await network)||Response.error()})());return;}
  if(!external){event.respondWith((async()=>{const c=await caches.open(STATIC);try{const fresh=await fetch(req);if(fresh.ok)c.put(req,fresh.clone());return fresh}catch{return(await c.match(req))||Response.error()}})());}
});
