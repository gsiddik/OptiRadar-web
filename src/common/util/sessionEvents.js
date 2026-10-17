// One place that learns the session is over (the server answered 401 to a signed-in call), so every screen does not
// have to handle it. `SessionGuard` listens and sends the person to the login page with the reason.
const listeners = new Set();

export const onSessionEnded = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const announceSessionEnded = (error) => {
  listeners.forEach((listener) => listener(error));
};

// The sign-in itself answers 401 for a wrong password; it is not "the session ended".
export const isSessionCall = (input) => {
  try {
    const url = typeof input === 'string' ? input : input && input.url ? input.url : '';
    const { pathname } = new URL(url, window.location.origin);
    return pathname === '/api/session' || pathname.startsWith('/api/session/');
  } catch {
    return false;
  }
};

const KEY = 'sessionEnded';

// The reason is kept for the login page across the redirect (stable code of the server, or "expired").
export const rememberSessionEnded = (reason) => {
  try {
    window.sessionStorage.setItem(KEY, reason || 'expired');
  } catch {
    // storage can be unavailable; the login page then simply shows no reason
  }
};

export const peekSessionEnded = () => {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const forgetSessionEnded = () => {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // nothing to forget
  }
};
