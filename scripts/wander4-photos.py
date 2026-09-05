from pathlib import Path
import json, urllib.request, urllib.parse, time, re, io, hashlib, html, math, unicodedata
from PIL import Image, ImageOps, ImageDraw
OUT=Path('wander4-stage');(OUT/'photos').mkdir(parents=True,exist_ok=True);(OUT/'vendor').mkdir(exist_ok=True)
UA='WanderPortugal/4 (personal walking guide; https://revaluate21.github.io/TheRepo/)'
def get(u,j=False):
 for n in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':UA}),timeout=35) as r:b=r.read()
   return json.loads(b) if j else b
  except Exception as e:
   if n==2:raise
   h=getattr(e,'headers',{}) or {};v=h.get('Retry-After','');time.sleep(int(v) if str(v).isdigit() else 4*(n+1))
def clean(s):return re.sub(r'\s+',' ',re.sub('<[^>]+>','',html.unescape(s or ''))).strip()
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))
queries={
'ribeira':'Ribeira das Naus Lisboa','padrao':'Padrão dos Descobrimentos Lisboa','jeronimos':'Mosteiro dos Jerónimos Lisboa exterior','pavilion':'Pavilhão de Portugal Lisboa','oceanario':'Oceanário Lisboa exterior','tower-vg':'Torre Vasco da Gama Lisboa','cerca':'Casa da Cerca Almada','sintra-palace':'Palácio Nacional Sintra exterior','cascais-bay':'Praia Ribeira Cascais','marechal':'Parque Marechal Carmona Cascais','santamarta':'Farol Santa Marta Cascais','tamariz':'Praia Tamariz Estoril','sevelha':'Sé Velha Coimbra exterior','botanic':'Jardim Botânico Universidade Coimbra','mondego':'Parque Verde Mondego Coimbra','santaclara':'Mosteiro Santa Clara Velha Coimbra','tomar-praca':'Praça República Tomar','tomar-mata':'Mata Sete Montes Tomar','mouchao':'Jardim Mouchão Tomar','pontevelha':'Ponte Velha Tomar','obidos-gate':'Porta Vila Óbidos','ruadireita':'Rua Direita Óbidos','obidos-church':'Igreja Santa Maria Óbidos','giraldo':'Praça Giraldo Évora','evora-se':'Sé Évora exterior','evora-garden':'Jardim Público Évora'}
credits={};fail=[]
def save(key,raw,meta):
 p=OUT/'photos'/f'{key}.webp'
 with Image.open(io.BytesIO(raw)) as im:
  im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((1200,1100),Image.Resampling.LANCZOS)
  if min(im.size)<300 or im.convert('L').entropy()<4:raise ValueError('Low-detail image')
  im.save(p,'WEBP',quality=82,method=6)
  thumb=ImageOps.fit(im,(440,300),method=Image.Resampling.LANCZOS);thumb.save(OUT/'photos'/f'{key}-thumb.webp','WEBP',quality=76)
 meta.update(src=f'photos/{key}.webp',thumb=f'photos/{key}-thumb.webp',bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest());credits[key]=meta
for m in json.loads(Path('wander/photo-credits.json').read_text()):
 key=Path(m['asset']).stem
 try:save(key,Path('assets/photos',m['asset']).read_bytes(),{k:m[k] for k in ['title','author','license','source']})
 except Exception as e:fail.append(key);print('FAILED existing',key,str(e),flush=True)
for key,query in queries.items():
 try:
  q={'action':'query','format':'json','formatversion':2,'generator':'search','gsrsearch':query+' filetype:bitmap','gsrnamespace':6,'gsrlimit':8,'prop':'imageinfo','iiprop':'url|extmetadata|size|mime','iiurlwidth':1000}
  data=get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(q),True)
  candidates=[];tokens=[x for x in re.findall(r'\w+',norm(query)) if len(x)>3]
  for page in data.get('query',{}).get('pages',[]):
   inf=(page.get('imageinfo') or [{}])[0];title=page.get('title','');tn=norm(title)
   if inf.get('mime') not in ['image/jpeg','image/png','image/webp'] or min(inf.get('width',0),inf.get('height',0))<450:continue
   if re.search(r'\b(map|plan|drawing|escudo|coat|logo|croquis|planta)\b',tn):continue
   score=2*sum(t in tn for t in tokens)+min(inf.get('width',0)/max(1,inf.get('height',0)),1.7)*.4
   candidates.append((score,page,inf))
  if not candidates:raise ValueError('No matching photo')
  _,page,inf=max(candidates,key=lambda x:x[0]);em=inf.get('extmetadata',{});lic=clean(em.get('LicenseShortName',{}).get('value',''))
  if not any(x in lic.lower() for x in ['cc','public domain','pd']):raise ValueError('Unclear licence')
  try:raw=get(inf.get('thumburl') or inf['url'])
  except Exception:
   if inf.get('size',0)>18000000:raise
   raw=get(inf['url'])
  title=page['title'].removeprefix('File:');meta={'title':title,'author':clean(em.get('Artist',{}).get('value','')),'license':lic,'source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(title.replace(' ','_'))}
  save(key,raw,meta);print('PHOTO',key,title,flush=True)
 except Exception as e:fail.append(key);print('FAILED',key,repr(e),flush=True)
 time.sleep(1.5)
(OUT/'photos.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2))
sheet=Image.new('RGB',(1200,math.ceil(len(credits)/5)*178),'white');draw=ImageDraw.Draw(sheet)
for i,(key,m) in enumerate(credits.items()):
 with Image.open(OUT/m['src']) as im:thumb=ImageOps.fit(im,(240,145))
 x=i%5*240;y=i//5*178;sheet.paste(thumb,(x,y));draw.text((x+3,y+149),key,fill='black')
sheet.save(OUT/'photo-review.jpg',quality=88)
for n in ['leaflet.js','leaflet.css']:(OUT/'vendor'/n).write_bytes(get('https://unpkg.com/leaflet@1.9.4/dist/'+n))
(OUT/'vendor'/'leaflet-LICENSE.txt').write_bytes(get('https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/LICENSE'))
(OUT/'asset-report.json').write_text(json.dumps({'photos':len(credits),'failed':fail},indent=2))
print('RESULT',len(credits),fail,flush=True)
