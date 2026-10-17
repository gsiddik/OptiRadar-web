// The product switchers of the other applications open this one with ?tenant_hint=<tenant id or code>. The hint is only
// passed on to the sign-in start (it makes OptiNexus continue in that tenant without a second login). It is never
// trusted for anything else: the server decides the tenant.
const KEY = 'tenantHint';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

// A tenant id (UUID, lower-cased) or a tenant code; anything else is dropped (null), never repaired.
export const validTenantHint = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (UUID.test(text)) return text.toLowerCase();
  return CODE.test(text) ? text : null;
};

export const isTenantId = (value) => typeof value === 'string' && UUID.test(value);

export const rememberTenantHint = (value) => {
  const hint = validTenantHint(value);
  try {
    if (hint) {
      window.sessionStorage.setItem(KEY, hint);
    }
  } catch {
    // without storage the hint is simply not used
  }
  return hint;
};

// Reads and forgets the hint, so one landing starts at most one sign-in (no loop if the sign-in returns an error).
export const takeTenantHint = () => {
  try {
    const hint = validTenantHint(window.sessionStorage.getItem(KEY));
    window.sessionStorage.removeItem(KEY);
    return hint;
  } catch {
    return null;
  }
};

export const openIdStartUrl = (hint) => {
  const valid = validTenantHint(hint);
  return valid
    ? `/api/session/openid/auth?tenant_hint=${encodeURIComponent(valid)}`
    : '/api/session/openid/auth';
};
