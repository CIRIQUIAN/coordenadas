'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const form = $('form'), code = $('code'), start = $('start'), stop = $('stop');
  const status = $('status'), detail = $('detail'), wake = $('wake'), retry = $('retry-wake');
  const panel = document.querySelector('.status');
  let session = null, sentinel = null, wakePending = false;

  function show(state, title, message) {
    panel.dataset.state = state;
    status.textContent = title;
    detail.textContent = message;
  }

  // Sort object keys so formatting or key order alone is not a change in data.
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value !== null && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  async function acquireWake() {
    if (!session || document.visibilityState !== 'visible' || sentinel || wakePending) return;
    if (!('wakeLock' in navigator) || !window.isSecureContext) {
      wake.textContent = 'Pantalla: bloqueo automático no disponible en este navegador';
      return;
    }
    const owner = session;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (session !== owner || document.visibilityState !== 'visible') {
        await lock.release();
        return;
      }
      sentinel = lock;
      wake.textContent = 'Pantalla encendida';
      retry.hidden = true;
      lock.addEventListener('release', () => {
        if (sentinel !== lock) return;
        sentinel = null;
        wake.textContent = session ? 'Pantalla: protección interrumpida' : 'Pantalla: protección desactivada';
        retry.hidden = !session;
      });
    } catch {
      if (session === owner) {
        wake.textContent = 'Pantalla: no se ha podido mantener encendida';
        retry.hidden = false;
      }
    } finally {
      wakePending = false;
      if (session && session !== owner) void acquireWake();
    }
  }

  function deactivate() {
    const old = session;
    session = null;
    if (old) {
      clearInterval(old.timer);
      old.controller?.abort();
      old.baseline = undefined;
    }
    const lock = sentinel;
    sentinel = null;
    if (lock) void lock.release().catch(() => {});
    code.disabled = false;
    start.hidden = false;
    stop.hidden = true;
    retry.hidden = true;
    wake.textContent = 'Pantalla: protección desactivada';
  }

  async function poll(owner) {
    if (session !== owner || owner.busy || document.visibilityState !== 'visible') return;
    owner.busy = true;
    const controller = new AbortController();
    owner.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const url = new URL('https://appmaz.vip/api/getdata.php');
      url.searchParams.set('user', owner.code);
      const response = await fetch(url, {
        method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: controller.signal
      });
      if (!response.ok) throw new Error('http');
      const body = await response.json();
      if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(body, 'data')) {
        throw new Error('format');
      }
      if (session !== owner) return;
      const current = canonical(body.data);
      if (!owner.hasBaseline) {
        owner.baseline = current;
        owner.hasBaseline = true;
      } else if (current !== owner.baseline) {
        const query = typeof body.data === 'string' ? body.data : canonical(body.data);
        const destination = new URL('https://www.google.com/search');
        destination.searchParams.set('q', query);
        deactivate();
        show('active', 'Cambio detectado', 'Abriendo Google…');
        window.location.replace(destination.href);
        return;
      }
      show('active', 'Vigilancia activa', 'Conectada. Esperando un cambio.');
    } catch (error) {
      if (session !== owner) return;
      show('error', 'Reintentando conexión', error.message === 'format'
        ? 'La respuesta no tiene el formato esperado. Se reintentará automáticamente.'
        : 'No se puede leer el servicio. Comprueba la conexión y el código. Se reintentará automáticamente.');
    } finally {
      clearTimeout(timeout);
      owner.busy = false;
      if (owner.controller === controller) owner.controller = null;
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (session) return;
    // Preserve letter case: the API may treat user codes as case-sensitive.
    const value = code.value.trim();
    if (!/^[a-zA-Z]{3}$/.test(value)) {
      code.setCustomValidity('Introduce exactamente 3 letras (A–Z).');
      code.reportValidity();
      return;
    }
    code.setCustomValidity('');
    const owner = { code: value, hasBaseline: false, baseline: undefined, busy: false, controller: null, timer: null };
    session = owner;
    code.disabled = true;
    start.hidden = true;
    stop.hidden = false;
    show('pending', 'Activando vigilancia', 'Esperando la primera lectura para empezar.');
    void acquireWake();
    void poll(owner);
    // One attempt each second; never overlap slow requests.
    owner.timer = setInterval(() => void poll(owner), 1000);
  });
  code.addEventListener('input', () => code.setCustomValidity(''));
  stop.addEventListener('click', () => {
    deactivate();
    show('idle', 'Vigilancia detenida', 'Puedes cambiar el código y volver a activar.');
    code.focus();
  });
  retry.addEventListener('click', () => void acquireWake());
  document.addEventListener('visibilitychange', () => {
    if (!session) return;
    if (document.visibilityState === 'visible') {
      void acquireWake();
      void poll(session);
    } else {
      show('pending', 'Página en segundo plano', 'Vuelve a esta página para continuar la vigilancia.');
    }
  });
  window.addEventListener('online', () => { if (session) void poll(session); });
  window.addEventListener('pagehide', () => {
    deactivate();
    show('idle', 'Sin activar', 'Pulsa Activar para comenzar una nueva vigilancia.');
  });
})();
