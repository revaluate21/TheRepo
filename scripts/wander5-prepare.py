from pathlib import Path
import base64,lzma,json,hashlib,subprocess
from datetime import datetime,timezone
root=Path('scripts/wander5-ui');raw=base64.b64decode(''.join(p.read_text().strip() for p in sorted(root.glob('part-*.b64'))))
assert hashlib.sha256(raw).hexdigest()=='a9f0629899313ea5a304a7763a13dd430b7dbddce6eb0efbfbf106486172694c','UI package integrity failure'
pack=json.loads(lzma.decompress(raw));Path('changes.patch').write_text(pack['patch']);subprocess.run(['git','apply','--directory=staging','changes.patch'],check=True)
qa=pack['qa'].replace('[data-action=reached]','[data-action=arrived]').replace('[data-action=navigate]','#dock a[href*="google.com/maps/dir"]')
# Only test Google navigation anchors, not an invented data attribute.
Path('scripts/qa-v5.py').write_text(qa)
P=Path('staging');d=json.loads((P/'catalog.json').read_text());d['built']=datetime.now(timezone.utc).date().isoformat();(P/'catalog.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
# Explicit licence links for all locally resized/cropped photographs.
ph=json.loads((P/'photos.json').read_text())
for p in ph.values():
 if p.get('licenseURL'):continue
 lic=p.get('license','');import re
 v=re.search(r'(\d\.\d)',lic)
 if 'CC BY-SA' in lic and v:p['licenseURL']='https://creativecommons.org/licenses/by-sa/'+v[1]+'/'
 elif 'CC BY' in lic and v:p['licenseURL']='https://creativecommons.org/licenses/by/'+v[1]+'/'
 elif 'CC0' in lic:p['licenseURL']='https://creativecommons.org/publicdomain/zero/1.0/'
 elif 'Public domain' in lic:p['licenseURL']='https://creativecommons.org/publicdomain/mark/1.0/'
(P/'photos.json').write_text(json.dumps(ph,ensure_ascii=False,indent=2))
f=P/'app.js';s=f.read_text();s=s.replace('${esc(p.license)} · resized / cropped for display.','<a href="${esc(safeURL(p.licenseURL||p.source))}" target="_blank" rel="noopener">${esc(p.license)}</a> · resized / cropped for display.');f.write_text(s)
print('Prepared Wander',d['version'],len(d['routes']),'routes',len(ph),'photographs')
