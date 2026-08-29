import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import test from 'node:test'

import { getPortalRole, isExpiredToken } from '../src/utils/authToken.js'
import {
  formatBirthDateForApi,
  isAcceptablePassword,
  isAtLeastAge,
  isStrongPassword,
  isValidEmail,
  validateBooking,
  validateBookingTransition,
  validateBroadcast,
  validatePackage,
  validatePasswordReset,
  validatePayment,
  validateStaff,
  validateVendorAccount,
  validateVendorBusiness,
} from '../src/utils/formValidation.js'
import { retrySimultaneousLogin } from '../src/utils/retryLogin.js'
import { shouldInvalidateSession } from '../src/utils/sessionPolicy.js'
import { canResumeVendorOnboarding, createVendorOnboardingDraft } from '../src/utils/vendorOnboarding.js'

function tokenWithClaims(claims) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${header}.${payload}.test-signature`
}

function dateFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
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

test('requires vendor applicants to be at least 18 on their exact birthday', () => {
  const valid = { name: 'Dana Vendor', email: 'dana@example.com', DateOfBirth: '2008-08-27', gender: 'female', mobileNumber: '0791234567', password: 'Vendor123!', confirm: 'Vendor123!' }
  assert.equal(isAtLeastAge('2008-08-27', 18, '2026-08-27'), true)
  assert.equal(isAtLeastAge('2008-08-28', 18, '2026-08-27'), false)
  assert.equal(formatBirthDateForApi('2008-08-27'), '27/08/2008')
  assert.equal(validateVendorAccount(valid), '')
  assert.match(validateVendorAccount({ ...valid, DateOfBirth: dateFromToday(-365 * 17) }), /at least 18/i)
})

test('validates the complete vendor onboarding contract and documents', () => {
  const image = { type: 'image/jpeg', size: 1024 }
  const valid = { company_name: 'Xenon Travel', address: 'King Abdullah II Street', city: 'Amman', iban_number: `JO${'1'.repeat(28)}`, commercial_register_image: image, vocational_license_image: image, owner_id_image: image, iban_letter_image: image, tourism_license_image: null }
  assert.equal(validateVendorBusiness(valid), '')
  assert.match(validateVendorBusiness({ ...valid, iban_letter_image: null }), /IBAN letter image/i)
})

test('resumes vendor business details without storing credentials or files', () => {
  const draft = createVendorOnboardingDraft({
    name: 'Dana Vendor',
    email: 'dana@example.com',
    company_name: 'Dana Tours',
    address: 'Amman',
    city: 'Amman',
    iban_number: `JO${'1'.repeat(28)}`,
    password: 'NeverStoreThis123!',
    otp: '123456',
    owner_id_image: { type: 'image/jpeg', size: 1024 },
  })

  assert.equal(draft.accountCreated, true)
  assert.equal(draft.company_name, 'Dana Tours')
  assert.equal('password' in draft, false)
  assert.equal('otp' in draft, false)
  assert.equal('owner_id_image' in draft, false)
  assert.equal(canResumeVendorOnboarding({ draft, token: 'token', role: 'user' }), true)
  assert.equal(canResumeVendorOnboarding({ draft, token: 'token', role: 'vendor' }), false)
  assert.equal(canResumeVendorOnboarding({ draft, token: 'token', role: 'user', expired: true }), false)
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

test('only genuine token failures invalidate an existing portal session', () => {
  const token = tokenWithClaims({ role: 'vendor', exp: Math.floor(Date.now() / 1000) + 60 })
  assert.equal(shouldInvalidateSession({ status: 401, message: 'Invalid token. Please log in again!', token, path: '/profile/me' }), true)
  assert.equal(shouldInvalidateSession({ status: 401, message: 'Current password is incorrect', token, path: '/profile/change-password' }), false)
  assert.equal(shouldInvalidateSession({ status: 401, message: 'Invalid email or password', token, path: '/auth/login' }), false)
  assert.equal(shouldInvalidateSession({ status: 403, message: 'Forbidden', token, path: '/packages/' }), false)
})

test('validates the complete OTP password-reset form', () => {
  const valid = { email: 'vendor@example.com', otpCode: '123456', password: 'Vendor123!', confirm_password: 'Vendor123!' }
  assert.equal(validatePasswordReset(valid), '')
  assert.equal(validatePasswordReset({ ...valid, otpCode: '12345' }), 'Enter the six-digit verification code from your email.')
  assert.equal(validatePasswordReset({ ...valid, confirm_password: 'Different123!' }), 'Passwords do not match.')
})

test('validates Postman create and edit package fields', () => {
  const form = {
    package_name: 'Petra trail', package_description: 'A complete guided journey.', package_price: '45',
    package_type: 'cultural', package_status: 'active', startDate: dateFromToday(2), endDate: dateFromToday(3),
    max_people: '12', meeting_point: 'Visitor centre',
    package_image: { type: 'image/webp', size: 2048 },
  }
  assert.equal(validatePackage(form), '')
  assert.match(validatePackage({ ...form, startDate: dateFromToday(-1) }), /past/i)
  assert.match(validatePackage({ ...form, endDate: form.startDate }), /after/i)
  assert.match(validatePackage({ ...form, package_image: { type: 'image/webp', size: 0 } }), /empty/i)
  assert.equal(validatePackage({ package_name: 'Petra trail', package_price: '55', package_image: null }, true), '')
})

test('validates financial records before converting values for the API', () => {
  const valid = { booking_id: '742a8d92-3e87-49f4-9f4e-67d3eeda2ffc', amount: '15.25', payment_method: 'Cash', customer_phone: '0791234567', payment_description: 'Cash received at office' }
  assert.equal(validatePayment(valid, 'vendor'), '')
  assert.equal(validatePayment({ ...valid, receipt: { type: 'application/pdf', size: 1024 } }, 'vendor'), '')
  assert.match(validatePayment({ ...valid, receipt: { type: 'text/plain', size: 1024 } }, 'vendor'), /JPEG, PNG, WebP, or PDF/i)
  assert.match(validatePayment({ ...valid, receipt: { type: 'image/jpeg', size: 6 * 1024 * 1024 } }, 'vendor'), /5 MB/i)
  assert.match(validatePayment({ ...valid, amount: 'not-a-number' }, 'vendor'), /at least/i)
  assert.match(validatePayment({ ...valid, booking_id: '123' }, 'vendor'), /booking ID/i)
  assert.match(validatePayment({ ...valid, customer_phone: '0791' }, 'vendor'), /10 digits/i)
})

test('matches staff role, position, contact, and pay dependencies', () => {
  const valid = { name: 'Dana Guide', email: 'dana@xenon.com', mobileNumber: '0791234567', password: 'Guide123', role: 'vendor', workSystem: 'full-time', position: 'tour-guide', basePay: '450', allowances: '25' }
  assert.equal(validateStaff(valid, 'vendor'), '')
  assert.match(validateStaff({ ...valid, position: 'manager' }, 'vendor'), /position/i)
  assert.match(validateStaff({ ...valid, workSystem: 'freelance', allowances: '25' }, 'vendor'), /allowances/i)
})

test('keeps booking requests within package dates, seats, and lifecycle', () => {
  const packageItem = { startDate: dateFromToday(2), endDate: dateFromToday(5), available_seats: 3, package_status: 'active' }
  assert.equal(validateBooking({ date: dateFromToday(3), guests: 2 }, packageItem), '')
  assert.match(validateBooking({ date: dateFromToday(1), guests: 2 }, packageItem), /before the package starts/i)
  assert.match(validateBooking({ date: dateFromToday(3), guests: 4 }, packageItem), /3 seats/i)
  assert.equal(validateBookingTransition('pending', 'accepted'), '')
  assert.match(validateBookingTransition('completed', 'accepted'), /cannot be changed/i)
})

test('validates notification length and audience dependencies', () => {
  assert.equal(validateBroadcast({ title: 'Weather update', message: 'Departure moved by one hour.', targetAudience: 'all' }, 'admin'), '')
  assert.match(validateBroadcast({ title: 'Hi', message: 'Short', targetAudience: 'all' }, 'admin'), /title/i)
  assert.match(validateBroadcast({ title: 'Weather update', message: 'Departure moved.', targetAudience: 'unknown' }, 'admin'), /audience/i)
})
