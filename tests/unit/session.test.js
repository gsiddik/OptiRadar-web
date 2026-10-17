import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowser, jsonResponse } from './browserStub.js';
import ApiError from '../../src/common/util/ApiError.js';
import fetchOrThrow from '../../src/common/util/fetchOrThrow.js';
import { describeError, stateOf } from '../../src/common/util/describeError.js';
import {
  announceSessionEnded,
  forgetSessionEnded,
  isSessionCall,
  onSessionEnded,
  peekSessionEnded,
  rememberSessionEnded,
} from '../../src/common/util/sessionEvents.js';
import webAddress from '../../src/common/util/webAddress.js';

// Like the real translation function: an unknown key gives nothing.
const t = (key) => (key.startsWith('apiError_') ? undefined : key);

const withFetch = async (response, run) => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    if (response instanceof Error) throw response;
    return response;
  };
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
};

const heard = () => {
  const events = [];
  const stop = onSessionEnded((error) => events.push(error));
  return { events, stop };
};

test('only plain web addresses may be followed', () => {
  assert.equal(webAddress('https://fleet.example.test/x'), 'https://fleet.example.test/x');
  assert.equal(webAddress('http://fleet.example.test/'), 'http://fleet.example.test/');
  ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', '/relative', '', null].forEach(
    (value) => assert.equal(webAddress(value), null, String(value)),
  );
});

test('the sign-in calls are not "the session ended"', () => {
  installBrowser();
  assert.equal(isSessionCall('/api/session'), true);
  assert.equal(isSessionCall('/api/session?token=abc'), true);
  assert.equal(isSessionCall('/api/session/openid/auth'), true);
  assert.equal(isSessionCall('/api/devices'), false);
  assert.equal(isSessionCall('/api/sessions-not'), false);
  assert.equal(isSessionCall({ url: 'http://radar.test/api/session/token' }), true);
});

test('a 401 on a data call announces the end of the session once, with the server code', async () => {
  installBrowser();
  const { events, stop } = heard();
  const body = {
    error: 'governance_access_revoked',
    message: 'Access is not granted.',
    correlationId: 'abc123',
  };
  await withFetch(jsonResponse(401, body), async () => {
    await assert.rejects(fetchOrThrow('/api/devices'), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      assert.equal(error.accessRevoked, true);
      assert.equal(error.correlationId, 'abc123');
      return true;
    });
  });
  stop();
  assert.equal(events.length, 1);
  assert.equal(events[0].code, 'governance_access_revoked');
});

test('a failed password sign-in (401 on /api/session) does not end anything', async () => {
  installBrowser();
  const { events, stop } = heard();
  await withFetch(jsonResponse(401, ''), async () => {
    await assert.rejects(fetchOrThrow('/api/session', { method: 'POST' }));
  });
  stop();
  assert.equal(events.length, 0);
});

test('403, 503 and network failures never end the session', async () => {
  installBrowser();
  const { events, stop } = heard();
  await withFetch(jsonResponse(403, { error: 'governance_permission_denied' }), async () => {
    await assert.rejects(fetchOrThrow('/api/devices'));
  });
  await withFetch(
    jsonResponse(503, { error: 'governance_unavailable' }, { 'Retry-After': '7' }),
    async () => {
      await assert.rejects(fetchOrThrow('/api/devices'), (error) => {
        assert.equal(error.retryAfter, 7);
        assert.equal(error.unavailable, true);
        return true;
      });
    },
  );
  await withFetch(new TypeError('Failed to fetch'), async () => {
    await assert.rejects(fetchOrThrow('/api/devices'), (error) => error.network === true);
  });
  stop();
  assert.equal(events.length, 0);
});

test('an aborted request stays an abort', async () => {
  installBrowser();
  const abort = new DOMException('aborted', 'AbortError');
  await withFetch(abort, async () => {
    await assert.rejects(fetchOrThrow('/api/devices'), (error) => error.name === 'AbortError');
  });
});

test('screens state of each kind of failure', () => {
  const make = (status, extra = {}) => new ApiError({ status, message: 'x', ...extra });
  assert.equal(stateOf(make(401)), 'session');
  assert.equal(stateOf(make(403)), 'forbidden');
  assert.equal(stateOf(make(503)), 'unavailable');
  assert.equal(stateOf(make(0, { network: true })), 'unavailable');
  assert.equal(stateOf(make(500)), 'error');
  assert.equal(stateOf(new Error('boom')), 'error');
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true });
  try {
    assert.equal(stateOf(make(0, { network: true })), 'offline');
  } finally {
    delete globalThis.navigator;
  }
});

test('a known server code is explained, an unknown one falls back to the state text', () => {
  const known = new ApiError({
    status: 403,
    code: 'governance_not_entitled',
    message: 'x',
    correlationId: 'ref-1',
  });
  const info = describeError(known, (key) =>
    key === 'apiError_governance_not_entitled' ? 'plan' : key,
  );
  assert.equal(info.detail, 'plan');
  assert.equal(info.reference, 'ref-1');
  const unknown = describeError(new ApiError({ status: 403, code: 'x_other', message: 'x' }), t);
  assert.equal(unknown.detail, 'state_forbiddenDetail');
});

test('the reason of an ended session survives the redirect to the login page once', () => {
  installBrowser();
  assert.equal(peekSessionEnded(), null);
  rememberSessionEnded('governance_access_revoked');
  assert.equal(peekSessionEnded(), 'governance_access_revoked');
  forgetSessionEnded();
  assert.equal(peekSessionEnded(), null);
  rememberSessionEnded();
  assert.equal(peekSessionEnded(), 'expired');
});

test('listeners can be removed', () => {
  const { events, stop } = heard();
  stop();
  announceSessionEnded(new ApiError({ status: 401, message: 'x' }));
  assert.equal(events.length, 0);
});
