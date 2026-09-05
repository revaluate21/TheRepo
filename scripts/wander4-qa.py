"""Wander release QA: real HTTP, browser, permissions and offline tests.
Run only in an environment where local web navigation is permitted.
"""
from pathlib import Path
import os, json, time, sys, urllib.request, hashlib
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
BASE=os.environ.get('BASE_URL','http://127.0.0.1:8765/wander4/').rstrip('/')+'/'
ROOT=Path(os.environ.get('SITE_ROOT','wander4'))
OUT=Path(os.environ.get('QA_OUT','wander4-qa'));OUT.mkdir(exist_ok=True)
report={'base':BASE,'checks':[],'limitations':['Mock GPS is not a physical-phone GPS accuracy test.','Google Maps links are validated, not native spoken navigation.','Opening hours, service changes and weather remain external.']}
def ok(name,detail=True):
 report['checks'].append({'name':name,'pass':True,'detail':detail});print('PASS',name,flush=True)
def check(cond,name,detail=True):
 if not cond:raise AssertionError(name+' '+str(detail))
 ok(name,detail)
def images(page):
 page.wait_for_function("""()=>{const photos=Array.from(document.querySelectorAll('img[data-thumb]'));photos.forEach(x=>x.loading='eager');return photos.length>0&&photos.every(x=>x.complete&&x.naturalWidth>0)}""",timeout=45000)
 check(page.locator('.error-photo').count()==0,'No missing landmark photos')
def overflow(page,label):check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'No horizontal overflow '+label)
def go(page,hash):
 page.evaluate('(h)=>location.hash=h',hash);page.wait_for_timeout(250)
def forecast(n=8):
 start=int(time.time())//86400*86400-86400;t=[start+i*3600 for i in range(9*24)]
 f={'hourly':{'time':t,'temperature_2m':[24]*len(t),'apparent_temperature':[24]*len(t),'precipitation_probability':[10]*len(t),'weather_code':[1]*len(t),'wind_speed_10m':[12]*len(t)},'daily':{'time':[start+i*86400 for i in range(9)],'sunrise':[start+i*86400+6*3600 for i in range(9)],'sunset':[start+i*86400+19*3600 for i in range(9)]}}
 return [f for _ in range(n)]
