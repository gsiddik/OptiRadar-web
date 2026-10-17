import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowser } from './browserStub.js';
import {
  isTenantId,
  openIdStartUrl,
  rememberTenantHint,
  takeTenantHint,
  validTenantHint,
} from '../../src/common/util/tenantHint.js';

const TENANT = '0b1f6c1e-6a3a-4c5e-9d52-6f0f6a1b2c01';

test('a tenant id or a tenant code is a valid hint; the id is lower-cased', () => {
  assert.equal(validTenantHint(TENANT.toUpperCase()), TENANT);
  assert.equal(validTenantHint(' acme-2.eu '), 'acme-2.eu');
  assert.equal(validTenantHint('A'), 'A');
});

test('anything else is dropped, never repaired', () => {
  const invalid = [
    '',
    '  ',
    null,
    undefined,
    42,
    'a b',
    'a&redirect_uri=https://evil.example.test',
    '../etc',
    'javascript:alert(1)',
    '-leading-dash',
    'x'.repeat(65),
    'tenant\nid',
    'https://evil.example.test',
    'a=b',
    'ä',
  ];
  invalid.forEach((value) => assert.equal(validTenantHint(value), null, String(value)));
});

test('the sign-in address carries only a valid hint, encoded', () => {
  assert.equal(openIdStartUrl(TENANT), `/api/session/openid/auth?tenant_hint=${TENANT}`);
  assert.equal(openIdStartUrl('a&b=c'), '/api/session/openid/auth');
  assert.equal(openIdStartUrl(null), '/api/session/openid/auth');
});

test('isTenantId tells ids from codes', () => {
  assert.equal(isTenantId(TENANT), true);
  assert.equal(isTenantId('acme'), false);
  assert.equal(isTenantId(null), false);
});

test('a hint is remembered once and used up when taken (no second sign-in start)', () => {
  const { store } = installBrowser();
  assert.equal(rememberTenantHint('bad value!'), null);
  assert.equal(store.size, 0);
  assert.equal(rememberTenantHint(TENANT), TENANT);
  assert.equal(takeTenantHint(), TENANT);
  assert.equal(takeTenantHint(), null);
  assert.equal(store.size, 0);
});

test('without browser storage the hint is simply not used', () => {
  globalThis.window = {
    sessionStorage: {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    },
  };
  assert.equal(rememberTenantHint(TENANT), TENANT);
  assert.equal(takeTenantHint(), null);
});
