"""Build new Wander assets in staging. No publication until browser and photo QA."""
from pathlib import Path
import json,urllib.request,urllib.parse,time,html,re,io,hashlib,math,os
from datetime import datetime,timezone
from PIL import Image,ImageOps,ImageDraw
P=Path(os.environ.get('WANDER_DIR','staging'));P.mkdir(exist_ok=True)
D=json.loads((P/'catalog.json').read_text());PH=json.loads((P/'photos.json').read_text());G=json.loads((P/'geometry.json').read_text())
requests=json.loads((P/'new-photos.json').read_text());review=Path('qa-assets');review.mkdir(exist_ok=True)
UA='WanderPortugalPersonalGuide/5 (+https://revaluate21.github.io/TheRepo/wander4/)'
def get(url,params=None,data=None,timeout=30):
 if params:url+='?'+urllib.parse.urlencode(params)
 req=urllib.request.Request(url,data=data,headers={'User-Agent':UA,'Accept':'application/json,image/*,*/*'})
 with urllib.request.urlopen(req,timeout=timeout) as r:return r.read()
def api(params):
 time.sleep(.7)
 return json.loads(get('https://commons.wikimedia.org/w/api.php',{'action':'query','format':'json','formatversion':2,**params}))
def clean(v):return re.sub('<[^>]+>','',html.unescape(v or '')).strip()
def hav(a,b):
 p,q=math.radians(a['lat']),math.radians(b['lat']);dp=q-p;dl=math.radians(b['lon']-a['lon']);h=math.sin(dp/2)**2+math.cos(p)*math.cos(q)*math.sin(dl/2)**2;return 6371000*2*math.atan2(math.sqrt(h),math.sqrt(1-h))
