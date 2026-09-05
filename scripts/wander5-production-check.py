from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.request,json,time,hashlib,shutil,threading,http.server,functools
O=Path('qa-production');O.mkdir(exist_ok=True);checks=[];errors=[]
URL='https://revaluate21.github.io/TheRepo/wander4/'
def check(n,v,detail=''):
 checks.append({'test':n,'pass':bool(v),'detail':detail})
 if not v:raise AssertionError(n+' '+str(detail))
def get(u):
 req=urllib.request.Request(u,headers={'User-Agent':'WanderReleaseVerification/5 (+https://revaluate21.github.io/TheRepo/wander4/)'})
 with urllib.request.urlopen(req,timeout=15) as r:return r.read()
expected=json.loads(Path('wander4/release.json').read_text())
for i in range(30):
 try:
  live=json.loads(get(URL+'release.json?verify='+str(int(time.time()))))
  if live.get('assets')==expected['assets']:break
 except Exception:pass
 time.sleep(6)
else:raise RuntimeError('Public Pages is not serving the expected build yet')
check('public release manifest matches',live['assets']==expected['assets'])
for f,h in expected['assets'].items():check('public hash '+f,hashlib.sha256(get(URL+f+'?verify=5')).hexdigest()==h)
# One actual live-map viewport was visually checked separately. Automated tests use
# an explicit fixture, never a prefetch/pan/zoom crawl of OSM's tile service.
fixture='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#cbd1d1"/><path d="M0 80H256M80 0V256" stroke="white"/><text x="12" y="230" fill="#465261">Test background</text></svg>'
def mock_tiles(c):
 for pat in ['**/*openstreetmap.org/**','**/*.basemaps.cartocdn.com/**']:
  c.route(pat,lambda r:r.fulfill(status=200,content_type='image/svg+xml',body=fixture))
serverdir=Path('qa-server');dest=serverdir/'walk';shutil.copytree('baseline',dest,dirs_exist_ok=True)
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(serverdir));server=http.server.ThreadingHTTPServer(('127.0.0.1',8766),handler);threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True)
 c=b.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True,timezone_id='Europe/Lisbon',permissions=['geolocation'],geolocation={'latitude':38.71338,'longitude':-9.1392,'accuracy':12});mock_tiles(c)
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(URL+'?v=5',wait_until='domcontentloaded');page.wait_for_function('window.Wander?.version==="5.0.0"',timeout=30000)
  check('production is secure HTTPS',page.evaluate('isSecureContext'))
  check('production transport controls',page.locator('[data-action=travelMode]').count()==3)
  check('production 83 photos',page.evaluate('Object.keys(Wander.photos).length')==83)
  check('mobile production no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'))
  page.wait_for_timeout(1200);page.screenshot(path=str(O/'production-home.png'),full_page=True)
  page.evaluate("location.hash='route=tomar'");page.wait_for_selector('.stop-card');page.locator('.stop-card').last.scroll_into_view_if_needed();page.wait_for_function("[...document.querySelectorAll('.stop-card img')].every(i=>i.complete&&i.naturalWidth>100)")
  check('production landmark gallery loads',page.locator('.stop-card img').count()==5)
  page.wait_for_function('navigator.serviceWorker.controller!==null',timeout=60000)
  page.locator('[data-action=saveOffline]').first.click();page.wait_for_function('document.querySelector("#downloadStatus")?.textContent.includes("Ready offline")',timeout=60000);page.locator('#closeSheet').click()
  check('production app worker ready',page.evaluate('!!navigator.serviceWorker.controller'))
  c.set_offline(True);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.Wander?.version==="5.0.0"');page.locator('.stop-card').last.scroll_into_view_if_needed();page.wait_for_function("[...document.querySelectorAll('.stop-card img')].every(i=>i.complete&&i.naturalWidth>100)")
  check('production saved route opens offline',page.locator('.stop-card').count()==5)
  c.close()
  # Install the actual prior release under the same test origin, then replace it.
  c=b.new_context(viewport={'width':393,'height':852},is_mobile=True,has_touch=True,timezone_id='Europe/Lisbon');mock_tiles(c);c.route('**/api.open-meteo.com/**',lambda r:r.abort());page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8766/walk/',wait_until='domcontentloaded');page.wait_for_function('window.Wander?.version?.startsWith("4.")',timeout=30000);page.wait_for_function('navigator.serviceWorker.controller!==null',timeout=60000)
  check('old release actually installed',page.evaluate('Wander.version').startswith('4.'))
  page.evaluate('''()=>{localStorage.setItem('wander4-home',JSON.stringify({text:'Regression test home'}));localStorage.setItem('wander4-favorites',JSON.stringify(['tomar']));localStorage.setItem('wander4-progress',JSON.stringify({tomar:{i:1,done:['start'],started:123}}));}''')
  shutil.rmtree(dest);shutil.copytree('wander4',dest)
  page.evaluate('''async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();}''')
  page.wait_for_function('document.querySelector(".update-bar")!==null',timeout=60000)
  page.locator('[data-action=reloadUpdate]').click();page.wait_for_function('window.Wander?.version==="5.0.0"',timeout=30000)
  check('v4 to v5 updates successfully',page.evaluate('Wander.version')=='5.0.0')
  check('saved home preserved',page.evaluate('Wander.state.home.text')=='Regression test home')
  check('favorites preserved',page.evaluate('Wander.state.favorites.has("tomar")'))
  check('walk progress preserved',page.evaluate('Wander.state.progress.tomar.i')==1)
  page.screenshot(path=str(O/'updated-install.png'))
  check('no browser errors in live and update tests',not errors,errors)
 except Exception as e:
  checks.append({'test':'fatal','pass':False,'detail':str(e)});page.screenshot(path=str(O/'FAILURE.png'),full_page=True)
 finally:
  b.close();server.shutdown();(O/'results.json').write_text(json.dumps({'url':URL,'checks':checks,'errors':errors,'passed':all(x['pass'] for x in checks)},indent=2));print(json.dumps(checks,indent=2))
if not all(x['pass'] for x in checks):raise SystemExit(1)
