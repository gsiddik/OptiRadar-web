// The few browser objects the pure modules touch, for tests that run in Node without a DOM.
export const installBrowser = (origin = 'http://radar.test') => {
  const store = new Map();
  const sessionStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
  globalThis.window = { location: { origin }, sessionStorage };
  return { store, sessionStorage };
};

export const jsonResponse = (status, body, headers = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