used={p.get('source') for p in PH.values()};fail=[];report=[]
for key,q in requests.items():
 if key in PH and (P/PH[key]['src']).exists():continue
 candidates=[]
 try:
  for query in [q['query'],' '.join(q['query'].split()[:3])]:
   j=api({'generator':'search','gsrsearch':query+' filetype:bitmap','gsrnamespace':6,'gsrlimit':6,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':1200})
   for page in sorted(j.get('query',{}).get('pages',[]),key=lambda p:p.get('index',99)):
    info=page.get('imageinfo',[{}])[0];meta=info.get('extmetadata',{});license=clean(meta.get('LicenseShortName',{}).get('value',''));source=info.get('descriptionurl','')
    if not info.get('url') or not any(x in license.lower() for x in ['cc by','cc0','public domain']):continue
    if source in used or info.get('width',0)<500 or info.get('height',0)<300:continue
    if any(x in page['title'].lower() for x in ['coat of arms','map of','locator','flag of','logo','coat-of']):continue
    candidates.append((page,info,meta,license,source))
   if candidates:break
  if not candidates:raise RuntimeError('No freely licensed photo candidate')
  success=False
  for page,info,meta,license,source in candidates:
   try:
    raw=get(info.get('thumburl') or info['url'],timeout=30)
    im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    if im.width<500:raise ValueError('too small')
    im.thumbnail((1200,1200));(P/'photos').mkdir(exist_ok=True)
    full=f'photos/{key}.webp';thumb=f'photos/{key}-thumb.webp'
    im.save(P/full,'WEBP',quality=82);ImageOps.fit(im,(440,300)).save(P/thumb,'WEBP',quality=77)
    PH[key]={'title':page['title'].removeprefix('File:'),'author':clean(meta.get('Artist',{}).get('value','')),'license':license,'source':source,'src':full,'thumb':thumb,'sha256':hashlib.sha256((P/full).read_bytes()).hexdigest(),'expected':q['expected']}
    used.add(source);report.append({'key':key,'expected':q['expected'],'selected':page['title'],'source':source});success=True;print('PHOTO',key,page['title'],flush=True);break
   except Exception as e:print('Photo candidate failed',key,str(e)[:90],flush=True)
  if not success:raise RuntimeError('No candidate could download')
 except Exception as e:fail.append({'key':key,'error':str(e)});print('PHOTO MISSING',key,str(e),flush=True)
 (P/'photos.json').write_text(json.dumps(PH,ensure_ascii=False,indent=2))
(review/'photo-selections.json').write_text(json.dumps({'selected':report,'failed':fail},ensure_ascii=False,indent=2))
for offset in range(0,len(report),12):
 chunk=report[offset:offset+12];sheet=Image.new('RGB',(1080,math.ceil(len(chunk)/3)*260),'white');draw=ImageDraw.Draw(sheet)
 for i,item in enumerate(chunk):
  im=ImageOps.fit(Image.open(P/PH[item['key']]['thumb']),(344,208));x=(i%3)*360+8;y=(i//3)*260+4;sheet.paste(im,(x,y));draw.text((x,y+211),item['key'],fill='black');draw.text((x,y+229),item['expected'][:48],fill='black')
 sheet.save(review/f'new-photos-{offset//12+1}.jpg',quality=88)
def routed(a,b,mode):
 url=f"https://routing.openstreetmap.de/routed-{mode}/route/v1/driving/{a['lon']},{a['lat']};{b['lon']},{b['lat']}";time.sleep(1.05)
 j=json.loads(get(url,{'overview':'full','geometries':'geojson','steps':'false'},timeout=30))
 if j.get('code')!='Ok' or not j.get('routes'):raise RuntimeError('No route')
 return j['routes'][0]
for r in D['routes']:
 try:
  rr=routed(D['home'],r['start'],'car');opts=r.setdefault('travelOptions',{});opts['km']=round(rr['distance']/1000,1);opts['driveMinutes']=max(5,math.ceil(rr['duration']/60));opts['roadSource']='FOSSGIS OSRM / OpenStreetMap';opts['roadDate']=datetime.now(timezone.utc).date().isoformat();print('CAR',r['id'],opts['km'],opts['driveMinutes'],flush=True)
 except Exception as e:print('Car estimate retained',r['id'],str(e)[:100],flush=True)
 if not r.get('new'):continue
 nodes=[{**r['start'],'id':'start'},*[D['places'][k] for k in r['stops']],{**r['end'],'id':'finish'}];legs=[];verified=True
 pairs={(t[0],t[1]) if isinstance(t,list) else (t['from'],t['to']) for t in r.get('transfers',[])}
 for a,b in zip(nodes,nodes[1:]):
  base={'start':a['id'],'end':b['id']}
  if (a['id'],b['id']) in pairs or (b['id']=='finish' and r.get('transfers') and hav(a,b)>700):legs.append({**base,'mode':'transit','points':[[a['lat'],a['lon']],[b['lat'],b['lon']]],'km':0});continue
  if hav(a,b)<35:legs.append({**base,'mode':'walk','points':[[a['lat'],a['lon']],[b['lat'],b['lon']]],'km':0});continue
  try:
   rr=routed(a,b,'foot');pts=[[round(y,6),round(x,6)] for x,y in rr['geometry']['coordinates']]
   if rr['distance']>max(8000,5*hav(a,b)):raise RuntimeError('Implausible path detour')
   legs.append({**base,'mode':'walk','points':pts,'km':round(rr['distance']/1000,3)})
  except Exception as e:verified=False;legs.append({**base,'mode':'unverified','points':[[a['lat'],a['lon']],[b['lat'],b['lon']]],'km':None});print('Walk unverified',r['id'],a['id'],b['id'],str(e)[:90],flush=True)
 single=len(r['stops'])==1;G[r['id']]={'legs':legs,'walkKm':None if single or not verified else round(sum(x['km'] for x in legs if x['mode']=='walk'),2),'verified':verified and not single,'source':'FOSSGIS OSRM / OpenStreetMap','note':'Single-site walks explore signed internal paths; no invented full track.' if single else 'Pedestrian preview, subject to access and closures.'}
(P/'catalog.json').write_text(json.dumps(D,ensure_ascii=False,indent=2));(P/'geometry.json').write_text(json.dumps(G,separators=(',',':')))
items={};errors=[]
for cid,c in D['cities'].items():
 radius=6000 if cid=='lisbon' else 3500
 q=f'''[out:json][timeout:28];(nwr(around:{radius},{c['lat']},{c['lon']})[amenity~"^(toilets|drinking_water|pharmacy|parking|restaurant|cafe)$"];node(around:{radius},{c['lat']},{c['lon']})[amenity=bench];);out center tags;''';data=None
 for endpoint in ['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter']:
  try:time.sleep(1.5);data=json.loads(get(endpoint,data=urllib.parse.urlencode({'data':q}).encode(),timeout=40));break
  except Exception as e:errors.append(cid+': '+str(e)[:100])
 if not data:continue
 kinds={'toilets':'toilets','drinking_water':'water','pharmacy':'pharmacy','parking':'parking','restaurant':'food','cafe':'food','bench':'rest'};counts={};els=data.get('elements',[])
 for el in els:
  t=el.get('tags',{});kind=kinds.get(t.get('amenity'));pos=el.get('center',el)
  if not kind or 'lat' not in pos or t.get('access') in ['private','no','customers','permit']:continue
  if kind=='water' and t.get('drinking_water')=='no':continue
  if kind=='parking' and t.get('parking')=='lane':continue
  counts[kind]=counts.get(kind,0)+1
  if counts[kind]>{'food':45,'rest':35,'parking':35}.get(kind,100):continue
  id=f"osm-{el['type']}-{el['id']}";name=t.get('name:en') or t.get('name') or {'toilets':'Public toilet (mapped)','water':'Drinking-water point','rest':'Bench / rest point','parking':'Mapped parking','food':'Restaurant / cafe (mapped)','pharmacy':'Pharmacy'}[kind]
  items[id]={'id':id,'name':name,'lat':pos['lat'],'lon':pos['lon'],'kind':kind,'hours':t.get('opening_hours'),'fee':t.get('fee'),'access':t.get('access'),'wheelchair':t.get('wheelchair'),'source':f"https://www.openstreetmap.org/{el['type']}/{el['id']}",'city':cid,'note':t.get('description') or 'From OpenStreetMap. Availability, hours and public access need checking.'}
 print('POI',cid,len(els),'kept total',len(items),flush=True)
(P/'pois.json').write_text(json.dumps({'fetched':datetime.now(timezone.utc).date().isoformat(),'source':'OpenStreetMap contributors · ODbL','items':list(items.values()),'errors':errors,'note':'Partial, dated snapshot; not current opening or complete coverage.'},ensure_ascii=False,separators=(',',':')))
summary={'newPhotos':len(report),'missingPhotos':fail,'amenities':len(items),'amenityErrors':errors,'mappedRoutes':len(G),'cities':len(D['cities']),'routes':len(D['routes'])};(review/'assets-summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
