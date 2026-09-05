from pathlib import Path
import runpy
p=Path('scripts/wander5-repair.py');s=p.read_text().replace('out tags;','out body;').replace("  t=el.get('tags',{});kind=kinds.get(t.get('amenity'))","  if 'lat' not in el or 'lon' not in el:continue\n  t=el.get('tags',{});kind=kinds.get(t.get('amenity'))")
s=s.replace('# A couple of alternative Buddha views',"(P/'photos.json').write_text(json.dumps(PH,ensure_ascii=False,indent=2))\n# A couple of alternative Buddha views")
p.write_text(s);runpy.run_path(str(p),run_name='__main__')
p=Path('scripts/wander5-prepare.py');s=p.read_text();old="Path('changes.patch').write_text(pack['patch']);subprocess.run(['git','apply','--directory=staging','changes.patch'],check=True)";new="Path('changes.patch').write_text(re.sub(r'(?<!\\n)--- a/',r'\\n--- a/',pack['patch']));subprocess.run(['patch','-p1','--batch','-d','staging','-i',str(Path('changes.patch').resolve())],check=True)";assert old in s;s=s.replace(old,new);p.write_text(s);runpy.run_path(str(p),run_name='__main__')
# Curated choices near existing walks: no invented review scores or live opening claims.
import json
p=Path('staging/catalog.json');d=json.loads(p.read_text());d['pickedFood'] += [
 {'id':'food-mar-inferno','name':'Mar do Inferno','lat':38.6923,'lon':-9.4301,'kind':'restaurant','badge':'Official tourism selection','note':'Sea-view fish and seafood beside Boca do Inferno. Check the current menu, booking and prices.','price':'Menu varies','source':'https://www.visitcascais.com/en/partners/mar-do-inferno'},
 {'id':'food-solar-bacalhau','name':'Solar do Bacalhau','lat':40.2065,'lon':-8.4303,'kind':'restaurant','badge':'MICHELIN Guide listed','note':'Portuguese cooking in Coimbra’s lower old town, with an emphasis on salt cod. Check the current menu and hours.','price':'€','source':'https://guide.michelin.com/en/coimbra/coimbra/restaurant/solar-do-bacalhau'}
];p.write_text(json.dumps(d,ensure_ascii=False,indent=2))
