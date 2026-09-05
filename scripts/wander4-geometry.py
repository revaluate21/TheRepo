from pathlib import Path
import json,urllib.request,urllib.parse,time
D=json.loads(Path('scripts/wander4-route-input.json').read_text());P=D['places'];OUT=Path('wander4-geometry');OUT.mkdir(exist_ok=True)
cache={};G={}
def decode(s):
 i=0;lat=lon=0;pts=[]
 while i<len(s):
  vals=[]
  for _ in range(2):
   n=sh=0
   while True:
    b=ord(s[i])-63;i+=1;n|=(b&31)<<sh;sh+=5
    if b<32:break
   vals.append(~(n>>1) if n&1 else n>>1)
  lat+=vals[0];lon+=vals[1];pts.append([round(lat/1e6,6),round(lon/1e6,6)])
 return pts
for r in D['routes']:
 nodes=[('start',r['start'])]+[(k,P[k]) for k in r['stops'].split()]+[('finish',r['end'])];legs=[];trans={tuple(x) for x in r.get('transfers',[])}
 for (aid,a),(bid,b) in zip(nodes,nodes[1:]):
  key=json.dumps([a,b]);via=None
  if r['id']=='almada' and aid=='start':via=[38.68118,-9.15415];key+='upper-town'
  if (aid,bid) in trans:res={'mode':'transit','points':[a,b],'km':0}
  elif abs(a[0]-b[0])+abs(a[1]-b[1])<.00004:res={'mode':'walk','points':[a,b],'km':0}
  elif key in cache:res=cache[key]
  else:
   loc=[{'lat':a[0],'lon':a[1],'type':'break'}]
   if via:loc.append({'lat':via[0],'lon':via[1],'type':'via'})
   loc.append({'lat':b[0],'lon':b[1],'type':'break'})
   q={'locations':loc,'costing':'pedestrian','units':'kilometers','directions_options':{'units':'kilometers'},'costing_options':{'pedestrian':{'walking_speed':4.5}}}
   u='https://valhalla1.openstreetmap.de/route?json='+urllib.parse.quote(json.dumps(q,separators=(',',':')))
   res={'mode':'unverified','points':[a,b],'km':None}
   for n in range(2):
    try:
     req=urllib.request.Request(u,headers={'User-Agent':'WanderPortugal/4 personal itinerary build','X-Client-Id':'revaluate21.github.io/TheRepo/Wander4'})
     with urllib.request.urlopen(req,timeout=35) as f:j=json.load(f)
     t=j['trip'];pts=[]
     for l in t['legs']:pts+=decode(l['shape'])
     res={'mode':'walk','points':pts,'km':t['summary']['length']};break
    except Exception as e:print('retry',r['id'],aid,bid,str(e),flush=True);time.sleep(5)
   cache[key]=res;time.sleep(1.2)
  legs.append({'start':aid,'end':bid,**res})
 G[r['id']]={'legs':legs,'walkKm':round(sum(l['km'] or 0 for l in legs),2),'verified':all(l['mode']!='unverified' for l in legs)}
 print(r['id'],G[r['id']]['walkKm'],G[r['id']]['verified'],flush=True)
(OUT/'geometry.json').write_text(json.dumps(G,separators=(',',':')))
(OUT/'geometry-report.json').write_text(json.dumps({r:{'km':g['walkKm'],'verified':g['verified'],'legs':len(g['legs'])} for r,g in G.items()},indent=2))
