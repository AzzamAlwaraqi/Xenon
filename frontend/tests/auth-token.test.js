import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import test from 'node:test'

import { getPortalRole, getTokenClaims, isExpiredToken } from '../src/utils/authToken.js'

function token(claims, { header = { alg: 'HS256', typ: 'JWT' }, signature = 'sig' } = {}) {
  const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part(header)}.${part(claims)}.${signature}`
}

test('reads the claim set out of a well-formed token', () => {
  const claims = getTokenClaims(token({ id: 'user-1', role: 'vendor', exp: 4102444800 }))
  assert.equal(claims.id, 'user-1')
  assert.equal(claims.role, 'vendor')
})

test('returns null instead of throwing for every malformed token shape', () => {
  for (const value of [null, undefined, 42, {}, [], '', 'not-a-token', 'only.two', 'a..c']) {
    assert.equal(getTokenClaims(value), null, `expected null for ${JSON.stringify(value)}`)
  }
})

test('returns null when the payload segment is not valid JSON', () => {
  const broken = `${Buffer.from('{}').toString('base64url')}.${Buffer.from('not-json').toString('base64url')}.sig`
  assert.equal(getTokenClaims(broken), null)
})

test('decodes base64url payloads that use - and _ instead of + and /', () => {
  // A claim value chosen so its base64 encoding contains both substituted characters.
  const claims = { id: 'a>b?c~d', role: 'admin' }
  const decoded = getTokenClaims(token(claims))
  assert.equal(decoded.id, 'a>b?c~d')
})

test('decodes non-ASCII claim values without mangling them', () => {
  const decoded = getTokenClaims(token({ name: 'رنا عودة', role: 'vendor' }))
  assert.equal(decoded.name, 'رنا عودة')
})

test('accepts only admin and vendor as portal roles', () => {
  assert.equal(getPortalRole(token({ role: 'admin' })), 'admin')
  assert.equal(getPortalRole(token({ role: 'vendor' })), 'vendor')
  assert.equal(getPortalRole(token({ role: 'user' })), '')
  assert.equal(getPortalRole(token({ role: 'employee' })), '')
})

test('the token role beats a conflicting stored role', () => {
  // A tampered sessionStorage role must never widen access beyond the signed claim.
  assert.equal(getPortalRole(token({ role: 'vendor' }), 'admin'), 'vendor')
})

test('falls back to the stored role only when the token carries none', () => {
  assert.equal(getPortalRole(token({ id: 'u1' }), 'admin'), 'admin')
  assert.equal(getPortalRole(token({ id: 'u1' }), 'user'), '')
  assert.equal(getPortalRole(null, 'vendor'), 'vendor')
  assert.equal(getPortalRole(null, 'user'), '')
})

test('treats a token whose expiry has passed as expired', () => {
  const past = Math.floor(Date.now() / 1000) - 60
  assert.equal(isExpiredToken(token({ exp: past })), true)
})

test('treats a token with time remaining as live', () => {
  const future = Math.floor(Date.now() / 1000) + 900
  assert.equal(isExpiredToken(token({ exp: future })), false)
})

test('treats a token expiring exactly now as expired', () => {
  const now = Math.floor(Date.now() / 1000)
  assert.equal(isExpiredToken(token({ exp: now - 1 })), true)
})

test('does not call a token expired when it carries no or a non-numeric exp', () => {
  // Guarding the session on a missing claim would sign users out for no reason.
  assert.equal(isExpiredToken(token({ id: 'u1' })), false)
  assert.equal(isExpiredToken(token({ exp: 'soon' })), false)
  assert.equal(isExpiredToken('garbage'), false)
  assert.equal(isExpiredToken(null), false)
})
