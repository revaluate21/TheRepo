from pathlib import Path
import base64,lzma,json,re
P=Path('staging');p=P/'app.js';s=p.read_text()
s=s.replace('not Uber/Bolt pricing · return would be a separate quote','not a live Uber/Bolt quote · return priced separately')
needle='<div class="map-head"><strong>Your whole journey</strong><div class="map-controls">'
s=s.replace(needle,needle+'<button class="icon-button" data-action="mapStyle" aria-label="Toggle game or street map style">${icon(\'map\')}</button>')
s=s.replace("if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js'","if('serviceWorker'in navigator){const hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.register('./sw.js'")
s=s.replace("navigator.serviceWorker.addEventListener('controllerchange',()=>{const bar=","navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController)return;const bar=")
needle="  if(!S.downloads.includes(r.id))S.downloads.push(r.id);"
new="  if(!('serviceWorker'in navigator))throw Error('Offline reopening needs a supported HTTPS browser.');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('App cache is still installing. Retry saving in a moment.')),30000))]);\n"+needle
assert needle in s;s=s.replace(needle,new);p.write_text(s)
# Reconstruct the same reviewed QA, not the patching stage.
src=Path('scripts/wander5-final-polish.py').read_text();exec(src[src.index('# Reconstruct the reviewed full acceptance suite'):])
src=Path('scripts/wander5-ready.py').read_text();exec(src[src.index('# Tests exercise maps and pins'):src.index('# A human-directed single-view')])
(P/'README.md').write_text('''# Wander 5 · Portugal escapes

30 curated outings across 24 areas, with 83 distinct credited local photographs.
Public-only, car and ride-budget planning from the approximate Loures base.
Travel times, costs and map-facility snapshots are estimates, not live availability.
Fuel reference is dated in catalog.json. All photographs have linked attribution.
Phone-down navigation is handed to Google Maps, one leg at a time.
Saved home, progress and parking stay device-local. No account or analytics.
Offline saving covers the app, route outlines and photographs, not street tiles.

OpenStreetMap map tiles load only for normal interactive viewing. They are not
prefetched or saved as an offline map. Automated geometry/UI tests use a labelled
basemap fixture; a separate single-view visual check inspected actual tiles.
''')
print('Release preparation complete')
