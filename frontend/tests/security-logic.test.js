import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import test from 'node:test'

import { getPortalRole, isExpiredToken } from '../src/utils/authToken.js'
import { isAcceptablePassword, isStrongPassword, isValidEmail, validatePasswordReset } from '../src/utils/formValidation.js'
import { retrySimultaneousLogin } from '../src/utils/retryLogin.js'

function tokenWithClaims(claims) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${header}.${payload}.test-signature`
}

test('validates email input used by login and recovery forms', () => {
  assert.equal(isValidEmail(' vendor@example.com '), true)
  assert.equal(isValidEmail('vendor@example'), false)
})

test('matches the current backend password contract', () => {
  assert.equal(isAcceptablePassword('Vendor123!'), true)
  assert.equal(isAcceptablePassword('Vendor123'), false)
  assert.equal(isStrongPassword('LongVendor123!'), true)
})

test('uses the JWT portal role instead of a conflicting selected tab', () => {
  assert.equal(getPortalRole(tokenWithClaims({ role: 'admin' }), 'vendor'), 'admin')
  assert.equal(getPortalRole(tokenWithClaims({ role: 'user' }), 'vendor'), 'vendor')
})

test('detects expired sessions before protected pages render', () => {
  assert.equal(isExpiredToken(tokenWithClaims({ exp: Math.floor(Date.now() / 1000) - 10 })), true)
  assert.equal(isExpiredToken(tokenWithClaims({ exp: Math.floor(Date.now() / 1000) + 60 })), false)
})

test('recovers from the backend simultaneous-session token collision', async () => {
  let calls = 0
  const operation = async () => {
    calls += 1
    if (calls < 3) throw Object.assign(new Error('session collision'), { status: 500, serverMessage: 'E11000 duplicate key token_id_1' })
    return { status: 'success' }
  }

  const result = await retrySimultaneousLogin(operation, { delay: async () => {} })
  assert.deepEqual(result, { status: 'success' })
  assert.equal(calls, 3)
})

test('validates the complete OTP password-reset form', () => {
  const valid = { email: 'vendor@example.com', otpCode: '123456', password: 'Vendor123!', confirm_password: 'Vendor123!' }
  assert.equal(validatePasswordReset(valid), '')
  assert.equal(validatePasswordReset({ ...valid, otpCode: '12345' }), 'Enter the six-digit verification code from your email.')
  assert.equal(validatePasswordReset({ ...valid, confirm_password: 'Different123!' }), 'Passwords do not match.')
})
