import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RELOAD_WINDOW_MS,
  classifyRuntimeError,
  isChunkLoadError,
  mayReloadAutomatically,
  referenceOf,
  reloadToLatest,
} from '../../src/common/util/runtimeError.js';

const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
};

test('failed dynamic imports of every browser are recognised as stale parts', () => {
  const messages = [
    'Failed to fetch dynamically imported module: https://radar.test/assets/DevicePage-abc.js',
    'error loading dynamically imported module: https://radar.test/assets/DevicePage-abc.js',
    'Importing a module script failed.',
    'Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".',
    'Unable to preload CSS for /assets/MapView-abc.css',
    'Loading chunk 42 failed.',
  ];
  messages.forEach((message) =>
    assert.equal(isChunkLoadError(new TypeError(message)), true, message),
  );
  const named = new Error('x');
  named.name = 'ChunkLoadError';
  assert.equal(isChunkLoadError(named), true);
});

test('other failures are not stale parts', () => {
  assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')), false);
  assert.equal(isChunkLoadError(new TypeError('Failed to fetch')), false);
  assert.equal(isChunkLoadError(null), false);
  assert.equal(isChunkLoadError(undefined), false);
});

test('a stale part is offline when the device has no connection', () => {
  const stale = new TypeError('Failed to fetch dynamically imported module: /a.js');
  assert.equal(classifyRuntimeError(stale, true), 'stale');
  assert.equal(classifyRuntimeError(stale, false), 'offline');
  assert.equal(classifyRuntimeError(new Error('boom'), true), 'error');
  assert.equal(classifyRuntimeError(new Error('boom'), false), 'error');
});

test('a reference is made for a bug and kept from the server when there is one', () => {
  const first = referenceOf(new Error('boom'));
  const second = referenceOf(new Error('boom'));
  assert.match(first, /^UI-[0-9A-F]{8}$/);
  assert.notEqual(first, second);
  assert.equal(referenceOf({ correlationId: 'abc-123' }), 'abc-123');
  assert.match(referenceOf(null), /^UI-[0-9A-F]{8}$/);
  assert.match(referenceOf({ correlationId: 42 }), /^UI-[0-9A-F]{8}$/);
});

test('the app reloads itself once, not in a loop', () => {
  const storage = memoryStorage();
  const start = 1_000_000;
  assert.equal(mayReloadAutomatically(storage, start), true);
  assert.equal(mayReloadAutomatically(storage, start + 1000), false);
  assert.equal(mayReloadAutomatically(storage, start + RELOAD_WINDOW_MS - 1), false);
  assert.equal(mayReloadAutomatically(storage, start + RELOAD_WINDOW_MS), true);
});

test('without storage the app does not reload by itself', () => {
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  assert.equal(mayReloadAutomatically(broken, 1), false);
});

const fakeBrowser = () => {
  const calls = [];
  return {
    calls,
    serviceWorker: {
      getRegistrations: async () => [
        { unregister: async () => calls.push('unregister:1') },
        { unregister: async () => calls.push('unregister:2') },
      ],
    },
    caches: {
      keys: async () => ['workbox-precache-v2', 'runtime'],
      delete: async (name) => calls.push(`delete:${name}`),
    },
    reload: () => calls.push('reload'),
  };
};

test('online, a stale app drops the old service worker and its caches before it reloads', async () => {
  const browser = fakeBrowser();
  await reloadToLatest({ online: true, ...browser });
  assert.deepEqual(browser.calls.slice().sort(), [
    'delete:runtime',
    'delete:workbox-precache-v2',
    'reload',
    'unregister:1',
    'unregister:2',
  ]);
  assert.equal(browser.calls.at(-1), 'reload');
});

test('offline, the cached app is kept and only the page reloads', async () => {
  const browser = fakeBrowser();
  await reloadToLatest({ online: false, ...browser });
  assert.deepEqual(browser.calls, ['reload']);
});

test('the page still reloads when the cleanup fails', async () => {
  const browser = fakeBrowser();
  browser.serviceWorker.getRegistrations = async () => {
    throw new Error('denied');
  };
  await reloadToLatest({ online: true, ...browser });
  assert.deepEqual(browser.calls, ['reload']);
});
