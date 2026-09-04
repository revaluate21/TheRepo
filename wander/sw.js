const VERSION='wander-v2.0.2';
const SHELL=`${VERSION}-shell`;
const PHOTOS=`${VERSION}-photos`;
const CORE=[
  './','./index.html','./styles.css?v=2.0.1','./data.js?v=2.0.1','./stability.js?v=2.0.1','./app.js?v=2.0.1',
  './manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('wander-v2')&&key!==SHELL&&key!==PHOTOS).map(key=>caches.delete(key)));
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
        const response=await fetch(request);
        if(response.ok){const cache=await caches.open(SHELL);cache.put('./index.html',response.clone());}
        return response;
      }catch(_){
        return (await caches.match('./index.html'))||(await caches.match('./'));
      }
    })());
    return;
  }

  if(url.origin===self.location.origin&&/\.(?:png|jpg|jpeg|webp)$/i.test(url.pathname)){
    event.respondWith((async()=>{
      const cache=await caches.open(PHOTOS);
      const hit=await cache.match(request);
      if(hit)return hit;
      try{
        const response=await fetch(request);
        if(response.ok)cache.put(request,response.clone());
        return response;
      }catch(_){return Response.error();}
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cache=await caches.open(SHELL);
      try{
        const response=await fetch(request);
        if(response.ok)cache.put(request,response.clone());
        return response;
      }catch(_){
        return (await cache.match(request))||Response.error();
      }
    })());
  }
});
