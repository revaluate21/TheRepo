from pathlib import Path
import base64,lzma,json,hashlib,subprocess,re
from datetime import datetime,timezone
P=Path('staging')
# The asset build copied v4.0.3; the reviewed UI diff was based on v4.0.2.
# Normalize those tiny differences, apply atomically, then retain the connectivity safeguard.
f=P/'app.js';s=f.read_text();s=s.replace("function connection(){const offline=!navigator.onLine||!!S.networkDown;const e=$('#connection');e.classList.toggle('offline',offline);e.textContent=offline?'Offline':'';}","function connection(){const e=$('#connection');e.classList.toggle('offline',!navigator.onLine);e.textContent=navigator.onLine?'':'Offline';}")
s=s.replace('checkNetwork();refreshWeather();','connection();refreshWeather();').replace('refreshWeather();checkNetwork();','refreshWeather();');s=re.sub(r'\nasync function checkNetwork\(\)\{[\s\S]*?\n\}\n','\n',s);f.write_text(s)
f=P/'sw.js';s=f.read_text().replace("const BUILD='4.0.3'","const BUILD='4.0.2'").replace(" if(u.pathname.endsWith('/connectivity.txt'))return;\n",'');f.write_text(s)
root=Path('scripts/wander5-ui');raw=base64.b64decode(''.join(p.read_text().strip() for p in sorted(root.glob('part-*.b64'))))
assert hashlib.sha256(raw).hexdigest()=='a9f0629899313ea5a304a7763a13dd430b7dbddce6eb0efbfbf106486172694c','UI package integrity failure'
pack=json.loads(lzma.decompress(raw));Path('changes.patch').write_text(pack['patch']);subprocess.run(['git','apply','--directory=staging','changes.patch'],check=True)
qa=pack['qa'].replace('[data-action=reached]','[data-action=arrived]').replace('[data-action=navigate]','#dock a[href*="google.com/maps/dir"]')
Path('scripts/qa-v5.py').write_text(qa)
d=json.loads((P/'catalog.json').read_text());d['built']=datetime.now(timezone.utc).date().isoformat();(P/'catalog.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
ph=json.loads((P/'photos.json').read_text())
for p in ph.values():
 if p.get('licenseURL'):continue
 lic=p.get('license','');v=re.search(r'(\d\.\d)',lic)
 if 'CC BY-SA' in lic and v:p['licenseURL']='https://creativecommons.org/licenses/by-sa/'+v[1]+'/'
 elif 'CC BY' in lic and v:p['licenseURL']='https://creativecommons.org/licenses/by/'+v[1]+'/'
 elif 'CC0' in lic:p['licenseURL']='https://creativecommons.org/publicdomain/zero/1.0/'
 elif 'Public domain' in lic:p['licenseURL']='https://creativecommons.org/publicdomain/mark/1.0/'
(P/'photos.json').write_text(json.dumps(ph,ensure_ascii=False,indent=2))
f=P/'app.js';s=f.read_text();s=s.replace('${esc(p.license)} · resized / cropped for display.','<a href="${esc(safeURL(p.licenseURL||p.source))}" target="_blank" rel="noopener">${esc(p.license)}</a> · resized / cropped for display.')
s=s.replace("function connection(){const e=$('#connection');e.classList.toggle('offline',!navigator.onLine);e.textContent=navigator.onLine?'':'Offline';}","function connection(){const offline=!navigator.onLine||!!S.networkDown;const e=$('#connection');e.classList.toggle('offline',offline);e.textContent=offline?'Offline':'';}")
s=s.replace("window.addEventListener('online',()=>{connection();refreshWeather();})","window.addEventListener('online',()=>{checkNetwork();refreshWeather();})").replace('bind();render();refreshWeather();','bind();render();refreshWeather();checkNetwork();')
s+='\nasync function checkNetwork(){try{const r=await fetch("./connectivity.txt?t="+Date.now(),{cache:"no-store",signal:AbortSignal.timeout(4500)});if(!r.ok)throw Error();S.networkDown=false;}catch(_){S.networkDown=true;}connection();}\n';f.write_text(s)
f=P/'sw.js';s=f.read_text().replace("if(r.method!=='GET'||u.origin!==self.location.origin)return;","if(r.method!=='GET'||u.origin!==self.location.origin)return;\n if(u.pathname.endsWith('/connectivity.txt'))return;");f.write_text(s)
print('Prepared Wander',d['version'],len(d['routes']),'routes',len(ph),'photographs')
