from pathlib import Path
import base64,lzma,json
P=Path('staging')
p=P/'app.js';s=p.read_text()
old=" const legMode=transfer?(S.travel.mode==='transit'?'transit':'driving'):'walking';const nav=mapsURL(n,legMode);"
new=" const initialLeg=pr.i===0&&pr.done.length===0&&(!S.gps||distance(S.gps,n)>500);const transportLeg=initialLeg||transfer;const legMode=transportLeg?(S.travel.mode==='transit'?'transit':'driving'):'walking';const nav=mapsURL(n,legMode);"
assert old in s,'First-leg patch target changed';s=s.replace(old,new)
s=s.replace("${transfer?'Use the transport link for this leg.':'Open Maps, tap Start, then put the phone away.'}","${initialLeg?'Get to the start using your selected transport.':transfer?'Use the transport link for this leg.':'Open Maps, tap Start, then put the phone away.'}")
s=s.replace("${transfer?'This gap is not marked as a walking route.':'Come back here at the landmark and tap “I’m here”.'}","${initialLeg?'Already at the start? Tap “I’m here” below.':transfer?'This gap is not marked as a walking route.':'Come back here at the landmark and tap “I’m here”.'}")
old="setDock(link(nav,`<span class=\"button-label\">${transfer?'Find transport':'Navigate with Google Maps'}<small>${transfer?'Bus / public transport planner':'Walking directions · one leg at a time'}</small></span>`,transfer?'train':'play','solid-button'));"
new="setDock(link(nav,`<span class=\"button-label\">${initialLeg?'Get to the walk start':transfer?'Find transport':'Navigate with Google Maps'}<small>${transportLeg?(S.travel.mode==='transit'?'Public transport planner':S.travel.mode==='car'?'Driving route · check legal parking':'Driving preview · Uber / Bolt quotes in trip options'):'Walking directions · one leg at a time'}</small></span>`,transportLeg?MODES[S.travel.mode].icon:'play','solid-button'));"
assert old in s,'Navigation dock target changed';s=s.replace(old,new);p.write_text(s)
# Add a useful access caveat, not a fabricated opening-hours prediction.
old="${w?.sunset?`<div class=\"daylight-badge\">${icon('sunset')}Sunset ${fmtTime(new Date(w.sunset))}</div>`:''}<button class=\"mini-link\""
new="${w?.sunset?`<div class=\"daylight-badge\">${icon('sunset')}Sunset ${fmtTime(new Date(w.sunset))}</div>`:''}${photoPlaces(r).some(p=>p.ticket)?'<p class=\"caption\">Daylight does not mean gates are open. Check today’s tickets and last entry.</p>':''}<button class=\"mini-link\""
s=s.replace(old,new);p.write_text(s)
# Reconstruct the reviewed full acceptance suite, with exact current DOM selectors.
raw=base64.b64decode(''.join(f.read_text().strip() for f in sorted(Path('scripts/wander5-ui').glob('part-*.b64'))));pack=json.loads(lzma.decompress(raw))
qa=pack['qa'].replace('[data-action=reached]','[data-action=arrived]').replace('[data-action=navigate]','#actionDock a[href*=\"google.com/maps/dir\"]')
qa=qa.replace("'focus uses Google Maps'","'focus links to Google Maps'")
needle="  page.locator('[data-action=arrived]').click();check('arrival advances manually',page.evaluate('Wander.state.progress[\"lisbon-classic\"].i')==1)"
extra="""  for m,wanted in [('transit','transit'),('car','driving'),('ride','driving')]:
   page.evaluate('(m)=>{Wander.state.travel.mode=m;Wander.state.gps=null;Wander.state.progress[\"lisbon-classic\"]={i:0,done:[],started:Date.now()};Wander.render()}',m)
   check('initial navigation respects '+m,'travelmode='+wanted in page.locator('#actionDock a').first.get_attribute('href'))
  page.locator('[data-action=arrived]').click();check('arrival advances manually',page.evaluate('Wander.state.progress[\"lisbon-classic\"].i')==1)
  check('second leg is walking','travelmode=walking' in page.locator('#actionDock a').first.get_attribute('href'))"""
assert needle in qa;qa=qa.replace(needle,extra)
Path('scripts/qa-v5.py').write_text(qa)
print('First leg respects public/car/ride; subsequent legs return to walking. Full acceptance suite ready.')
