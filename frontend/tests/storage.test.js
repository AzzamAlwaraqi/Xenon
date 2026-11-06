import assert from 'node:assert/strict'
import test from 'node:test'

/**
 * storage.js talks to sessionStorage, localStorage, window events and
 * BroadcastChannel. Those browser globals are installed here before the module
 * is imported, so the real module runs unmodified against a controllable fake.
 */
function createWebStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: (key) => { map.delete(key) },
    clear: () => map.clear(),
    get size() { return map.size },
    keys: () => [...map.keys()],
  }
}

const sessionStore = createWebStorage()
const localStore = createWebStorage()
const dispatched = []
const broadcast = []

globalThis.sessionStorage = sessionStore
globalThis.localStorage = localStore
globalThis.Event = class Event { constructor(type) { this.type = type } }
globalThis.window = {
  dispatchEvent: (event) => { dispatched.push(event.type); return true },
  addEventListener: () => {},
  removeEventListener: () => {},
}
globalThis.BroadcastChannel = class BroadcastChannel {
  constructor(name) { this.name = name }
  postMessage(message) { broadcast.push(message) }
  addEventListener() {}
}

const {
  storage, TOKEN_KEY, REFRESH_TOKEN_KEY, ROLE_KEY, USER_KEY, SESSION_KEY, AUTH_CHANGE_EVENT,
} = await import('../src/services/storage.js')

function reset() {
  sessionStore.clear()
  localStore.clear()
  dispatched.length = 0
  broadcast.length = 0
}

test('round-trips a stored value through JSON', () => {
  reset()
  storage.set(USER_KEY, { name: 'Rana', roles: ['user'] })
  assert.deepEqual(storage.get(USER_KEY), { name: 'Rana', roles: ['user'] })
})

test('returns null for a key that was never stored', () => {
  reset()
  assert.equal(storage.get('nothing-here'), null)
})

test('returns null rather than throwing when stored JSON is corrupt', () => {
  reset()
  sessionStore.setItem(TOKEN_KEY, '{not json')
  assert.equal(storage.get(TOKEN_KEY), null)
})

test('auth values live in sessionStorage, never in localStorage', () => {
  reset()
  storage.set(TOKEN_KEY, 'abc')
  assert.equal(sessionStore.getItem(TOKEN_KEY), JSON.stringify('abc'))
  assert.equal(localStore.getItem(TOKEN_KEY), null)
})

test('migrates a legacy localStorage session into sessionStorage on first read', () => {
  reset()
  localStore.setItem(TOKEN_KEY, JSON.stringify('legacy-token'))
  assert.equal(storage.get(TOKEN_KEY), 'legacy-token')
  assert.equal(sessionStore.getItem(TOKEN_KEY), JSON.stringify('legacy-token'))
  assert.equal(localStore.getItem(TOKEN_KEY), null, 'the persistent copy must be removed after migration')
})

test('does not migrate a non-auth key out of localStorage', () => {
  reset()
  localStore.setItem('xenon_theme', JSON.stringify('dark'))
  assert.equal(storage.get('xenon_theme'), 'dark')
  assert.equal(localStore.getItem('xenon_theme'), JSON.stringify('dark'))
})

test('a session value shadows a stale legacy value for the same key', () => {
  reset()
  localStore.setItem(TOKEN_KEY, JSON.stringify('old'))
  sessionStore.setItem(TOKEN_KEY, JSON.stringify('current'))
  assert.equal(storage.get(TOKEN_KEY), 'current')
})

test('setAuthSession writes the whole session and announces the change once', () => {
  reset()
  storage.setAuthSession({
    token: 'access', refreshToken: 'refresh', role: 'vendor',
    session: { id: 's1' }, user: { name: 'Rana' },
  })
  assert.equal(storage.get(TOKEN_KEY), 'access')
  assert.equal(storage.get(REFRESH_TOKEN_KEY), 'refresh')
  assert.equal(storage.get(ROLE_KEY), 'vendor')
  assert.deepEqual(storage.get(SESSION_KEY), { id: 's1' })
  assert.deepEqual(storage.get(USER_KEY), { name: 'Rana' })
  assert.deepEqual(dispatched, [AUTH_CHANGE_EVENT])
})

test('setAuthSession defaults the optional fields rather than leaving them undefined', () => {
  reset()
  storage.setAuthSession({ token: 'access', role: 'admin' })
  assert.equal(storage.get(REFRESH_TOKEN_KEY), null)
  assert.equal(storage.get(SESSION_KEY), null)
  assert.equal(storage.get(USER_KEY), null)
})

test('updateAuthTokens replaces the token pair and leaves the rest of the session alone', () => {
  reset()
  storage.setAuthSession({ token: 'old', refreshToken: 'old-r', role: 'vendor', user: { name: 'Rana' } })
  dispatched.length = 0
  storage.updateAuthTokens({ token: 'new', refreshToken: 'new-r' })
  assert.equal(storage.get(TOKEN_KEY), 'new')
  assert.equal(storage.get(REFRESH_TOKEN_KEY), 'new-r')
  assert.equal(storage.get(ROLE_KEY), 'vendor')
  assert.deepEqual(storage.get(USER_KEY), { name: 'Rana' })
  assert.deepEqual(dispatched, [AUTH_CHANGE_EVENT])
})

test('clearAuth removes every auth key from both stores', () => {
  reset()
  storage.setAuthSession({ token: 'a', refreshToken: 'b', role: 'admin', session: { id: 1 }, user: { n: 1 } })
  localStore.setItem(ROLE_KEY, JSON.stringify('admin'))
  storage.clearAuth()
  for (const key of [TOKEN_KEY, REFRESH_TOKEN_KEY, ROLE_KEY, SESSION_KEY, USER_KEY]) {
    assert.equal(sessionStore.getItem(key), null, `${key} left in sessionStorage`)
    assert.equal(localStore.getItem(key), null, `${key} left in localStorage`)
  }
})

test('clearAuth leaves non-auth keys untouched', () => {
  reset()
  storage.set('xenon_theme', 'dark')
  storage.setAuthSession({ token: 'a', role: 'admin' })
  storage.clearAuth()
  assert.equal(storage.get('xenon_theme'), 'dark')
})

test('signing out broadcasts to other tabs by default', () => {
  reset()
  storage.clearAuth()
  assert.deepEqual(broadcast, [{ type: 'logout' }])
})

test('an API-triggered clear does not broadcast, so one tab cannot sign the others out', () => {
  reset()
  storage.clearAuth(false)
  assert.deepEqual(broadcast, [], 'a 401 in one tab must not cascade to a newer login in another tab')
})

test('remove() drops a single key from both stores and announces auth changes only', () => {
  reset()
  storage.set(TOKEN_KEY, 'a')
  localStore.setItem(TOKEN_KEY, '"a"')
  dispatched.length = 0
  storage.remove(TOKEN_KEY)
  assert.equal(sessionStore.getItem(TOKEN_KEY), null)
  assert.equal(localStore.getItem(TOKEN_KEY), null)
  assert.deepEqual(dispatched, [AUTH_CHANGE_EVENT])

  dispatched.length = 0
  storage.set('xenon_theme', 'dark')
  storage.remove('xenon_theme')
  assert.deepEqual(dispatched, [], 'a non-auth key must not fire the auth-change event')
})
