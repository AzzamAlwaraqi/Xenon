import assert from 'node:assert/strict'
import test from 'node:test'

import { isSimultaneousLoginConflict, retrySimultaneousLogin } from '../src/utils/retryLogin.js'
import { shouldInvalidateSession } from '../src/utils/sessionPolicy.js'

const conflict = () => Object.assign(new Error('Request failed'), {
  status: 500,
  serverMessage: 'E11000 duplicate key error collection: xenon.sessions index: token_id_1',
})

// ---------------------------------------------------------------- session policy

test('only a token failure destroys an authenticated session', () => {
  const base = { status: 401, token: 'abc', path: '/profile/me' }
  // These are the exact strings the backend emits.
  for (const message of [
    'Invalid token. Please log in again!',              // authMiddleware.protect
    'You are not logged in! Please log in to get access.', // authMiddleware.protect
    'The user belonging to this token no longer exists.',  // authMiddleware.protect
    'Your login session is missing or has expired.',       // api.js 401 mapping
  ]) {
    assert.equal(shouldInvalidateSession({ ...base, message }), true, `should invalidate on: ${message}`)
  }
})

test('KNOWN DEFECT XEN-D21: the backend expired-token message is not recognised', () => {
  // backend/src/middlewares/errorHandler.js emits exactly this string for a
  // TokenExpiredError, but TOKEN_FAILURE_PATTERN only matches "expired token"
  // or "token is expired" - not "token has expired". The dead session is left
  // in place instead of being cleared.
  assert.equal(shouldInvalidateSession({
    status: 401, token: 'abc', path: '/profile/me',
    message: 'Your token has expired! Please log in again.',
  }), false, 'documents current behaviour; flip to true once the pattern is fixed')
})

test('a wrong-password 401 never signs the user out of the portal', () => {
  assert.equal(shouldInvalidateSession({
    status: 401, token: 'abc', path: '/profile/change-password',
    message: 'The current password is incorrect.',
  }), false)
})

test('a 401 from the auth endpoints themselves is not a session failure', () => {
  assert.equal(shouldInvalidateSession({
    status: 401, token: 'abc', path: '/auth/login', message: 'Invalid token.',
  }), false)
})

test('non-401 statuses never invalidate a session', () => {
  for (const status of [400, 403, 404, 409, 429, 500, 503]) {
    assert.equal(shouldInvalidateSession({
      status, token: 'abc', path: '/profile/me', message: 'Invalid token.',
    }), false, `status ${status} must not clear the session`)
  }
})

test('an anonymous caller has no session to invalidate', () => {
  assert.equal(shouldInvalidateSession({
    status: 401, token: null, path: '/profile/me', message: 'Invalid token.',
  }), false)
})

test('an unrecognised 401 message leaves the session intact', () => {
  // Erring toward keeping the session avoids signing users out on an unrelated failure.
  assert.equal(shouldInvalidateSession({
    status: 401, token: 'abc', path: '/bookings/my-bookings', message: 'Something went wrong.',
  }), false)
  assert.equal(shouldInvalidateSession({ status: 401, token: 'abc', path: '/bookings/my-bookings' }), false)
})

// ---------------------------------------------------------------- login retry

test('recognises the backend simultaneous-session collision', () => {
  assert.equal(isSimultaneousLoginConflict(conflict()), true)
  assert.equal(isSimultaneousLoginConflict(Object.assign(new Error('x'), {
    status: 500, serverMessage: 'duplicate key on token_id_1',
  })), true)
})

test('does not mistake an ordinary server error for the collision', () => {
  assert.equal(isSimultaneousLoginConflict(Object.assign(new Error('x'), { status: 500, serverMessage: 'Database unavailable' })), false)
  assert.equal(isSimultaneousLoginConflict(Object.assign(new Error('x'), { status: 401, serverMessage: 'duplicate key token_id_1' })), false)
  assert.equal(isSimultaneousLoginConflict(null), false)
  assert.equal(isSimultaneousLoginConflict(undefined), false)
  assert.equal(isSimultaneousLoginConflict({}), false)
})

test('a login that succeeds first time is not retried', async () => {
  let calls = 0
  const result = await retrySimultaneousLogin(async () => { calls += 1; return 'session' })
  assert.equal(result, 'session')
  assert.equal(calls, 1)
})

test('retries through the collision and returns the eventual session', async () => {
  let calls = 0
  const delays = []
  const result = await retrySimultaneousLogin(async () => {
    calls += 1
    if (calls < 3) throw conflict()
    return 'session'
  }, { delay: async (attempt) => { delays.push(attempt) } })

  assert.equal(result, 'session')
  assert.equal(calls, 3)
  assert.deepEqual(delays, [0, 1], 'waits between attempts, not after the last one')
})

test('gives up after the configured number of attempts and rethrows the collision', async () => {
  let calls = 0
  await assert.rejects(
    () => retrySimultaneousLogin(async () => { calls += 1; throw conflict() }, { attempts: 3, delay: async () => {} }),
    /duplicate key|Request failed/,
  )
  assert.equal(calls, 3, 'exactly the configured number of attempts')
})

test('an unrelated failure is rethrown immediately without burning retries', async () => {
  let calls = 0
  await assert.rejects(
    () => retrySimultaneousLogin(async () => {
      calls += 1
      throw Object.assign(new Error('The email or password is incorrect.'), { status: 401 })
    }, { delay: async () => {} }),
    /email or password is incorrect/,
  )
  assert.equal(calls, 1, 'a credential error must not be retried')
})

test('a single-attempt configuration does not wait before failing', async () => {
  let waited = false
  await assert.rejects(
    () => retrySimultaneousLogin(async () => { throw conflict() }, {
      attempts: 1, delay: async () => { waited = true },
    }),
  )
  assert.equal(waited, false)
})
