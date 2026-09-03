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
    await load('./app-core.js');
    await load('./app-ui.js');
  }catch(error){
    console.error(error);
    const banner=document.getElementById('offlineBanner');
    if(banner){banner.textContent='App files did not load — refresh once while online.';banner.classList.remove('hidden');}
  }
})();
