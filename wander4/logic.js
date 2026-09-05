export const TZ='Europe/Lisbon';
export const VERSION='5.0.0';
export const fmtTime=d=>new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'}).format(d);
export const fmtDate=d=>new Intl.DateTimeFormat('en-GB',{timeZone:TZ,weekday:'short',day:'numeric',month:'short'}).format(d);
export function parts(d=new Date()){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
export function localAt(hour,days=0,now=new Date()){
 const p=parts(now),date=new Date(Date.UTC(p.year,p.month-1,p.day+days,hour));
 let guess=date.getTime();
 for(let i=0;i<3;i++){const q=parts(new Date(guess));const represented=Date.UTC(q.year,q.month-1,q.day,q.hour,q.minute,q.second);guess+=date.getTime()-represented;}
 return new Date(guess);
}
export function distance(a,b){const rad=x=>x*Math.PI/180,p=rad(a.lat),q=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lon-a.lon);const h=Math.sin(dp/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(dl/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
export function distanceText(m){return m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(m<10000?1:0)} km`;}
export function durationText(h){return h%1===0?`${h} h`:`${Math.floor(h)} h ${Math.round(h%1*60)} min`;}
export function mapsURL(destination,mode='walking',origin=null,navigate=true){const u=new URL('https://www.google.com/maps/dir/');u.searchParams.set('api','1');u.searchParams.set('destination',typeof destination==='string'?destination:`${destination.lat},${destination.lon}`);u.searchParams.set('travelmode',mode);if(origin)u.searchParams.set('origin',typeof origin==='string'?origin:`${origin.lat},${origin.lon}`);if(navigate&&mode==='walking')u.searchParams.set('dir_action','navigate');return u.href;}
export function searchURL(name){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;}
export function streetURL(point){return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${point.lat},${point.lon}`;}
export function nodesFor(r,places){let n=[{...r.start,id:'start',anchor:true,cue:'Your arrival point. Use Get there for public transport.'},...r.stops.map(id=>places[id]),{...r.end,id:'finish',anchor:true,cue:'Walk complete. Check your journey home before leaving.'}];if(distance(n[0],n[1])<35)n.shift();return n;}
export function weatherAt(bundle,city,time,now=new Date()){
 if(!bundle||!bundle.data||now.getTime()-bundle.fetched>6*3600000)return null;
 const f=bundle.data[city];if(!f?.hourly?.time?.length)return null;
 const target=time.getTime()/1000;
 let idx=0;f.hourly.time.forEach((t,i)=>{if(Math.abs(t-target)<Math.abs(f.hourly.time[idx]-target))idx=i});
 if(Math.abs(f.hourly.time[idx]-target)>5400)return null;
 const day=parts(time);const dateKey=`${day.year}-${day.month}-${day.day}`;
 const di=(f.daily?.time||[]).findIndex(t=>{const p=parts(new Date(t*1000));return `${p.year}-${p.month}-${p.day}`===dateKey});
 const sunrise=di>=0?f.daily.sunrise[di]*1000:null,sunset=di>=0?f.daily.sunset[di]*1000:null;
 return {temp:f.hourly.temperature_2m?.[idx],feels:f.hourly.apparent_temperature?.[idx],rain:f.hourly.precipitation_probability?.[idx],wind:f.hourly.wind_speed_10m?.[idx],code:f.hourly.weather_code?.[idx],sunrise,sunset,fetched:bundle.fetched,time:f.hourly.time[idx]*1000,stale:now.getTime()-bundle.fetched>3600000};
}
export function departAt(selection,city,bundle,travel=0,now=new Date()){
 if(selection==='morning')return localAt(9,1,now);
 if(selection==='sunset'){
  const f=bundle?.data?.[city];const ss=f?.daily?.sunset||[];
  const viable=ss.map(x=>x*1000-90*60000-travel*60000).find(x=>x>now.getTime()+15*60000);
  if(viable)return new Date(viable);
  let guess=localAt(16,0,now);if(guess<=now)guess=localAt(16,1,now);return guess;
 }
 return now;
}
export function assess(r,city,bundle,selection='now',gps=null,now=new Date(),travelOverride=null){
 const near=gps&&distance(gps,{lat:city.lat,lon:city.lon})<16000;
 const travel=Number.isFinite(travelOverride)?travelOverride:near?Math.min(45,Math.max(5,Math.round(distance(gps,r.start)/250))):city.travel;
 const departure=departAt(selection,city.id,bundle,travel,now),arrival=new Date(departure.getTime()+travel*60000);
 const w=weatherAt(bundle,city.id,arrival,now),p=parts(arrival);
 const day=w?.sunrise&&w?.sunset?arrival>=w.sunrise&&arrival<w.sunset:p.hour>=7&&p.hour<19;
 const left=w?.sunset?(w.sunset-arrival.getTime())/3600000:19-p.hour-p.minute/60;
 let score=60-travel/18,reason='',label='Worth a wander',tone='good';
 if(!day){if(!r.when.includes('night')){score-=200;reason='Save the full walk for daylight.';label='Plan for daylight';tone='warn';}else{score+=28;reason='A central evening route. Stay aware after dark.';label=p.hour<6?'Late-night option':'An evening option';if(p.hour<6){reason='Check the journey home first. Choose busier, lit streets.';tone='warn';}}}
 else if(!r.when.includes('day')&&r.when.includes('night')){score-=18;label='Better after sunset';reason='The atmosphere changes after dark.';}
 else if(left<Math.min(3,r.visitHours*.6)&&!r.when.includes('night')){score-=90;reason='Not enough daylight for the full outing after travel.';label='Better tomorrow';tone='warn';}
 else {score+=12;reason='Enough time for the main sights, with pauses.';label=selection==='morning'?'For tomorrow':'A good time to go';}
 if(r.moods.includes('quiet'))score+=4;if(r.moods.includes('views'))score+=4;
 if(w){
  if(w.feels>=34){score-=r.moods.includes('quiet')?38:48;label='Wait for cooler hours';reason='Hot forecast. Do not force a long exposed walk.';tone='warn';}
  else if(w.feels>=29&&!r.moods.includes('fantasy')){score-=15;if(tone==='good'){label='Take it slowly';reason='Warm forecast. Plan shade, water and shorter exposed sections.';}}
  if(w.rain>=65){score-=30;label='Rain likely';reason='Wet paving and outdoor paths may change the plan.';tone='warn';}
  if(w.wind>=40&&(r.moods.includes('water')||r.id==='sintra-peaks'||r.id==='roca'||r.id==='espichel')){score-=60;label='Windy: skip exposed edges';reason='Choose a sheltered town walk instead of cliff or castle-wall sections.';tone='warn';}
 }
 return {score,label,reason,tone,weather:w,travel,near,departure,arrival,day,daylightHours:left};
}
export function weatherIcon(code,day=true){if(!Number.isFinite(code))return '◌';if(code>=95)return '⛈';if(code>=71&&code<=77)return '❄';if(code>=51)return '☂';if(code>=45)return '≋';if(code>=2)return '☁';return day?'☀':'☾';}
export function nearestIndex(nodes,gps){let best={i:0,m:Infinity};nodes.forEach((n,i)=>{if(i===nodes.length-1)return;const m=distance(n,gps);if(m<best.m)best={i,m};});return best;}
