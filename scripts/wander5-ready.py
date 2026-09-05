from pathlib import Path
import runpy,re
runpy.run_path('scripts/wander5-final-polish.py',run_name='__main__')
P=Path('staging');p=P/'app.js';s=p.read_text()
old=next(x for x in s.splitlines() if x.startswith('function addBaseTiles('))
new='''function addBaseTiles(m){m.getPane('tilePane').style.filter=S.mapStyle==='game'?'grayscale(1) invert(.92) contrast(.82) brightness(.9)':'';return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:1,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(m);}'''
s=s.replace(old,new).replace('How far feels<br>good today?','Pick your escape.').replace('Less planning. More places that don’t feel like home.','Choose your ride. Set your limit.');p.write_text(s)
p=P/'app.css';s=p.read_text();s+='\n@media(max-width:750px){.intro{margin:3px 0 13px}.intro .eyebrow{display:none}.intro h1{font-size:2rem;max-width:none}.intro p{margin-top:6px}.intro .when-control{margin-top:12px}.travel-controls{margin-top:0}.explorer-card{margin-top:12px}.travel-controls>.caption{font-size:10px}}\n';p.write_text(s)
# Tests exercise maps and pins against a deliberately labelled fixture, rather than
# crawling a community-funded map-tile server across thirty destinations.
p=Path('scripts/qa-v5.py');s=p.read_text()
old="  page.locator('[data-action=travelSettings]').first.click() if page.locator('[data-action=travelSettings]').count() else page.evaluate(\"document.getElementById('menuButton').click()\")\n  close(page)"
new="  page.locator('#menuButton').click();page.locator('#sheetContent [data-action=travelSettings]').click();check('budget settings open',page.locator('#fuelInput').is_visible());close(page)"
assert old in s;s=s.replace(old,new)
needle=" context.route('**/api.open-meteo.com/**',lambda route:route.abort())"
s=s.replace(needle,needle+'''\n tile_fixture='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#c7cece"/><path d="M0 80H256M80 0V256M0 180H256" stroke="white" stroke-width="3"/><text x="12" y="235" fill="#49556b" font-size="12">Test background · real route overlay</text></svg>'
 context.route('**/tile.openstreetmap.org/**',lambda r:r.fulfill(status=200,content_type='image/svg+xml',body=tile_fixture))''')
p.write_text(s)
# A human-directed single-view visual check is separate from the automated sweep.
Path('scripts/wander5-map-check.py').write_text('''from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json
O=Path('qa-map');O.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 c=b.new_context(viewport={'width':393,'height':852},device_scale_factor=1,is_mobile=True,has_touch=True,timezone_id='Europe/Lisbon')
 page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('WANDER_URL','http://127.0.0.1:8765/staging/')+'?v=5#route=lisbon-classic',wait_until='domcontentloaded')
 page.wait_for_function('window.Wander?.version==="5.0.0"',timeout=30000)
 page.locator('#journeyMap').scroll_into_view_if_needed();page.wait_for_timeout(4500)
 tiles=page.locator('.leaflet-tile').evaluate_all('(xs)=>xs.map(x=>({src:x.currentSrc,loaded:x.complete&&x.naturalWidth>0}))')
 page.screenshot(path=str(O/'single-live-map.png'))
 (O/'map-results.json').write_text(json.dumps({'tiles':tiles,'errors':errors,'scope':'One manually requested static viewport; no tile archive, prefetch, pan or zoom sweep.'},indent=2))
 b.close()
''')
print('Ready candidate: map key overlay removed, compact first screen, transport-aware first leg.')
