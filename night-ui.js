'use strict';
(() => {
  if (!DATA.liveNight) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './night-ui.css?v=10';
  document.head.appendChild(css);

  const params = new URLSearchParams(location.search);
  const mode = params.get('route');
  const planner = document.querySelector('#planner');
  if (!planner) return;

  const panel = document.createElement('section');
  panel.id = 'liveNight';
  panel.className = 'live-control';
  panel.innerHTML = `
    <div class="live-head">
      <div><div class="live-kicker">LIVE MODE · YOU ARE AT ROSSIO</div><h2>Choose the next 2–4 hours</h2><p>Every option finishes near a realistic trip home.</p></div>
      <div id="liveClock" class="live-clock">--:--</div>
    </div>
    <div id="liveRecommend" class="live-recommend"></div>
    <div id="liveRoutes" class="live-routes"></div>
    <div class="club-options">
      <a class="club-card best" href="https://ra.co/events/2509556" target="_blank" rel="noopener"><b>🔊 Riktus · Ministerium</b><span>23:59–08:00 · industrial techno / hardcore · best White Hotel fit</span></a>
      <a class="club-card" href="https://site.fourvenues.com/en/aaulht/events/ZBD9" target="_blank" rel="noopener"><b>🌈 Under the Bridge · Loucura</b><span>23:00–06:00 · Afro House · directly on Pink Street</span></a>
      <a class="club-card" href="https://ma.to/event/weird-baile-fomo-03-sep-2026" target="_blank" rel="noopener"><b>🌀 Weird Baile & FOMO</b><span>00:00–06:00 · free · two rooms at Casa Capitão; farther east</span></a>
      <a class="club-card late" href="https://ra.co/events/2526086" target="_blank" rel="noopener"><b>🪩 Lux Frágil</b><span>Listed until 04:00 · only sensible as a quick last-call option now</span></a>
    </div>
    <div class="return-grid">
      <article class="return-card"><h3>🚌 207 from Rossio → Fetais</h3><p><b>Closest option right now.</b> Board at <strong>00902 Rossio</strong>. Approximate Rossio pass times:</p><div id="rossio207Times" class="time-row"></div><p>Ride north to Fetais, then take a short Bolt/Uber to 2660-213. Check CARRISway before committing.</p></article>
      <article class="return-card"><h3>🚌 207 from Cais do Sodré → Fetais</h3><p>Best when your route finishes by Pink Street / the river. Terminal stop <strong>03807 Cais Sodré</strong>:</p><div id="cais207Times" class="time-row"></div><p>Terminal departure is easier to understand than intercepting the bus mid-route.</p></article>
      <article class="return-card"><h3>🚌 206 backup → Odivelas</h3><p>Leaves Cais do Sodré, passes Praça do Comércio, Campo Grande and Sr. Roubado, then Odivelas:</p><div id="cais206Times" class="time-row"></div><p>Use a Bolt/Uber from Sr. Roubado or Odivelas for the last leg. It does not serve Rossio on its base route.</p></article>
      <article class="return-card"><h3>🌅 Dawn reset: 736 / Metro</h3><p>If you stay past the final 207, 736 begins from Rossio toward Odivelas:</p><div id="rossio736Times" class="time-row"></div><p>Lisbon Metro resumes around <strong>06:30</strong>. At that point, use live Maps/CARRISway rather than waiting around for one specific night bus.</p></article>
    </div>
    <div class="live-links"><a class="btn aqua small" href="https://cway.carris.pt/" target="_blank" rel="noopener">CARRISway live buses</a><a class="btn ghost small" href="https://www.google.com/maps/search/?api=1&query=00902%20Rossio%20Lisboa" target="_blank" rel="noopener">Find 00902 Rossio</a><a class="btn ghost small" href="https://www.google.com/maps/search/?api=1&query=03807%20Cais%20Sodr%C3%A9%20Lisboa" target="_blank" rel="noopener">Find 03807 Cais</a></div>
    <p class="safety-note">Late-night timetable times are planned, not a live guarantee. Keep battery for the final leg, use lit/busier streets, and keep enough awareness to hear traffic and people around you.</p>`;
  planner.insertAdjacentElement('afterend', panel);

  const descriptions = {
    'rossio-club': ['Riktus first · 2–3h', 'Rossio → Praça do Comércio → two hours of industrial techno → river/Pink Street → Cais'],
    'rossio-2h': ['Scenic loop · ≈2h', 'Carmo → São Pedro → Santa Catarina/Bica → river → check Riktus → Cais'],
    'rossio-3h': ['Old city + club · ≈3h', 'Mural → Sé → Santa Luzia/Graça → 60 min Riktus → river → Cais'],
    'rossio-4h': ['Full night + club · ≈4h', 'Western viewpoints → river → two hours Riktus → Cais']
  };
  const routesBox = panel.querySelector('#liveRoutes');
  Object.entries(descriptions).forEach(([key, value]) => {
    const b = document.createElement('button');
    b.className = `live-route ${mode === key ? 'active' : ''}`;
    b.innerHTML = `<b>${value[0]}</b><span>${value[1]}</span>`;
    b.addEventListener('click', () => {
      const u = new URL(location.href);
      u.searchParams.set('route', key);
      u.searchParams.set('now', '1');
      u.searchParams.set('app', 'v10');
      u.searchParams.set('fresh', '1');
      location.href = u.toString();
    });
    routesBox.appendChild(b);
  });

  const toMinutes = text => { const [h,m] = text.split(':').map(Number); return h*60+m; };
  const nowMinutes = () => { const d = new Date(); return d.getHours()*60+d.getMinutes(); };
  const timelineMinutes = text => { const m=toMinutes(text), n=nowMinutes(); return m < 8*60 && n > 12*60 ? m+1440 : m; };
  const currentTimeline = () => { const n=nowMinutes(); return n < 8*60 ? n+1440 : n; };
  const nextTime = list => list.find(t => timelineMinutes(t) >= currentTimeline());
  const pills = (id, list) => {
    const next = nextTime(list);
    panel.querySelector(id).innerHTML = list.map(t => `<span class="time-pill ${t===next?'next':''}">${t}</span>`).join('');
  };

  function plannedFinish(){
    try { return fmtTime(etaFor(route().length-1)); } catch (_) { return '—'; }
  }
  function update(){
    const d = new Date();
    panel.querySelector('#liveClock').textContent = d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    pills('#rossio207Times', DATA.liveNight.buses.rossio207);
    pills('#cais207Times', DATA.liveNight.buses.cais207);
    pills('#cais206Times', DATA.liveNight.buses.cais206);
    pills('#rossio736Times', DATA.liveNight.buses.rossio736);
    const rNext=nextTime(DATA.liveNight.buses.rossio207), cNext=nextTime(DATA.liveNight.buses.cais207);
    let advice;
    if (mode === 'rossio-club') advice = `<b>Best fit for your mood:</b> leave McDonald's, walk straight down to Praça do Comércio and try Riktus. Your selected route plans to finish about <strong>${plannedFinish()}</strong>.`;
    else if (mode) advice = `<b>Selected:</b> ${descriptions[mode]?.[0]||'Rossio route'}. Planned finish about <strong>${plannedFinish()}</strong>. Next planned 207: ${rNext?`Rossio ~${rNext}`:'none left'} / ${cNext?`Cais ${cNext}`:'none left'}.`;
    else advice = `<b>My recommendation:</b> choose <strong>Riktus first</strong> if you want White Hotel energy; choose <strong>Scenic 2h</strong> if you want streets/views first. Next planned 207 at Rossio is about <strong>${rNext||'finished'}</strong>.`;
    panel.querySelector('#liveRecommend').innerHTML = advice;
  }
  update();
  setInterval(update, 30000);

  if (params.get('now') === '1') {
    const st = document.querySelector('#startTime');
    const d = new Date();
    st.value = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    try { renderCurrent(); renderRoute(); renderHome(); } catch (_) {}
  }
})();
