from pathlib import Path
# A browser can report navigator.onLine=true while requests are offline.
# Use a tiny same-origin, network-only probe instead of promising connectivity.
app=Path('wander4/app.js');s=app.read_text()
s=s.replace("function connection(){const e=$('#connection');e.classList.toggle('offline',!navigator.onLine);e.textContent=navigator.onLine?'':'Offline';}","function connection(){const offline=!navigator.onLine||!!S.networkDown;const e=$('#connection');e.classList.toggle('offline',offline);e.textContent=offline?'Offline':'';}")
s=s.replace('bind();render();refreshWeather();','bind();render();refreshWeather();checkNetwork();')
s=s.replace("window.addEventListener('online',()=>{connection();refreshWeather();});","window.addEventListener('online',()=>{checkNetwork();refreshWeather();});")
probe="""
async function checkNetwork(){
 try{const r=await fetch('./connectivity.txt?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(4500)});if(!r.ok)throw Error('Connection unavailable');S.networkDown=false;}
 catch(_){S.networkDown=true;}
 connection();
}
"""
s=s.replace('\ninit();',probe+'\ninit();');app.write_text(s)
Path('wander4/connectivity.txt').write_text('Wander connection check\n')
p=Path('wander4/sw.js');s=p.read_text();s=s.replace("const BUILD='4.0.2'","const BUILD='4.0.3'")
s=s.replace("if(r.mode==='navigate'){","if(u.pathname.endsWith('/connectivity.txt'))return;\n if(r.mode==='navigate'){");p.write_text(s)
# Wait on every current image: weather arriving can legitimately rerender cards.
p=Path('scripts/wander4-qa.py');q=p.read_text()
a=q.index('def images(page):');b=q.index('def overflow(page',a)
q=q[:a]+'''def images(page):
 page.wait_for_function("""()=>{const photos=Array.from(document.querySelectorAll('img[data-thumb]'));photos.forEach(x=>x.loading='eager');return photos.length>0&&photos.every(x=>x.complete&&x.naturalWidth>0)}""",timeout=45000)
 check(page.locator('.error-photo').count()==0,'No missing landmark photos')
'''+q[b:]
q=q.replace('page.wait_for_function("window.Wander?.version===\'4.0.0\'",timeout=45000);images(page);overflow(page,\'home390\')', 'page.wait_for_function("window.Wander?.version===\'4.0.0\'",timeout=45000);ok("Application initialized");images(page);overflow(page,\'home390\')')
q=q.replace("check('Offline' in page.locator('#connection').inner_text(),'Offline status is explicit')",'''page.wait_for_function("document.querySelector('#connection').textContent==='Offline'",timeout=8000)
  report['offline_probe']=page.evaluate("({online:navigator.onLine,badge:document.querySelector('#connection').textContent,warning:document.querySelector('#mapWarning')?.textContent,ready:!!window.Wander})")
  print('OFFLINE',report['offline_probe'],flush=True)
  page.screenshot(path=str(OUT/'offline-mobile.png'))
  check('Offline' in page.locator('#connection').inner_text(),'Offline status is explicit',report['offline_probe'])''')
old="report['success']=False;report['failure']=str(e);print('FAIL',e,flush=True)"
new="""report['success']=False;report['failure']=str(e);print('FAIL',e,flush=True)
 try:report['browser_errors']=errors
 except Exception:pass
"""
q=q.replace(old,new);p.write_text(q)
