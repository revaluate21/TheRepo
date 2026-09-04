'use strict';
(() => {
  const upgraded = new WeakSet();

  function makeReliable(img, highPriority=false){
    if(!(img instanceof HTMLImageElement))return;
    img.loading='eager';
    img.decoding='async';
    if(highPriority)img.fetchPriority='high';
    if(upgraded.has(img))return;
    upgraded.add(img);
    let retried=false;
    img.addEventListener('load',()=>{
      if(img.naturalWidth>0)img.style.display='block';
    });
    img.addEventListener('error',()=>{
      if(retried)return;
      retried=true;
      const original=img.getAttribute('src');
      if(!original)return;
      const retry=new URL(original,location.href);
      retry.searchParams.set('_photo_retry','1');
      img.style.display='block';
      requestAnimationFrame(()=>{img.src=retry.toString();});
    });
  }

  function upgrade(root=document){
    root.querySelectorAll?.('#nowGrid img').forEach((img,index)=>makeReliable(img,index<2));
    root.querySelectorAll?.('#stopPhoto, .day-card img, .world-card img, .stop-thumb img').forEach(img=>makeReliable(img,false));
  }

  upgrade();
  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.('img'))makeReliable(node,node.closest?.('#nowGrid')!==null);
        upgrade(node);
      }
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});

  window.addEventListener('pageshow',()=>upgrade());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)upgrade();});
})();
