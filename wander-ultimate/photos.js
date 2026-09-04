'use strict';
window.PhotoHub = (() => {
  const CACHE_PREFIX = 'wander-photo-v1:';
  const MAX_AGE = 1000 * 60 * 60 * 24 * 21;
  const pending = new Map();
  const blockedWords = /\b(map|diagram|logo|flag|coat of arms|seal|plan|floor plan|icon|poster|ticket|route|locator|drawing|engraving)\b/i;

  const strip = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const keyFor = item => `${CACHE_PREFIX}${item.id || item.name}:${item.photoFile || item.photoQuery || item.coverQuery || item.name}`;
  const queryFor = item => item.photoQuery || item.coverQuery || `${item.name} ${item.city || ''} Portugal`;

  function readCache(item) {
    try {
      const raw = localStorage.getItem(keyFor(item));
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved.at || Date.now() - saved.at > MAX_AGE || !Array.isArray(saved.items)) return null;
      return saved.items;
    } catch (_) { return null; }
  }

  function writeCache(item, items) {
    try { localStorage.setItem(keyFor(item), JSON.stringify({ at: Date.now(), items })); } catch (_) {}
  }

  function normalise(page) {
    const info = page?.imageinfo?.[0];
    if (!info || !/^image\/(jpeg|png|webp)$/i.test(info.mime || '')) return null;
    if ((info.width || 0) < 640 || (info.height || 0) < 360) return null;
    if (blockedWords.test(page.title || '')) return null;
    const meta = info.extmetadata || {};
    return {
      src: info.thumburl || info.url,
      full: info.url,
      page: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
      title: String(page.title || '').replace(/^File:/, ''),
      artist: strip(meta.Artist?.value) || 'Wikimedia Commons contributor',
      licence: strip(meta.LicenseShortName?.value || meta.UsageTerms?.value) || 'See source',
      description: strip(meta.ImageDescription?.value)
    };
  }

  async function api(params) {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    Object.entries({ action:'query', format:'json', origin:'*', ...params }).forEach(([k,v]) => url.searchParams.set(k, v));
    const response = await fetch(url, { mode:'cors', cache:'force-cache' });
    if (!response.ok) throw new Error(`Commons ${response.status}`);
    return response.json();
  }

  async function exact(file) {
    const data = await api({
      prop:'imageinfo', titles:`File:${file}`,
      iiprop:'url|mime|size|extmetadata', iiurlwidth:'1280'
    });
    return Object.values(data?.query?.pages || {}).map(normalise).filter(Boolean);
  }

  async function search(query) {
    const data = await api({
      generator:'search', gsrsearch:query, gsrnamespace:'6', gsrlimit:'14',
      prop:'imageinfo', iiprop:'url|mime|size|extmetadata', iiurlwidth:'1280'
    });
    return Object.values(data?.query?.pages || {})
      .sort((a,b) => (a.index ?? 999) - (b.index ?? 999))
      .map(normalise).filter(Boolean);
  }

  async function resolveAll(item, force=false) {
    if (!force) {
      const cached = readCache(item);
      if (cached?.length) return cached;
    }
    const id = keyFor(item);
    if (pending.has(id)) return pending.get(id);
    const job = (async () => {
      let list = [];
      try { if (item.photoFile) list = await exact(item.photoFile); } catch (_) {}
      try {
        const searched = await search(queryFor(item));
        const seen = new Set(list.map(x => x.src));
        list.push(...searched.filter(x => !seen.has(x.src)));
      } catch (_) {}
      if (!list.length && item.name) {
        try { list = await search(`${item.name} Portugal`); } catch (_) {}
      }
      list = list.slice(0, 8);
      if (list.length) writeCache(item, list);
      pending.delete(id);
      return list;
    })();
    pending.set(id, job);
    return job;
  }

  function paintFallback(fallback, item) {
    if (!fallback) return;
    fallback.textContent = item.icon || ({VIEW:'🌅',RIVER:'🌊',EPIC:'🏰',QUIET:'🌿',FUTURE:'🌌'}[item.type] || '✨');
    const colours = item.colours || ['#4dc8ff','#7757ff','#ff3f91'];
    fallback.style.background = `linear-gradient(145deg,${colours.join(',')})`;
  }

  async function load(img, fallback, item, variant=0, force=false) {
    paintFallback(fallback, item);
    if (!img) return null;
    img.classList.remove('loaded');
    img.removeAttribute('src');
    const list = await resolveAll(item, force);
    if (!list.length) return null;
    let pointer = ((variant % list.length) + list.length) % list.length;
    return new Promise(resolve => {
      const attempt = () => {
        const candidate = list[pointer];
        img.onload = async () => {
          try { await img.decode?.(); } catch (_) {}
          img.classList.add('loaded');
          img.dataset.credit = JSON.stringify(candidate);
          resolve(candidate);
        };
        img.onerror = () => {
          pointer += 1;
          if (pointer < list.length) attempt();
          else { img.classList.remove('loaded'); resolve(null); }
        };
        img.alt = item.name || item.title || 'Portugal landmark';
        img.referrerPolicy = 'no-referrer';
        img.src = candidate.src;
      };
      attempt();
    });
  }

  async function alternate(img, fallback, item) {
    const list = await resolveAll(item);
    if (!list.length) return null;
    const current = (() => { try { return JSON.parse(img.dataset.credit || '{}').src; } catch (_) { return ''; } })();
    const currentIndex = Math.max(0, list.findIndex(x => x.src === current));
    return load(img, fallback, item, currentIndex + 1);
  }

  async function prefetch(items, progress=()=>{}) {
    const unique = [...new Map(items.map(x => [x.id || x.name, x])).values()];
    let done = 0;
    for (const item of unique) {
      try {
        const list = await resolveAll(item);
        if (list[0]?.src) {
          const response = await fetch(list[0].src, { mode:'no-cors', cache:'force-cache' });
          if ('caches' in window) {
            const cache = await caches.open('wander-photo-download-v1');
            await cache.put(list[0].src, response.clone());
          }
        }
      } catch (_) {}
      done += 1; progress(done, unique.length);
    }
    return { done, total: unique.length };
  }

  function creditFrom(img) {
    try { return JSON.parse(img?.dataset?.credit || 'null'); } catch (_) { return null; }
  }

  return { load, alternate, prefetch, resolveAll, creditFrom, paintFallback };
})();
