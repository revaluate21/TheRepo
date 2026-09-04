const STATIC='lisbon-quest-v13-static';
const RUNTIME='lisbon-quest-v13-runtime';
const CORE=['./','./index.html','./revamp.html','./quest.css?v=13','./quest-style-01.css?v=13','./quest-style-02.css?v=13','./quest-style-03.css?v=13','./quest-style-04.css?v=13','./quest-style-05.css?v=13','./quest-data.js?v=13','./quest.js?v=13','./quest-src-01.txt?v=13','./quest-src-02.txt?v=13','./quest-src-03.txt?v=13','./quest-src-04.txt?v=13','./quest-src-05.txt?v=13','./quest-src-06.txt?v=13','./quest-src-07.txt?v=13','./quest-src-08.txt?v=13','./quest-src-09.txt?v=13','./quest-src-10.txt?v=13','./quest-src-11.txt?v=13','./manifest.webmanifest?v=13','./icon.svg'];
const THIRD=['https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(STATIC);
  await cache.addAll(CORE);
  for(const url of THIRD){try{const response=await fetch(url,{mode:'cors'});if(response.ok)await cache.put(url,response);}catch{}}
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>![STATIC,RUNTIME].includes(k)).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request, url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(request);const cache=await caches.open(STATIC);cache.put('./index.html',fresh.clone());return fresh;}catch{return(await caches.match(request))||(await caches.match('./index.html'));}})());
    return;
  }
  const external=url.origin!==self.location.origin;
  if(external&&(url.hostname.includes('unpkg.com')||url.hostname.includes('wikimedia.org')||url.hostname.includes('cartocdn.com'))){
    event.respondWith((async()=>{const cache=await caches.open(RUNTIME);const hit=await cache.match(request);const network=fetch(request).then(r=>{if(r.ok||r.type==='opaque')cache.put(request,r.clone());return r;}).catch(()=>null);return hit||(await network)||Response.error();})());
    return;
  }
  if(!external){event.respondWith((async()=>{const cache=await caches.open(STATIC);try{const fresh=await fetch(request);if(fresh.ok)cache.put(request,fresh.clone());return fresh;}catch{return(await cache.match(request))||Response.error();}})());}
});
