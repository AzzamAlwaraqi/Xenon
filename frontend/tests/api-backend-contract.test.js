import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

/**
 * Cross-module contract test.
 *
 * The React portal and the Express API are separate deployables with no shared
 * type definition, so route drift between them is invisible until a page 404s
 * in front of a user. This suite parses BOTH sides and compares them.
 */

const ROUTER_MOUNTS = {
  authRoutes: '/auth',
  profileRoutes: '/profile',
  staffRoutes: '/staff',
  bookingRoutes: '/bookings',
  packageRoutes: '/packages',
  adminRoutes: '/admin',
  aiRoutes: '/ai',
  complaintRouter: '/complaints',
  reviewRouter: '/reviews',
  notificationRoutes: '/notifications',
  reportRoutes: '/reports',
  analysisRouter: '/analytics',
  PaymentRouter: '/payments',
}

const backendUrl = (file) => new URL(`../../backend/src/Routes/${file}.js`, import.meta.url)

function normalize(path) {
  return path
    .replace(/\$\{[^}]*\}/g, ':param')
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ':param')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '') || '/'
}

async function readBackendEndpoints() {
  const endpoints = []
  for (const [file, mount] of Object.entries(ROUTER_MOUNTS)) {
    const source = await readFile(backendUrl(file), 'utf8')
    const pattern = /router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]*)["'`]/g
    let match
    while ((match = pattern.exec(source))) {
      const [, method, route] = match
      const full = mount + (route === '/' ? '' : route)
      endpoints.push({ method: method.toUpperCase(), path: normalize(full), file })
    }
  }
  return endpoints
}

