// Embedded mode: OptiRadar shown in an iframe of another Opti product (for example OptiDeli). OptiNexus gives the product a short-lived
// read-only token; the page is opened as `/?embed=1&token=...`. Browsers block the session cookie of a framed page from another site, so in
// this mode the token is sent with every request instead of relying on the cookie.

const KEY = 'embedToken';

const storage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const rememberEmbedToken = (token) => {
  storage()?.setItem(KEY, token);
};

export const embedToken = () => storage()?.getItem(KEY) || null;

export const isEmbedded = () => embedToken() !== null;

export const isApiUrl = (input) => {
  const url = typeof input === 'string' ? input : input?.url;
  return typeof url === 'string' && (url.startsWith('/api/') || url === '/api');
};

/** The request init with the embed token, or unchanged when there is none or the request is not for this server's API. */
export const withEmbedToken = (input, init, token) => {
  if (!token || !isApiUrl(input)) {
    return init;
  }
  const headers = new Headers(init?.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
};

/** `/api/session` has no bearer support; the token goes in its query string so the framed page still learns who it is. */
export const sessionUrl = (input, token) => {
  if (token && input === '/api/session') {
    return `/api/session?token=${encodeURIComponent(token)}`;
  }
  return input;
};

export const installEmbedFetch = () => {
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const token = embedToken();
    if (!token) {
      return original(input, init);
    }
    return original(sessionUrl(input, token), withEmbedToken(input, init, token));
  };
};
