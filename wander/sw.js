const VERSION='wander-v2.0.0';
const SHELL=`${VERSION}-shell`;
const PHOTOS=`${VERSION}-photos`;
const CORE=['./','./index.html','./styles.css?v=2.0.0','./data.js?v=2.0.0','./app.js?v=2.0.0','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const START_PHOTOS=['../assets/photos/parque.jpg','../assets/photos/pink.jpg','../assets/photos/pena.jpg','../assets/photos/cristo.jpg','../assets/photos/oriente.jpg','../assets/photos/belem.jpg'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL);
    for(const url of CORE){try{const response=await fetch(url,{cache:'reload'});if(response.ok)await cache.put(url,response);}catch(_){}}
    const photos=await caches.open(PHOTOS);
    for(const url of START_PHOTOS){try{const response=await fetch(url,{cache:'reload'});if(response.ok)await photos.put(url,response);}catch(_){}}
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
  const request=event.request,url=new URL(request.url);
  if(request.mode==='navigate'){
    event.respondWith((async()=>{try{const response=await fetch(request);const cache=await caches.open(SHELL);if(response.ok)cache.put('./index.html',response.clone());return response;}catch(_){return (await caches.match('./index.html'))||(await caches.match('./'));}})());
    return;
  }
  if(url.origin===self.location.origin&&/\.(?:png|jpg|jpeg|webp)$/i.test(url.pathname)){
    event.respondWith((async()=>{const cache=await caches.open(PHOTOS);const hit=await cache.match(request);if(hit)return hit;try{const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response;}catch(_){return Response.error();}})());
    return;
  }
  if(url.origin===self.location.origin){
    event.respondWith((async()=>{const cache=await caches.open(SHELL);try{const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response;}catch(_){return (await cache.match(request))||Response.error();}})());
  }
});
