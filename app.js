'use strict';

(() => {
  const DATA = window.WANDER_DATA;
  if (!DATA) throw new Error('WANDER_DATA missing');

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const routeById = new Map(DATA.routes.map(r => [r.id, r]));
  const worldById = new Map(DATA.worlds.map(w => [w.id, w]));
  const photoById = DATA.photos;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(`wander3.${key}`); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(`wander3.${key}`, JSON.stringify(value)); } catch {} }
  };

  const state = {
    selectedWorld: null,
    selectedRoute: null,
    activeRoute: store.get('activeRoute', null),
    stopIndex: store.get('stopIndex', 0),
    completed: new Set(store.get('completed', [])),
    home: store.get('home', DATA.home),
    mood: store.get('mood', 'wow'),
    gps: null,
    previousGps: null,
    trackedM: store.get('trackedM', 0),
    watchId: null,
    arrivalHits: 0,
    arrived: false,
    voice: store.get('voice', true),
    haptics: store.get('haptics', true),
    wakeLock: null,
    wakePreferred: store.get('wakePreferred', false),
    joinChecked: false,
    weather: store.get('weather', {}),
    deferredInstall: null,
    imageFailures: new Set(),
    fiveDayRoutes: []
  };

  function saveProgress() {
    store.set('activeRoute', state.activeRoute);
    store.set('stopIndex', state.stopIndex);
    store.set('completed', [...state.completed]);
    store.set('home', state.home);
    store.set('mood', state.mood);
    store.set('trackedM', state.trackedM);
    store.set('voice', state.voice);
    store.set('haptics', state.haptics);
    store.set('wakePreferred', state.wakePreferred);
  }

  function now() {
    const d = new Date();
    const testHour = new URLSearchParams(location.search).get('testHour');
    if (testHour != null && Number.isFinite(Number(testHour))) d.setHours(Number(testHour), 0, 0, 0);
    return d;
  }

  function toast(message, ms = 2600) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function safeText(value) { return String(value ?? ''); }

  function commonsFallback(photo) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photo.commons)}?width=1280`;
  }

  function setPhoto(img, key, alt = '') {
    const p = photoById[key];
    img.alt = alt;
    img.classList.remove('image-fallback');
    img.style.opacity = '1';
    img.dataset.stage = 'local';
    if (!p) {
      img.removeAttribute('src');
      img.style.opacity = '0';
      img.classList.add('image-fallback');
      return;
    }
    img.src = p.file;
    img.onerror = () => {
      if (img.dataset.stage === 'local') {
        img.dataset.stage = 'commons';
        img.src = commonsFallback(p);
        return;
      }
      state.imageFailures.add(key);
      img.onerror = null;
      img.removeAttribute('src');
      img.style.opacity = '0';
      img.classList.add('image-fallback');
    };
  }

  function makePhoto(key, alt, className = '') {
    const img = document.createElement('img');
    if (className) img.className = className;
    img.loading = 'lazy';
    setPhoto(img, key, alt);
    return img;
  }

  function hav(a, b) {
    const R = 6371000;
    const rad = x => x * Math.PI / 180;
    const p1 = rad(a.lat), p2 = rad(b.lat);
    const dp = rad(b.lat - a.lat), dl = rad(b.lon - a.lon);
    const q = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  }

  function formatDistance(m) {
    if (!Number.isFinite(m)) return 'GPS OFF';
    if (m < 1000) return `${Math.max(0, Math.round(m / 10) * 10)} m`;
    return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
  }

  function weatherIcon(code) {
    if (code == null) return '◌';
    if (code === 0) return '☀';
    if ([1, 2].includes(code)) return '🌤';
    if (code === 3) return '☁';
    if ([45, 48].includes(code)) return '🌫';
    if ([51, 53, 55, 56, 57].includes(code)) return '🌦';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄';
    if ([95, 96, 99].includes(code)) return '⛈';
    return '◌';
  }

  function timeBucket(date = now(), weather = null) {
    const h = date.getHours() + date.getMinutes() / 60;
    let sunset = 20;
    let sunrise = 7;
    if (weather?.daily?.sunset?.[0]) sunset = new Date(weather.daily.sunset[0]).getHours() + new Date(weather.daily.sunset[0]).getMinutes() / 60;
    if (weather?.daily?.sunrise?.[0]) sunrise = new Date(weather.daily.sunrise[0]).getHours() + new Date(weather.daily.sunrise[0]).getMinutes() / 60;
    if (h < sunrise + 2) return 'morning';
    if (h >= sunset - 1.75 && h <= sunset + .65) return 'sunset';
    if (h > sunset + .65 || h < sunrise) return 'night';
    return 'day';
  }

  function routeStartDistance(route) {
    const origin = state.gps || state.home;
    return hav(origin, route.start);
  }

  function heatPenalty(route, apparent) {
    if (!Number.isFinite(apparent)) return 0;
    if (apparent < 29) return 0;
    const levels = { low: 0, medium: -1.5, high: -3.5, 'very-high': -6 };
    let score = levels[route.heat] ?? 0;
    if (route.coast) score += 2;
    if (route.forest) score += 2.5;
    if (apparent >= 35) score *= 1.5;
    return score;
  }

  function scoreRouteNow(route) {
    const worldWeather = state.weather[route.world];
    const bucket = timeBucket(now(), worldWeather);
    const current = worldWeather?.current || {};
    let score = route.wow * .58 + route.peace * .20;
    score += route.best.includes(bucket) ? 5 : -2;
    if (bucket === 'night' && !route.nightSafe) score -= 20;
    if (bucket === 'sunset' && route.coast) score += 3;
    if (bucket === 'night' && route.id === 'lisbon-future') score += 4;
    if (route.dayTrip && now().getHours() >= 13) score -= 8;
    if (route.dayTrip && now().getHours() < 10) score += 2;
    score += heatPenalty(route, current.apparent_temperature);
    const wind = current.wind_speed_10m;
    if (route.coast && wind >= 7 && wind <= 28) score += 1.5;
    if (route.coast && wind > 38) score -= 5;
    const precip = current.precipitation;
    if (precip > .2 || [61,63,65,80,81,82,95,96,99].includes(current.weather_code)) score -= route.forest ? 4 : 2.5;
    const d = routeStartDistance(route) / 1000;
    if (d < 5) score += 4;
    else if (d < 20) score += 2;
    else if (d < 55) score += .5;
    else if (d > 120) score -= 2;
    if (route.distanceKm >= 14) score += .8;
    return score;
  }

  function scoreRouteForDay(route, dayIndex) {
    const w = state.weather[route.world];
    const max = w?.daily?.temperature_2m_max?.[dayIndex];
    const rain = w?.daily?.precipitation_probability_max?.[dayIndex] ?? 0;
    let score = route.wow * .65 + route.peace * .22 + (route.dayTrip ? 1.5 : 0);
    score += heatPenalty(route, max);
    if (rain > 45) score -= route.coast ? 4 : 2.5;
    if (route.forest && rain <= 35) score += 1.5;
    if (route.coast && max >= 29) score += 2;
    if (route.heat === 'very-high' && max >= 31) score -= 5;
    return score;
  }

  async function fetchWeatherForWorld(world) {
    const cache = state.weather[world.id];
    const age = cache?.fetchedAt ? Date.now() - cache.fetchedAt : Infinity;
    if (age < 20 * 60 * 1000) return cache;
    const [lat, lon] = world.center;
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation');
    url.searchParams.set('daily', 'sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Weather ${res.status}`);
      const json = await res.json();
      json.fetchedAt = Date.now();
      state.weather[world.id] = json;
      store.set('weather', state.weather);
      return json;
    } catch {
      return cache || null;
    }
  }

  async function refreshWeather() {
    await Promise.allSettled(DATA.worlds.map(fetchWeatherForWorld));
    renderHome();
    if (state.selectedRoute) renderRouteView(state.selectedRoute);
  }

  function routeWeatherLabel(route, dayIndex = 0) {
    const w = state.weather[route.world];
    if (!w) return 'time-aware';
    if (dayIndex === 0) {
      const c = w.current;
      return `${weatherIcon(c.weather_code)} ${Math.round(c.temperature_2m)}° · feels ${Math.round(c.apparent_temperature)}°`;
    }
    return `${weatherIcon(w.daily?.weather_code?.[dayIndex])} ${Math.round(w.daily?.temperature_2m_max?.[dayIndex] ?? 0)}°`;
  }

  function routeTimeLabel(route) {
    const b = timeBucket(now(), state.weather[route.world]);
    if (b === 'night' && !route.nightSafe) return 'DAY ONLY';
    if (route.best.includes(b)) return b.toUpperCase();
    return route.best[0].toUpperCase();
  }

  function makeCard(route, kind = 'route', day = null) {
    const btn = document.createElement('button');
    btn.className = kind === 'day' ? 'day-card' : 'route-card';
    btn.type = 'button';
    const img = makePhoto(route.photo, route.name);
    btn.appendChild(img);
    btn.insertAdjacentHTML('beforeend', '<div class="card-shade"></div>');
    if (day) btn.insertAdjacentHTML('beforeend', `<span class="weather-badge">${safeText(day.weather)}</span>`);
    if (kind !== 'day') btn.insertAdjacentHTML('beforeend', `<span class="route-badge">${safeText(routeTimeLabel(route))}</span>`);
    const copy = document.createElement('div');
    copy.className = 'card-copy';
    copy.innerHTML = `${day ? `<span class="date-badge">${safeText(day.label)}</span>` : ''}<h3>${safeText(route.name)}</h3><p>${safeText(route.duration)} · ${safeText(route.steps)}</p><p>${safeText(route.vibe)}</p>`;
    btn.appendChild(copy);
    btn.addEventListener('click', () => openRoute(route.id));
    return btn;
  }

  function renderBestNow() {
    const route = [...DATA.routes].sort((a, b) => scoreRouteNow(b) - scoreRouteNow(a))[0];
    if (!route) return;
    const world = worldById.get(route.world);
    setPhoto($('#bestNowImage'), route.photo, route.name);
    $('#bestNowBadge').textContent = `${weatherIcon(state.weather[route.world]?.current?.weather_code)} BEST NOW`;
    $('#bestNowTitle').textContent = `${world.name} · ${route.name}`;
    $('#bestNowMeta').textContent = `${route.duration} · ${route.steps} · ${routeWeatherLabel(route)}`;
    $('#bestNowGo').onclick = () => openRoute(route.id);
  }

  function buildFiveDayPlan() {
    const usedRoutes = new Set();
    const usedWorlds = new Map();
    const plan = [];
    for (let day = 0; day < 5; day++) {
      const candidates = DATA.routes.map(route => {
        let score = day === 0 ? scoreRouteNow(route) : scoreRouteForDay(route, day);
        if (usedRoutes.has(route.id)) score -= 20;
        score -= (usedWorlds.get(route.world) || 0) * 4;
        if (day > 0 && !route.dayTrip && route.world === 'lisbon') score -= 1;
        return { route, score };
      }).sort((a, b) => b.score - a.score);
      const chosen = candidates[0].route;
      usedRoutes.add(chosen.id);
      usedWorlds.set(chosen.world, (usedWorlds.get(chosen.world) || 0) + 1);
      const d = new Date(now()); d.setDate(d.getDate() + day);
      const label = day === 0 ? 'TODAY' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }).toUpperCase();
      plan.push({ route: chosen, label, weather: routeWeatherLabel(chosen, day) });
    }
    state.fiveDayRoutes = plan;
    return plan;
  }

  function renderHome() {
    const d = now();
    $('#nowClock').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const lis = state.weather.lisbon?.current;
    const bucket = timeBucket(d, state.weather.lisbon);
    $('#weatherText').textContent = lis ? `${weatherIcon(lis.weather_code)} ${Math.round(lis.temperature_2m)}° · ${bucket}` : bucket;
    renderBestNow();

    const five = $('#fiveDayRow'); five.innerHTML = '';
    buildFiveDayPlan().forEach(item => five.appendChild(makeCard(item.route, 'day', item)));
    renderMoodRoutes();

    const worlds = $('#worldGrid'); worlds.innerHTML = '';
    DATA.worlds.forEach(world => {
      const btn = document.createElement('button'); btn.className = 'world-card'; btn.type = 'button';
      btn.appendChild(makePhoto(world.photo, world.name));
      btn.insertAdjacentHTML('beforeend', '<div class="card-shade"></div>');
      const count = DATA.routes.filter(r => r.world === world.id).length;
      btn.insertAdjacentHTML('beforeend', `<div class="card-copy"><span class="date-badge">${count} WALK${count === 1 ? '' : 'S'}</span><h3>${safeText(world.name)}</h3><p>${safeText(world.subtitle)}</p></div>`);
      btn.addEventListener('click', () => openWorld(world.id));
      worlds.appendChild(btn);
    });
  }

  function renderMoodRoutes() {
    const box = $('#moodRoutes'); box.innerHTML = '';
    let routes = [...DATA.routes];
    if (state.mood === 'peace') routes.sort((a, b) => b.peace - a.peace);
    else if (state.mood === 'night') routes = routes.filter(r => r.nightSafe).sort((a, b) => scoreRouteNow(b) - scoreRouteNow(a));
    else if (state.mood === 'coast') routes = routes.filter(r => r.coast).sort((a, b) => b.wow - a.wow);
    else if (state.mood === 'long') routes.sort((a, b) => b.distanceKm - a.distanceKm);
    else routes.sort((a, b) => b.wow - a.wow);
    routes.slice(0, 6).forEach(r => box.appendChild(makeCard(r)));
    $$('#moodRow button').forEach(b => b.classList.toggle('active', b.dataset.mood === state.mood));
  }

  function openWorld(id) {
    const world = worldById.get(id); if (!world) return;
    state.selectedWorld = world;
    setPhoto($('#worldHeroImage'), world.photo, world.name);
    $('#worldKicker').textContent = `${DATA.routes.filter(r => r.world === id).length} WALKS`;
    $('#worldTitle').textContent = world.name;
    $('#worldSubtitle').textContent = world.subtitle;
    const box = $('#worldRoutes'); box.innerHTML = '';
    DATA.routes.filter(r => r.world === id).forEach(r => box.appendChild(makeCard(r)));
    location.hash = `world/${id}`;
    showView('worldView');
  }

  function routeConditionMessage(route) {
    const w = state.weather[route.world];
    const current = w?.current;
    const bucket = timeBucket(now(), w);
    if (bucket === 'night' && !route.nightSafe) return `Not tonight. Save this for daylight.`;
    if (current?.apparent_temperature >= 32 && ['high','very-high'].includes(route.heat)) return `Hot now. Start early, or choose coast / forest / night.`;
    if (current?.wind_speed_10m > 38 && route.coast) return `Very windy for cliffs/coast. Choose a city or forest route.`;
    if (current?.precipitation > .2) return `Wet now. Stone, walls and cliff routes need extra care.`;
    if (route.best.includes(bucket)) return `Good timing now · ${routeWeatherLabel(route)}`;
    return `Best ${route.best.join(' / ')} · ${routeWeatherLabel(route)}`;
  }

  function transitLink(destination, origin = null) {
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api', '1');
    if (origin) u.searchParams.set('origin', `${origin.lat},${origin.lon}`);
    u.searchParams.set('destination', `${destination.lat},${destination.lon}`);
    u.searchParams.set('travelmode', 'transit');
    return u.toString();
  }

  function navLink(stop) {
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api', '1');
    u.searchParams.set('destination', `${stop.lat},${stop.lon}`);
    u.searchParams.set('travelmode', stop.mode === 'transit' ? 'transit' : 'walking');
    u.searchParams.set('dir_action', 'navigate');
    return u.toString();
  }

  function openRoute(id) {
    const route = routeById.get(id); if (!route) return;
    state.selectedRoute = route;
    renderRouteView(route);
    location.hash = `route/${id}`;
    showView('routeView');
  }

  function renderRouteView(route) {
    const world = worldById.get(route.world);
    setPhoto($('#routeHeroImage'), route.photo, route.name);
    $('#routeWorld').textContent = world.name.toUpperCase();
    $('#routeTitle').textContent = route.name;
    $('#routeVibe').textContent = route.subtitle;
    $('#routeStats').innerHTML = `<span class="stat">${route.duration}</span><span class="stat">${route.steps}</span><span class="stat">${route.distanceKm} km</span><span class="stat">${route.terrain}</span>`;
    $('#routeWeatherCallout').textContent = routeConditionMessage(route);
    $('#routeWarnings').innerHTML = `<b>${safeText(route.transport)}</b><br>${safeText(route.warning)}${route.official ? ` <a href="${route.official}" target="_blank" rel="noopener">Check official status</a>` : ''}`;
    $('#stopCountTitle').textContent = `${route.stops.length} visual checkpoints`;
    const box = $('#stopPreview'); box.innerHTML = '';
    route.stops.forEach((s, i) => {
      const card = document.createElement('article'); card.className = 'preview-card';
      card.appendChild(makePhoto(s.photo || route.photo, s.name));
      card.insertAdjacentHTML('beforeend', '<div class="card-shade"></div>');
      card.insertAdjacentHTML('beforeend', `<div class="preview-copy"><b>${i + 1}. ${safeText(s.name)}</b><span>${safeText(s.cue)}</span></div>`);
      box.appendChild(card);
    });
    const origin = state.gps || state.home;
    const getThere = transitLink(route.start, origin);
    $('#getThereBtn').href = getThere;
    $('#returnCheckBtn').href = transitLink(state.home, route.finish);
    $('#startRouteBtn').onclick = () => startRoute(route.id);
    $('#startRouteBtn2').onclick = () => startRoute(route.id);
  }

  function startRoute(id) {
    const route = routeById.get(id); if (!route) return;
    state.activeRoute = id;
    state.stopIndex = 0;
    state.completed.clear();
    state.trackedM = 0;
    state.arrived = false;
    state.joinChecked = false;
    saveProgress();
    renderWalk();
    location.hash = 'walk';
    showView('walkView');
    startGps();
    if (state.wakePreferred) acquireWakeLock();
    speak(`Ready. First stop: ${route.stops[0].name}. Tap start turn by turn, then put your phone away.`);
  }

  function activeRoute() { return state.activeRoute ? routeById.get(state.activeRoute) : null; }
  function activeStop() {
    const route = activeRoute();
    if (!route) return null;
    state.stopIndex = Math.max(0, Math.min(state.stopIndex, route.stops.length - 1));
    return route.stops[state.stopIndex];
  }

  function renderWalk() {
    const route = activeRoute();
    if (!route) {
      $('#walkRouteName').textContent = 'No active walk';
      $('#navName').textContent = 'Choose a route first';
      $('#launchMapsBtn').disabled = true;
      return;
    }
    const stop = activeStop();
    $('#walkRouteName').textContent = route.name;
    $('#walkProgress').textContent = `${state.stopIndex + 1} / ${route.stops.length}`;
    setPhoto($('#navPhoto'), stop.photo || route.photo, stop.name);
    $('#navName').textContent = stop.name;
    $('#navCue').textContent = stop.cue;
    const distance = state.gps ? hav(state.gps, stop) : NaN;
    $('#navDistance').textContent = formatDistance(distance);
    $('#navStatus').textContent = state.arrived ? 'YOU’RE HERE' : 'NEXT';
    $('#navStatus').classList.toggle('arrived', state.arrived);
    $('#launchMapsBtn').disabled = false;
    $('#reachedBtn').textContent = state.stopIndex === route.stops.length - 1 ? 'FINISH ✓' : `I'M HERE ✓`;
    $('#comingUp').innerHTML = '';
    route.stops.slice(state.stopIndex + 1, state.stopIndex + 4).forEach((s, i) => {
      const card = document.createElement('article'); card.className = 'coming-card';
      card.appendChild(makePhoto(s.photo || route.photo, s.name));
      card.insertAdjacentHTML('beforeend', `<div><b>${state.stopIndex + i + 2}. ${safeText(s.name)}</b><span>${safeText(s.cue)}</span></div>`);
      $('#comingUp').appendChild(card);
    });
    renderRouteSvg();
    updateControlStates();
    updateHomeRescue();
  }

  function completeStop() {
    const route = activeRoute(); if (!route) return;
    const stop = activeStop();
    state.completed.add(stop.id);
    state.arrived = false;
    state.arrivalHits = 0;
    if (state.haptics) navigator.vibrate?.([70, 45, 70]);
    if (state.stopIndex >= route.stops.length - 1) {
      speak(`Route complete. ${route.name}. You did it.`);
      toast('Route complete ✓', 3500);
    } else {
      state.stopIndex += 1;
      const next = activeStop();
      speak(`Checkpoint complete. Next: ${next.name}.`);
      toast(`Next: ${next.name}`);
    }
    saveProgress();
    renderWalk();
  }

  function skipStop() {
    const route = activeRoute(); if (!route) return;
    if (state.stopIndex < route.stops.length - 1) {
      state.stopIndex += 1; state.arrived = false; state.arrivalHits = 0; saveProgress(); renderWalk();
      toast(`Skipped → ${activeStop().name}`);
    }
  }

  function speak(text) {
    if (!state.voice || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = .96; u.pitch = 1; u.volume = 1;
    speechSynthesis.speak(u);
  }

  function launchMaps() {
    const stop = activeStop(); if (!stop) return;
    speak(`Google Maps will guide you to ${stop.name}.`);
    store.set('lastLaunch', Date.now());
    location.href = navLink(stop);
  }

  function startGps() {
    if (!navigator.geolocation) return toast('GPS is not available in this browser.');
    if (state.watchId != null) return;
    state.watchId = navigator.geolocation.watchPosition(onPosition, onGpsError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
    $('#gpsBtn').classList.add('active');
  }

  function stopGps() {
    if (state.watchId != null) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
    $('#gpsBtn').classList.remove('active');
  }

  function onPosition(pos) {
    const next = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy, ts: pos.timestamp };
    if (state.previousGps) {
      const d = hav(state.previousGps, next);
      const dt = Math.max(1, (next.ts - state.previousGps.ts) / 1000);
      if (d >= 2 && d <= Math.max(80, dt * 7) && next.acc < 80 && state.previousGps.acc < 80) state.trackedM += d;
    }
    state.previousGps = next;
    state.gps = next;

    const route = activeRoute();
    if (route && !state.joinChecked && next.acc <= 100) {
      state.joinChecked = true;
      const distances = route.stops.map((s, i) => ({ i, d: hav(next, s) })).sort((a, b) => a.d - b.d);
      const nearest = distances[0];
      const currentDistance = hav(next, route.stops[state.stopIndex]);
      if (nearest && nearest.i > state.stopIndex && nearest.d <= 180 && currentDistance >= 550) {
        state.stopIndex = nearest.i;
        state.arrivalHits = 0;
        state.arrived = nearest.d <= Math.max(55, Math.min(90, 45 + next.acc * .45));
        toast(`Joined at ${route.stops[nearest.i].name}`);
        speak(`Route joined at ${route.stops[nearest.i].name}.`);
      }
    }

    const stop = activeStop();
    if (stop) {
      const d = hav(next, stop);
      const threshold = Math.max(55, Math.min(90, 45 + next.acc * .45));
      const highConfidenceArrival = next.acc <= 30 && d <= Math.max(24, next.acc * 1.25);
      if (d <= threshold && next.acc <= 100) state.arrivalHits += 1; else state.arrivalHits = 0;
      if ((highConfidenceArrival || state.arrivalHits >= 2) && !state.arrived) {
        state.arrived = true;
        if (state.haptics) navigator.vibrate?.([160, 70, 80]);
        speak(`You are at ${stop.name}.`);
        toast(`Arrived: ${stop.name}`, 3600);
      }
    }
    saveProgress();
    renderWalk();
  }

  function onGpsError(error) {
    const messages = { 1: 'Location denied. Chrome → Site settings → Location → Allow.', 2: 'GPS unavailable. Move outdoors and retry.', 3: 'GPS timed out. Retry outdoors.' };
    toast(messages[error.code] || 'GPS error.');
    stopGps();
  }

  async function acquireWakeLock() {
    if (!state.wakePreferred || document.hidden || state.wakeLock) return;
    if (!('wakeLock' in navigator)) {
      state.wakePreferred = false;
      saveProgress();
      return toast('Screen wake lock is unavailable here.');
    }
    try {
      state.wakeLock = await navigator.wakeLock.request('screen');
      state.wakeLock.addEventListener('release', () => {
        state.wakeLock = null;
        updateControlStates();
      });
      updateControlStates();
    } catch {
      state.wakeLock = null;
      toast('Could not keep the screen awake.');
      updateControlStates();
    }
  }

  async function toggleWakeLock() {
    state.wakePreferred = !state.wakePreferred;
    saveProgress();
    if (!state.wakePreferred) {
      if (state.wakeLock) await state.wakeLock.release().catch(() => {});
      state.wakeLock = null;
      toast('Screen may sleep normally.');
      updateControlStates();
      return;
    }
    await acquireWakeLock();
    if (state.wakeLock) toast('Screen will stay awake while this view is open.');
  }

  function updateControlStates() {
    $('#voiceBtn').classList.toggle('active', state.voice);
    $('#vibrateBtn').classList.toggle('active', state.haptics);
    $('#gpsBtn').classList.toggle('active', state.watchId != null);
    $('#wakeBtn').classList.toggle('active', state.wakePreferred);
  }

  function updateHomeRescue() {
    const d = now();
    let text = 'Live public transport from your current position.';
    if (d.getHours() < 6) text = 'Night service may be sparse. Check live transit before you leave the route.';
    else if (d.getHours() >= 23) text = 'Check the final connection before continuing.';
    $('#homeRescueText').textContent = text;
    const u = new URL('https://www.google.com/maps/dir/');
    u.searchParams.set('api', '1');
    u.searchParams.set('destination', `${state.home.lat},${state.home.lon}`);
    u.searchParams.set('travelmode', 'transit');
    $('#goHomeBtn').href = u.toString();
  }

  function renderRouteSvg() {
    const route = activeRoute(); if (!route) return;
    const svg = $('#routeSvg');
    const pts = route.stops;
    const lats = pts.map(p => p.lat), lons = pts.map(p => p.lon);
    if (state.gps) { lats.push(state.gps.lat); lons.push(state.gps.lon); }
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const padX = 80, padY = 70;
    const project = p => {
      const x = padX + ((p.lon - minLon) / Math.max(.00001, maxLon - minLon)) * (1000 - padX * 2);
      const y = padY + (1 - (p.lat - minLat) / Math.max(.00001, maxLat - minLat)) * (620 - padY * 2);
      return [x, y];
    };
    const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${project(p)[0].toFixed(1)} ${project(p)[1].toFixed(1)}`).join(' ');
    let html = `<defs><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity=".2"/></filter></defs>`;
    html += `<path d="${path}" fill="none" stroke="#18213a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" opacity=".80"/>`;
    html += `<path d="${path}" fill="none" stroke="#ff5c7a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => {
      const [x, y] = project(p); const done = i < state.stopIndex || state.completed.has(p.id); const current = i === state.stopIndex;
      const fill = current ? '#ffba3a' : done ? '#52d7ad' : '#fff';
      const r = current ? 24 : 18;
      html += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#18213a" stroke-width="8" filter="url(#shadow)"/>`;
      if (current) html += `<circle cx="${x}" cy="${y}" r="38" fill="none" stroke="#ffba3a" stroke-width="7" opacity=".45"/>`;
    });
    if (state.gps) {
      const [x, y] = project(state.gps);
      html += `<circle cx="${x}" cy="${y}" r="18" fill="#67d7ff" stroke="#fff" stroke-width="8" filter="url(#shadow)"/><circle cx="${x}" cy="${y}" r="32" fill="none" stroke="#67d7ff" stroke-width="6" opacity=".35"/>`;
    }
    svg.innerHTML = html;
  }

  function openPhotoModal(key, title) {
    const p = photoById[key]; if (!p) return;
    setPhoto($('#modalPhoto'), key, title);
    $('#modalTitle').textContent = title;
    $('#modalCredit').textContent = `${p.author} · ${p.license}`;
    $('#modalSource').href = p.source;
    $('#photoModal').classList.add('open');
  }

  function closeModal() { $('#photoModal').classList.remove('open'); }

  function showView(id) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
    $('#backBtn').classList.toggle('hidden', id === 'homeView');
    $('#bottomNav').classList.toggle('hidden', id === 'routeView');
    window.scrollTo({ top: 0, behavior: 'auto' });
    updateBottomNav(id);
  }

  function updateBottomNav(viewId) {
    $$('#bottomNav button').forEach(b => b.classList.remove('active'));
    const target = viewId === 'walkView' ? 'active' : viewId === 'homeView' ? 'home' : 'worlds';
    $(`#bottomNav button[data-target="${target}"]`)?.classList.add('active');
  }

  function handleHash() {
    const raw = location.hash.replace(/^#/, '') || 'home';
    const [type, id] = raw.split('/');
    if (type === 'world' && worldById.has(id)) return openWorldNoHash(id);
    if (type === 'route' && routeById.has(id)) return openRouteNoHash(id);
    if (type === 'walk' && activeRoute()) { renderWalk(); return showView('walkView'); }
    showView('homeView');
  }

  function openWorldNoHash(id) {
    const old = location.hash;
    openWorld(id);
    if (location.hash !== old) history.replaceState(null, '', `#world/${id}`);
  }

  function openRouteNoHash(id) {
    const old = location.hash;
    openRoute(id);
    if (location.hash !== old) history.replaceState(null, '', `#route/${id}`);
  }

  function goBack() {
    if ($('#walkView').classList.contains('active')) { location.hash = state.activeRoute ? `route/${state.activeRoute}` : 'home'; return; }
    if ($('#routeView').classList.contains('active')) { location.hash = state.selectedRoute ? `world/${state.selectedRoute.world}` : 'home'; return; }
    location.hash = 'home';
  }

  function requestNearMe() {
    if (!navigator.geolocation) return toast('GPS unavailable.');
    navigator.geolocation.getCurrentPosition(pos => {
      state.gps = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy, ts: pos.timestamp };
      toast(`Location ready · ±${Math.round(pos.coords.accuracy)} m`);
      renderHome();
    }, onGpsError, { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 });
  }

  function bind() {
    $('#homeBtn').addEventListener('click', () => { location.hash = 'home'; });
    $('#backBtn').addEventListener('click', goBack);
    $('#nearMeBtn').addEventListener('click', requestNearMe);
    $('#launchMapsBtn').addEventListener('click', launchMaps);
    $('#reachedBtn').addEventListener('click', completeStop);
    $('#skipStopBtn').addEventListener('click', skipStop);
    $('#toggleMapBtn').addEventListener('click', () => {
      $('#mapBody').classList.toggle('collapsed');
      $('#mapChevron').textContent = $('#mapBody').classList.contains('collapsed') ? '⌄' : '⌃';
    });
    $('#voiceBtn').addEventListener('click', () => { state.voice = !state.voice; saveProgress(); updateControlStates(); if (state.voice) speak('Voice cues on.'); });
    $('#vibrateBtn').addEventListener('click', () => { state.haptics = !state.haptics; saveProgress(); updateControlStates(); if (state.haptics) navigator.vibrate?.(80); });
    $('#gpsBtn').addEventListener('click', () => state.watchId == null ? startGps() : stopGps());
    $('#wakeBtn').addEventListener('click', toggleWakeLock);
    $('#photoInfoBtn').addEventListener('click', () => { const r = activeRoute(), s = activeStop(); if (r && s) openPhotoModal(s.photo || r.photo, s.name); });
    $('#closeModal').addEventListener('click', closeModal);
    $('#photoModal').addEventListener('click', e => { if (e.target === $('#photoModal')) closeModal(); });
    $$('#moodRow button').forEach(b => b.addEventListener('click', () => { state.mood = b.dataset.mood; saveProgress(); renderMoodRoutes(); }));
    $$('#bottomNav button').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.target;
      if (t === 'active') { if (activeRoute()) location.hash = 'walk'; else toast('Choose a walk first.'); }
      else if (t === 'best') { location.hash = 'home'; setTimeout(() => $('#bestNow').scrollIntoView({ behavior: 'smooth' }), 20); }
      else if (t === 'worlds') { location.hash = 'home'; setTimeout(() => $('#worldGrid').scrollIntoView({ behavior: 'smooth' }), 20); }
      else location.hash = 'home';
    }));
    window.addEventListener('hashchange', handleHash);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && activeRoute() && navigator.geolocation) navigator.geolocation.getCurrentPosition(onPosition, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 });
      if (!document.hidden && state.wakePreferred) acquireWakeLock();
    });
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.deferredInstall = e; $('#installBtn').classList.remove('hidden'); });
    $('#installBtn').addEventListener('click', async () => {
      if (!state.deferredInstall) return;
      state.deferredInstall.prompt(); await state.deferredInstall.userChoice; state.deferredInstall = null; $('#installBtn').classList.add('hidden');
    });
    $('#shareBtn').addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'Wander Portugal', text: 'Photo-first walking worlds around Portugal.', url: location.origin + location.pathname });
        else { await navigator.clipboard.writeText(location.origin + location.pathname); toast('Link copied.'); }
      } catch {}
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js?v=30').then(reg => {
      reg.update().catch(() => {});
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!sessionStorage.getItem('wander3.reloaded')) { sessionStorage.setItem('wander3.reloaded', '1'); location.reload(); }
    });
  }

  function init() {
    bind();
    renderHome();
    renderWalk();
    handleHash();
    refreshWeather();
    setInterval(() => { renderHome(); updateHomeRescue(); }, 60000);
    registerServiceWorker();
    updateControlStates();
  }

  init();
})();
