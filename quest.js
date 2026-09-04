'use strict';
(async () => {
  const status = document.getElementById('mapStatus');
  try {
    const urls = window.__LQ_SOURCE_PARTS || [];
    if (!urls.length) throw new Error('Quest source list is missing.');
    const chunks = [];
    for (const url of urls) {
      const response = await fetch(url, {cache:'no-store'});
      if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
      chunks.push(await response.text());
    }
    const source = chunks.join('\n') + '\n//# sourceURL=lisbon-quest-v13.js';
    new Function(source)();
  } catch (error) {
    console.error(error);
    if (status) status.textContent = 'App update failed to load. Refresh once while online.';
    const toast = document.getElementById('toast');
    if (toast) { toast.textContent = error.message; toast.classList.add('show'); }
  }
})();
