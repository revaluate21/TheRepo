'use strict';
(async()=>{
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.onload=resolve;
    script.onerror=()=>reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
  try{
    await load('./nightlife.js?v=10');
    await load('./live-night.js?v=10');
    await load('./app-core.js?v=10');
    await load('./app-ui.js?v=10');
    await load('./night-ui.js?v=10');
  }catch(error){
    console.error(error);
    const banner=document.getElementById('offlineBanner');
    if(banner){banner.textContent='App files did not load — refresh once while online.';banner.classList.remove('hidden');}
  }
})();
