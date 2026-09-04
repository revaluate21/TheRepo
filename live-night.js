'use strict';
(() => {
  const params = new URLSearchParams(location.search);
  const mode = params.get('route');

  const all = [...DATA.route, ...DATA.sidequests];
  const byId = new Map(all.map(item => [item.id, item]));

  const ministerium = {
    id: 'ministerium-stop',
    name: 'Ministerium Club · Riktus Industrial Night',
    short: 'Riktus @ Ministerium',
    lat: 38.7101156,
    lon: -9.1323115,
    category: 'nightlife',
    kind: 'club',
    icon: '🔊',
    color: '#7b61ff',
    status: 'LIVE NOW · 23:59–08:00 · 18+',
    adds: 'Praça do Comércio — almost zero detour',
    note: 'Riktus is running now at Ministerium: industrial techno and hardcore with Angel Karel, BLNK, LIEKS, DRKOO and Morgaz.',
    tip: 'Bring photo ID. Door entry is always subject to capacity. The entrance is under the eastern arcade of Praça do Comércio at number 72.',
    query: 'Ministerium Club, Praça do Comércio 72, 1100-148 Lisboa, Portugal',
    eventUrl: 'https://ra.co/events/2509556',
    dwell: 15,
    optional: null
  };

  const club60 = { ...ministerium, id: 'ministerium-60', short: 'Riktus · 60 min', name: 'Riktus @ Ministerium · 60-minute club stop', dwell: 60 };
  const club120 = { ...ministerium, id: 'ministerium-120', short: 'Riktus · 2 hours', name: 'Riktus @ Ministerium · two-hour club stop', dwell: 120 };

  const extras = {
    'santa-catarina': DATA.sidequests.find(x => x.id === 'santa-catarina'),
    'mural': DATA.sidequests.find(x => x.id === 'mural')
  };

  const makeRoute = ids => ids.map(id => {
    if (id === 'ministerium-stop') return ministerium;
    if (id === 'ministerium-60') return club60;
    if (id === 'ministerium-120') return club120;
    const found = byId.get(id) || extras[id];
    return found ? { ...found, optional: null, dwell: found.dwell ?? 8 } : null;
  }).filter(Boolean);

  const routes = {
    'rossio-club': {
      label: 'NOW · Riktus first · 2–3h',
      ids: ['rossio', 'praca', 'ministerium-120', 'ribeira', 'pink', 'cais']
    },
    'rossio-2h': {
      label: 'NOW · Scenic loop · ≈2h',
      ids: ['rossio', 'carmo', 'sao-pedro', 'santa-catarina', 'bica', 'pink', 'ribeira', 'praca', 'ministerium-stop', 'cais']
    },
    'rossio-3h': {
      label: 'NOW · Old city + club · ≈3h',
      ids: ['rossio', 'mural', 'se', 'santa-luzia', 'graca', 'praca', 'ministerium-60', 'ribeira', 'pink', 'cais']
    },
    'rossio-4h': {
      label: 'NOW · Full night + club · ≈4h',
      ids: ['rossio', 'carmo', 'sao-pedro', 'santa-catarina', 'bica', 'pink', 'ribeira', 'praca', 'ministerium-120', 'cais']
    }
  };

  DATA.liveNight = {
    title: 'Rossio after-dark · 4 Sep 2026',
    updated: '02:25 WEST',
    routeModes: routes,
    buses: {
      rossio207: ['02:36', '03:36', '04:36', '05:06', '05:41'],
      cais207: ['02:30', '03:30', '04:30', '05:00', '05:35'],
      cais206: ['02:30', '03:30', '04:30', '05:00', '05:35'],
      rossio736: ['05:30', '05:41', '05:51', '06:02', '06:12', '06:22', '06:32', '06:41', '06:49', '06:58'],
      campo2769: ['05:25', '05:45', '06:05', '06:25', '06:45', '07:10', '07:30']
    },
    stops: {
      rossio207: '00902 Rossio',
      cais207: '03807 Cais Sodré'
    }
  };

  if (!routes[mode]) return;

  DATA.route = makeRoute(routes[mode].ids);
  DATA.presets = { long: { label: routes[mode].label, opts: [] } };

  try {
    const previous = localStorage.getItem('lq-live-route');
    localStorage.setItem('lq-preset', JSON.stringify('long'));
    if (previous !== mode || params.get('fresh') === '1') {
      localStorage.setItem('lq-current', JSON.stringify(0));
      localStorage.setItem('lq-visited', JSON.stringify([]));
      localStorage.setItem('lq-live-route', mode);
    }
  } catch (_) {}
})();