try:
 d=json.loads((ROOT/'catalog.json').read_text());ph=json.loads((ROOT/'photos.json').read_text());g=json.loads((ROOT/'geometry.json').read_text())
 keys=set([p['photo'] for p in d['places'].values()]+[r['hero'] for r in d['routes']]+[c['hero'] for c in d['cities'].values()])
 for k in keys:
  check(k in ph and all((ROOT/ph[k][x]).is_file() for x in ['src','thumb']),'Photo exists '+k)
 hashes=[hashlib.sha256((ROOT/ph[k]['src']).read_bytes()).hexdigest() for k in keys]
 check(len(hashes)==len(set(hashes)),'Distinct landmark photographs',len(hashes))
 for r in d['routes']:
  arr=[d['places'][k]['photo'] for k in r['stops']]
  check(len(arr)==len(set(arr)),'No repeated stop photos '+r['id'])
  check(g[r['id']]['verified'] and len(g[r['id']]['legs'])==len(r['stops'])+1,'Pedestrian geometry '+r['id'])
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get("CHROME_PATH") or None)
  ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,timezone_id='Europe/Lisbon')
  ctx.route('**/api.open-meteo.com/**',lambda rt:rt.fulfill(json=forecast()))
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  response=page.goto(BASE,wait_until='domcontentloaded');check(response.status==200,'HTTP 200 app shell')
  page.wait_for_function("window.Wander?.version==='4.0.0'",timeout=45000);ok("Application initialized");images(page);overflow(page,'home390')
  check(page.locator('.city-card').count()==8,'Eight destinations');check(len(d['routes'])==14,'Fourteen walks')
  page.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
  for r in d['routes']:
   go(page,'route='+r['id']);page.wait_for_selector('.stop-card');images(page)
   check(page.locator('.stop-card').count()==len(r['stops']),'Route cards '+r['id'])
   check(page.locator('#journeyMap .leaflet-overlay-pane path').count()>0,'Journey line '+r['id'])
   sizes=page.locator('#journeyMap .leaflet-overlay-pane svg').first.bounding_box()
   check(sizes and sizes['width']>220,'Map geometry not shrunk '+r['id'])
   overflow(page,r['id'])
  go(page,'route=tomar');images(page);page.screenshot(path=str(OUT/'tomar-mobile.png'),full_page=True)
  page.locator('#journeyMap').scroll_into_view_if_needed();page.wait_for_timeout(1000);page.screenshot(path=str(OUT/'map-mobile.png'))
  # Click a real map marker, inspect the correct unique photograph and recover.
  page.locator('#journeyMap .leaflet-marker-icon[title="Convent of Christ"]').click()
  page.wait_for_selector('dialog[open]');check('Convent of Christ' in page.locator('#sheetTitle').inner_text(),'Map marker opens correct place')
  page.screenshot(path=str(OUT/'place-mobile.png'));page.click('#closeSheet')
  page.locator('[data-action="favorite"]').click();go(page,'saved');check(page.locator('.featured').count()==1,'Saved walk persists')
  go(page,'route=tomar');page.click('[data-action="start"]');page.wait_for_selector('.focus-card')
  nav=page.locator('#actionDock a').get_attribute('href')
  check('dir_action=navigate' in nav and 'travelmode=walking' in nav and 'origin=' not in nav,'Navigation uses actual location, no fake origin',nav)
  page.click('[data-action="arrived"]');check('Praça da República' in page.locator('.focus-title').inner_text(),'Advance to actual landmark')
  page.reload(wait_until='domcontentloaded');page.wait_for_selector('.focus-title');check('Praça da República' in page.locator('.focus-title').inner_text(),'Progress survives reload')
  page.screenshot(path=str(OUT/'focus-mobile.png'))
  page.click('[data-action="previous"]');check('Tomar station' in page.locator('.focus-title').inner_text(),'Back does not corrupt progress')
  go(page,'route=sintra-peaks');page.locator('[data-action="place"][data-id="mouros"]').last.click();page.click('[data-action="chooseStop"]');page.wait_for_selector('.focus-title')
  check('travelmode=transit' in page.locator('#actionDock a').get_attribute('href'),'Sintra road gap opens transit, not walking')
  # Location denied remains usable.
  ctx.grant_permissions([],origin=BASE)
  page.evaluate("()=>{navigator.geolocation.getCurrentPosition=(good,bad)=>bad({code:1});}")
  page.click('[data-action="locate"]');check('Location denied' in page.locator('#toast').inner_text(),'GPS denied explained without breaking navigation')
  go(page,'route=tomar');page.evaluate("()=>{navigator.geolocation.getCurrentPosition=(good)=>good({coords:{latitude:39.6046,longitude:-8.4192,accuracy:10},timestamp:Date.now()});}")
  page.click('[data-action="join"]');check('Join at Convent of Christ' in page.locator('#sheetTitle').inner_text(),'Join nearby suggests correct stop')
  page.click('[data-action="joinConfirm"]');check('Convent of Christ' in page.locator('.focus-title').inner_text(),'Join requires confirmation and skips old stops')
  page.click('[data-action="transport"]');check(page.locator('dialog a[href*="travelmode=transit"]').count()>=3,'Outbound and home planners available')
  page.click('#closeSheet')
  # Pure time/weather checks in the actual module.
  checks=page.evaluate("""async()=>{const m=await import('./logic.js');const W=window.Wander;const now=new Date('2026-09-05T11:00:00Z');const city=W.data.cities.sintra;const r=W.data.routes.find(x=>x.id==='sintra-peaks');const n=m.assess(r,city,null,'now',null,new Date('2026-09-05T21:30:00Z'));const tm=m.localAt(9,1,new Date('2026-09-05T23:30:00Z'));const t=now.getTime()/1000;const bundle={fetched:now.getTime(),data:{sintra:{hourly:{time:[t+city.travel*60],temperature_2m:[39],apparent_temperature:[40],precipitation_probability:[0],weather_code:[0],wind_speed_10m:[10]},daily:{time:[t],sunrise:[t-6*3600],sunset:[t+8*3600]}}}};return {night:n.label,heat:m.assess(r,city,bundle,'now',null,now).label,tomorrow:m.fmtDate(tm)+' '+m.fmtTime(tm),stale:m.weatherAt({...bundle,fetched:now.getTime()-7*3600000},'sintra',new Date((t+city.travel*60)*1000),now),absent:m.assess(r,city,null,'now',null,now).weather};}""")
  check(checks['night']=='Plan for daylight','Day-only routes suppressed after dark')
  check(checks['heat']=='Wait for cooler hours','Extreme heat changes recommendation')
  check(checks['stale'] is None and checks['absent'] is None,'Missing/stale weather never invented')
  check(checks['tomorrow'].endswith('09:00'),'Lisbon-local time around midnight',checks['tomorrow'])
  # Real service worker and explicit full-photo download.
  go(page,'route=tomar');page.evaluate('()=>navigator.serviceWorker.ready');page.reload(wait_until='domcontentloaded');page.wait_for_function('navigator.serviceWorker.controller && window.Wander')
  page.locator('[data-action="saveOffline"]').click();page.wait_for_function("document.querySelector('#downloadStatus')?.textContent.startsWith('Ready offline')",timeout=60000)
  page.click('#closeSheet');ctx.set_offline(True);page.reload(wait_until='domcontentloaded');page.wait_for_selector('.stop-card');images(page)
  check(page.locator('#journeyMap .leaflet-overlay-pane path').count()>0,'Offline reload preserves geometry')
  page.wait_for_function("document.querySelector('#connection').textContent==='Offline'",timeout=8000)
  report['offline_probe']=page.evaluate("({online:navigator.onLine,badge:document.querySelector('#connection').textContent,warning:document.querySelector('#mapWarning')?.textContent,ready:!!window.Wander})")
  print('OFFLINE',report['offline_probe'],flush=True)
  page.screenshot(path=str(OUT/'offline-mobile.png'))
  check('Offline' in page.locator('#connection').inner_text(),'Offline status is explicit',report['offline_probe'])
  page.screenshot(path=str(OUT/'offline-mobile.png'));ctx.set_offline(False)
  # Narrow phones, tablet and desktop.
  for width in [320,360,768,1280]:
   page.set_viewport_size({'width':width,'height':850});go(page,'route=tomar');overflow(page,'route '+str(width));go(page,'explore');overflow(page,'home '+str(width))
  page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
  check(not errors,'No uncaught JavaScript errors',errors)
  ctx.close()
  # New clean browser, actual production APIs (not a fixture).
  live=browser.new_context(viewport={'width':390,'height':844},timezone_id='Europe/Lisbon');lp=live.new_page();lp.goto(BASE+'#route=tomar',wait_until='domcontentloaded');lp.wait_for_function('window.Wander');lp.wait_for_timeout(8000)
  tilecount=lp.locator('#journeyMap img.leaflet-tile-loaded').count();report['live_map_tiles_loaded']=tilecount
  check(tilecount>0,'Street map tiles loaded over network',tilecount)
  report['live_weather_loaded']=lp.evaluate('!!window.Wander.state.weather')
  lp.locator('#journeyMap').scroll_into_view_if_needed();lp.screenshot(path=str(OUT/'network-map.png'))
  lp.evaluate('window.scrollTo(0,0)');lp.screenshot(path=str(OUT/'network-route.png'))
  live.close();browser.close()
 report['success']=True
except Exception as e:
 report['success']=False;report['failure']=str(e);print('FAIL',e,flush=True)
 try:report['browser_errors']=errors
 except Exception:pass

finally:
 report['finished_utc']=datetime.now(timezone.utc).isoformat();(OUT/'report.json').write_text(json.dumps(report,indent=2));print('REPORT',len(report['checks']),report.get('success'),flush=True)
sys.exit(0 if report.get('success') else 1)
