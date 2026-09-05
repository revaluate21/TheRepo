from pathlib import Path
import json, urllib.request, urllib.parse, time, re, html, io, math
from PIL import Image, ImageOps, ImageDraw
O=Path('wander4-review');O.mkdir(exist_ok=True);meta={}
queries={'tamariz':'"Tamariz"','obidos-gate':'"Porta da Vila" "Óbidos"','mouchao':'"Mouchão"','evora-se':'"Sé de Évora"','tower-vg':'"Torre Vasco da Gama"','pena':'"Pena Palace"','ribeira':'"Ribeira das Naus"'}
def get(u,j=False):
 for n in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'WanderPortugal/4 personal photo attribution review'}),timeout=30) as r:b=r.read()
   return json.loads(b) if j else b
  except Exception as e:
   if n==2:raise
   time.sleep(5*(n+1))
def clean(t):return re.sub(r'\s+',' ',re.sub('<[^>]+>','',html.unescape(t or ''))).strip()
for k,query in queries.items():
 q={'action':'query','format':'json','formatversion':2,'generator':'search','gsrsearch':query+' filetype:bitmap','gsrnamespace':6,'gsrlimit':12,'prop':'imageinfo','iiprop':'url|size|mime|extmetadata','iiurlwidth':1000}
 try:data=get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(q),True)
 except Exception as e:print(k,e);continue
 count=0
 for page in data.get('query',{}).get('pages',[]):
  inf=(page.get('imageinfo') or [{}])[0];em=inf.get('extmetadata',{});lic=clean(em.get('LicenseShortName',{}).get('value',''))
  if inf.get('mime') not in ['image/jpeg','image/png'] or min(inf.get('width',0),inf.get('height',0))<600:continue
  if not any(v in lic.lower() for v in ['cc','public domain','pd']):continue
  try:
   raw=get(inf.get('thumburl') or inf['url']);im=ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB');im.thumbnail((1200,1100));
   if im.convert('L').entropy()<4:continue
   ident=f'{k}-{count}';im.save(O/f'{ident}.webp','WEBP',quality=82,method=6);ImageOps.fit(im,(440,300)).save(O/f'{ident}-thumb.webp','WEBP',quality=76)
   title=page['title'].removeprefix('File:');meta[ident]={'title':title,'author':clean(em.get('Artist',{}).get('value','')),'license':lic,'source':'https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(title.replace(' ','_'))};print(ident,title,flush=True);count+=1
  except Exception as e:print('skip',str(e)[:80],flush=True)
  time.sleep(1.3)
  if count>=5:break
(O/'choices.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
w=1200;h=200;canvas=Image.new('RGB',(w,math.ceil(len(meta)/5)*h),'white');draw=ImageDraw.Draw(canvas)
for i,(key,m) in enumerate(meta.items()):
 with Image.open(O/f'{key}.webp') as im:small=ImageOps.fit(im,(240,165))
 x=i%5*240;y=i//5*h;canvas.paste(small,(x,y));draw.text((x+3,y+169),key,fill='black')
canvas.save(O/'review.jpg',quality=90)