function readFrontendCalls(source) {
  const calls = []
  const pattern = /request\(\s*`([^`]+)`|request\(\s*'([^']+)'|request\(\s*"([^"]+)"/g
  let match
  while ((match = pattern.exec(source))) {
    const raw = match[1] || match[2] || match[3]
    // The HTTP method belongs to this call only, so stop scanning at the next one.
    const after = source.slice(match.index + match[0].length)
    const nextCall = after.search(/\brequest\(/)
    const scope = nextCall === -1 ? after : after.slice(0, nextCall)
    const method = scope.match(/method:\s*'([A-Z]+)'/)
    calls.push({ raw, method: method ? method[1] : 'GET', path: normalize(raw) })
  }
  return calls
}

const apiSource = await readFile(new URL('../src/services/api.js', import.meta.url), 'utf8')
const backendEndpoints = await readBackendEndpoints()
const frontendCalls = readFrontendCalls(apiSource)
const backendIndex = new Set(backendEndpoints.map((e) => `${e.method} ${e.path}`))

test('the backend route table parses to the expected surface', () => {
  assert.equal(backendEndpoints.length, 82, 'the API surface changed - review the contract tests below')
  assert.ok(backendIndex.has('POST /auth/login'))
  assert.ok(backendIndex.has('GET /profile/me'))
})

test('the portal calls a non-trivial share of the API', () => {
  assert.ok(frontendCalls.length >= 60, `expected 60+ API calls, parsed ${frontendCalls.length}`)
})

test('every route the portal calls exists on the backend with the same method', () => {
  const missing = frontendCalls
    .map((call) => ({ call, key: `${call.method} ${call.path}` }))
    .filter(({ key }) => !backendIndex.has(key))
    .map(({ call, key }) => `${key}   (source: ${call.raw})`)

  assert.deepEqual([...new Set(missing)], [], 'the portal calls routes the API does not expose')
})

test('the portal never calls the unauthenticated catalogue-rewrite route', () => {
  // Backend defect XEN-D03: GET /packages/fix-ownership reassigns every package.
  // The portal must not depend on it, so removing it cannot break the frontend.
  assert.ok(backendIndex.has('GET /packages/fix-ownership'), 'the defective route still exists on the backend')
  assert.equal(
    frontendCalls.some((call) => call.raw.includes('fix-ownership')),
    false,
    'the portal must not call the fix-ownership route',
  )
})

test('authentication calls target the documented auth endpoints', () => {
  for (const expected of [
    'POST /auth/login',
    'POST /auth/register',
    'POST /auth/logout',
    'POST /auth/refresh-token',
    'POST /auth/forgot-password',
    'POST /auth/reset-password',
    'POST /auth/send-otp',
  ]) {
    assert.ok(backendIndex.has(expected), `${expected} is missing from the backend`)
  }
})

test('the refresh flow posts the refresh token to the rotation endpoint', () => {
  assert.match(apiSource, /request\('\/auth\/refresh-token',\s*\{[\s\S]*?method: 'POST'/)
  assert.match(apiSource, /body: JSON\.stringify\(\{ refreshToken \}\)/)
})

test('the refresh flow is deduplicated so parallel 401s trigger one rotation', () => {
  // Backend defect XEN-D13 makes concurrent same-second sessions collide; a
  // second simultaneous refresh would make that worse.
  assert.match(apiSource, /let refreshPromise = null/)
  assert.match(apiSource, /if \(!refreshPromise\)/)
  assert.match(apiSource, /refreshPromise = null/)
})

test('a refresh is never attempted for the auth endpoints themselves', () => {
  assert.match(apiSource, /!path\.startsWith\('\/auth\/'\)/)
})

test('a failed refresh clears the session without broadcasting to other tabs', () => {
  assert.match(apiSource, /storage\.clearAuth\(false\)/)
})

test('vendor reply routes match the final backend paths', () => {
  assert.match(apiSource, /\/reviews\/reply\/\$\{reviewId\}/)
  assert.match(apiSource, /\/complaints\/respondToComplaint\/\$\{complaintId\}/)
})

test('every request carries a bearer token when one is stored', () => {
  assert.match(apiSource, /\.\.\.\(token && \{ Authorization: `Bearer \$\{token\}` \}\)/)
})

test('requests are bounded by an abort timeout so the UI cannot hang', () => {
  assert.match(apiSource, /new AbortController\(\)/)
  assert.match(apiSource, /setTimeout\(\(\) => controller\.abort\(\), \d+\)/)
  assert.match(apiSource, /clearTimeout\(timeout\)/)
})

test('multipart uploads omit the JSON content type so the browser sets the boundary', () => {
  assert.match(apiSource, /const isFormData = options\.body instanceof FormData/)
  assert.match(apiSource, /!isFormData && \{ 'Content-Type': 'application\/json' \}/)
})

test('KNOWN DEFECT XEN-D26: api.js cannot be imported outside a Vite bundle', () => {
  // `import.meta.env` is a Vite construct with no equivalent in plain Node, and
  // api.js reads it at MODULE SCOPE, so importing the module throws before any
  // export is reachable. That is why every assertion in this file inspects the
  // file as text: the 305-line API client cannot be executed by a test.
  //
  // The import is attempted in a child process rather than here, because
  // storage.js opens a BroadcastChannel at module scope that is never closed
  // and would hold this test runner's event loop open forever (XEN-D27).
  const probe = "import('../src/services/api.js').then(() => console.log('IMPORTED'), (e) => console.log('THREW:' + e.message))"
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
    cwd: new URL('.', import.meta.url).pathname.replace(/^\//, ''),
    encoding: 'utf8',
    timeout: 20000,
  })

  assert.match(result.stdout, /THREW:.*VITE_API_URL/, 'expected the module-scope env read to throw')
  assert.match(apiSource, /const BASE_URL = resolveBaseUrl\(import\.meta\.env\.VITE_API_URL\)/)
})

test('XEN-D26 scope: only api.js evaluates import.meta.env eagerly', () => {
  // The route guards read import.meta.env.DEV inside a component function, so
  // those modules stay importable. The fix for api.js is the same shape:
  // read the value lazily, or behind a guard.
  const eager = /^\s*const \w+ = resolveBaseUrl\(import\.meta\.env/m
  assert.match(apiSource, eager, 'documents the current eager read')
})

test('KNOWN DEFECT XEN-D27: storage.js opens a BroadcastChannel it never closes', () => {
  // Harmless in a browser tab, but it is an unconditional global side effect on
  // import: in any non-browser host it keeps the process alive indefinitely.
  const storageSource = readFileSync(new URL('../src/services/storage.js', import.meta.url), 'utf8')
  assert.match(storageSource, /new BroadcastChannel\('xenon-auth'\)/)
  assert.doesNotMatch(storageSource, /authChannel\?\.close\(\)/, 'nothing ever closes the channel')
})
