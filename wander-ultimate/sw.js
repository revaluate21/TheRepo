const VERSION='wander-ultimate-v1';
const STATIC=`${VERSION}-static`;
const RUNTIME=`${VERSION}-runtime`;
const CORE=[
  './','./index.html','./style.css?v=1','./routes-lisbon.js?v=1','./routes-trips.js?v=1',
  './photos.js?v=1','./app.js?v=1','./manifest.webmanifest','./icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(STATIC).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('wander-ultimate-')&&!k.startsWith(VERSION)).map(k=>caches.delete(k)));
    if('navigationPreload'in self.registration)await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const request=event.request;
  const url=new URL(request.url);

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const preload=await event.preloadResponse;
        const fresh=preload||await fetch(request);
        const cache=await caches.open(STATIC);cache.put('./index.html',fresh.clone());return fresh;
      }catch(_){return await caches.match('./index.html')||await caches.match('./');}
    })());
    return;
  }

  const external=url.origin!==self.location.origin;
  const cacheableExternal=external&&(
    url.hostname.includes('wikimedia.org')||url.hostname.includes('upload.wikimedia.org')||
    url.hostname.includes('unpkg.com')||url.hostname.includes('cartocdn.com')
  );

  if(cacheableExternal){
    event.respondWith((async()=>{
      const cache=await caches.open(RUNTIME);const hit=await cache.match(request);
      if(hit)return hit;
      try{const response=await fetch(request);if(response.ok||response.type==='opaque')cache.put(request,response.clone());return response;}catch(_){return Response.error();}
    })());
    return;
  }

  if(!external){
    event.respondWith((async()=>{
      const cache=await caches.open(STATIC);const hit=await cache.match(request);
      const network=fetch(request).then(response=>{if(response.ok)cache.put(request,response.clone());return response;}).catch(()=>null);
      return hit||await network||Response.error();
    })());
  }
});
