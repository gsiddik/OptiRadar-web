// What the screens need to handle a failure that is not an answer of the server: a part of the app that could not be
// loaded (an old tab after a new version was published), or a bug that threw while a screen was drawn.

// How the browsers word a failed dynamic import: Chrome and Edge, Firefox, Safari, Vite's own style preload, and the
// wording of webpack style loaders that some native shells report.
const CHUNK_MESSAGES = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to load module script/i,
  /Unable to preload CSS/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
];

export const isChunkLoadError = (error) => {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = typeof error === 'string' ? error : String(error.message || '');
  return CHUNK_MESSAGES.some((pattern) => pattern.test(message));
};

// stale: the app is running from an older build than the server has; offline: the part cannot be loaded because the
// device has no connection (a reload may not help until it is back); error: a bug, nothing the user did wrong.
export const classifyRuntimeError = (error, online = true) => {
  if (isChunkLoadError(error)) {
    return online ? 'stale' : 'offline';
  }
  return 'error';
};

const randomHex = (length) => {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  if (globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
    .toUpperCase();
};

// The reference shown to the person for a failure of the screen itself. A failure that carries the correlation id of the
// server keeps it, so support finds one id in the server log.
export const referenceOf = (error) =>
  (error && typeof error.correlationId === 'string' && error.correlationId) || `UI-${randomHex(8)}`;

const RELOAD_KEY = 'staleReloadAt';
export const RELOAD_WINDOW_MS = 5 * 60 * 1000;

// The app reloads itself once, at most once in a few minutes, when it finds out it is stale: a second failure right
// after a reload is a real fault (the server does not have the file), and a loop would hide it.
export const mayReloadAutomatically = (storage, now = Date.now()) => {
  try {
    const last = Number.parseInt(storage.getItem(RELOAD_KEY) || '', 10);
    if (Number.isFinite(last) && now - last >= 0 && now - last < RELOAD_WINDOW_MS) {
      return false;
    }
    storage.setItem(RELOAD_KEY, String(now));
    return true;
  } catch {
    // without storage the guard cannot remember, so the app does not reload by itself
    return false;
  }
};

// Reload to the newest build. A service worker of the old build keeps serving the old files (and the old page) until all
// tabs are closed, so a plain reload would load the same stale app: when online, drop the worker and its caches first;
// the new page registers a fresh worker. Offline the cached app is all there is, so only reload.
export const reloadToLatest = async ({
  online = true,
  serviceWorker = globalThis.navigator && globalThis.navigator.serviceWorker,
  caches = globalThis.caches,
  reload = () => globalThis.location.reload(),
} = {}) => {
  if (online) {
    try {
      if (serviceWorker && serviceWorker.getRegistrations) {
        const registrations = await serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if (caches && caches.keys) {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      }
    } catch {
      // reloading is still the best that can be done
    }
  }
  reload();
};
