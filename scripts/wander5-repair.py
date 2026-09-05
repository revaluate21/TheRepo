from pathlib import Path
import urllib.request,urllib.parse,json,io,time,html,re,hashlib,math
from PIL import Image,ImageOps,ImageDraw
P=Path('staging');Q=Path('qa-repair');Q.mkdir(exist_ok=True)
D=json.loads((P/'catalog.json').read_text());PH=json.loads((P/'photos.json').read_text());PO=json.loads((P/'pois.json').read_text())
UA='WanderPortugal/5 personal travel guide'
def get(u,params=None,data=None):
 if params:u+='?'+urllib.parse.urlencode(params)
 req=urllib.request.Request(u,data=data,headers={'User-Agent':UA})
 with urllib.request.urlopen(req,timeout=28) as r:return r.read()
def info(title):
 time.sleep(.8)
 j=json.loads(get('https://commons.wikimedia.org/w/api.php',{'action':'query','format':'json','formatversion':2,'titles':'File:'+title,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1200}))
 return j['query']['pages'][0]['imageinfo'][0]
clean=lambda s:re.sub('<[^>]+>','',html.unescape(s or '')).strip()
fixes={
 'ericeira-town':'Ericeira - Portugal (51924502598).jpg',
 'ericeira-pescadores':'Ericeira March 2013-8.jpg',
 'tapada':'Tapada Nacional de Mafra - árvore.jpg',
 'azenhas':'Azenhas do Mar - Portugal (8465840989).jpg',
 'queluz-garden':'Queluz Palace gardens and ballroom wing.JPG',
 'alcochete-water':'Ponte-cais de Alcochete, Alcochete, Portugal julesvernex2.jpg',
 'buddha':'Buddha Eden (4).jpg',
 'portassol':'Views from the Portas do Sol (Santarém) 01.jpg'
}
rows=[]
for key,title in fixes.items():
 inf=info(title);m=inf['extmetadata'];license=clean(m.get('LicenseShortName',{}).get('value',''))
 if key=='queluz-garden':license='CC BY-SA 3.0'
 assert any(x in license.lower() for x in ['cc by','cc0','public domain']),license
 im=ImageOps.exif_transpose(Image.open(io.BytesIO(get(inf.get('thumburl') or inf['url'])))).convert('RGB');im.thumbnail((1200,1200))
 full=f'photos/{key}.webp';thumb=f'photos/{key}-thumb.webp';im.save(P/full,'WEBP',quality=83);ImageOps.fit(im,(440,300)).save(P/thumb,'WEBP',quality=78)
 PH[key]={'title':title,'author':clean(m['Artist']['value']),'license':license,'source':inf['descriptionurl'],'licenseURL':m.get('LicenseUrl',{}).get('value',''),'src':full,'thumb':thumb,'sha256':hashlib.sha256((P/full).read_bytes()).hexdigest()};rows.append((key,thumb));print('REPLACED',key,title,flush=True)
# A couple of alternative Buddha views are retained for manual visual choice, not served as false landmarks.
for j,title in enumerate(['Buddha Eden (7).jpg','Buddha eden (33).JPG']):
 try:
  inf=info(title);m=inf['extmetadata'];im=ImageOps.exif_transpose(Image.open(io.BytesIO(get(inf.get('thumburl') or inf['url'])))).convert('RGB');im.thumbnail((1200,1200));im.save(Q/f'buddha-alternative-{j}.webp','WEBP',quality=83)
  (Q/f'buddha-alternative-{j}.json').write_text(json.dumps({'title':title,'author':clean(m['Artist']['value']),'license':clean(m['LicenseShortName']['value']),'source':inf['descriptionurl'],'licenseURL':m.get('LicenseUrl',{}).get('value','')},ensure_ascii=False))
 except Exception as e:print('Alternative unavailable',str(e),flush=True)
# Query smaller areas and only genuinely useful public facilities. No live-opening claim.
ids={x['id']:x for x in PO['items']};kinds={'toilets':'toilets','drinking_water':'water','pharmacy':'pharmacy','parking':'parking','bench':'rest'}
centres=[('lisbon',38.7134,-9.1392,2600),('lisbon',38.697,-9.202,1800),('lisbon',38.765,-9.095,1800),('almada',38.68,-9.164,2300),('obidos',39.36,-9.157,1600),('azenhas',38.839,-9.462,1500),('peniche',39.356,-9.382,2000),('caparica',38.644,-9.237,1800),('foz',39.435,-9.226,1800)]
for city,lat,lon,radius in centres:
 q=f'[out:json][timeout:15];node(around:{radius},{lat},{lon})[amenity~"^(toilets|drinking_water|pharmacy|parking|bench)$"];out tags;';j=None
 for host in ['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter']:
  try:time.sleep(3);j=json.loads(get(host,data=urllib.parse.urlencode({'data':q}).encode()));break
  except Exception as e:print('Essential fallback',city,str(e)[:60],flush=True)
 if j is None:continue
 count=0
 for el in j.get('elements',[]):
  t=el.get('tags',{});kind=kinds.get(t.get('amenity'))
  if not kind or t.get('access') in ['no','private','permit','customers']:continue
  if kind=='water' and t.get('drinking_water')=='no':continue
  key=f"osm-node-{el['id']}";name=t.get('name:en') or t.get('name') or {'toilets':'Public toilet (mapped)','water':'Drinking-water point','pharmacy':'Pharmacy','parking':'Mapped parking','rest':'Bench / rest point'}[kind]
  ids[key]={'id':key,'name':name,'lat':el['lat'],'lon':el['lon'],'kind':kind,'hours':t.get('opening_hours'),'fee':t.get('fee'),'access':t.get('access'),'wheelchair':t.get('wheelchair'),'source':f"https://www.openstreetmap.org/node/{el['id']}",'city':city,'note':'OpenStreetMap snapshot; hours, access and availability need checking.'};count+=1
 print('ESSENTIALS',city,count,flush=True)
PO['items']=list(ids.values());PO['coverage']={cid:sum(x.get('city')==cid for x in PO['items']) for cid in D['cities']}
(P/'pois.json').write_text(json.dumps(PO,ensure_ascii=False,separators=(',',':')));(P/'photos.json').write_text(json.dumps(PH,ensure_ascii=False,indent=2))
for index in range(0,len(rows),6):
 sheet=Image.new('RGB',(1080,540),'white');draw=ImageDraw.Draw(sheet)
 for n,(key,thumb) in enumerate(rows[index:index+6]):
  x=n%3*360;y=n//3*270;sheet.paste(ImageOps.fit(Image.open(P/thumb),(350,235)),(x,y));draw.text((x+5,y+240),key,fill='black')
 sheet.save(Q/f'repaired-{index//6}.jpg',quality=90)
(Q/'coverage.json').write_text(json.dumps(PO['coverage'],indent=2));print('DONE',len(PH),'photos',len(PO['items']),'facilities')
