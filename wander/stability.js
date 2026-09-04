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
    const images=[];
    if(root instanceof HTMLImageElement)images.push(root);
    root.querySelectorAll?.('img').forEach(img=>images.push(img));
    images.forEach(img=>{
      const nowGrid=img.closest?.('#nowGrid');
      let high=false;
      if(nowGrid){
        const list=[...nowGrid.querySelectorAll('img')];
        high=list.indexOf(img)<2;
      }
      makeReliable(img,high);
    });
  }

  upgrade();
  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType===1)upgrade(node);
      }
    }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true});

  window.addEventListener('pageshow',()=>upgrade());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)upgrade();});
})();
