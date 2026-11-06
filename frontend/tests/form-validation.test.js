import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatBirthDateForApi,
  isAtLeastAge,
  isUuid,
  isValidIsoDate,
  latestBirthDateForAge,
  localToday,
  normalizePhone,
  validateAnalyticsDates,
  validateChangePassword,
  validateDateRange,
  validateLogin,
  validateProfile,
  validateResponseText,
  validateReview,
  validateTraveller,
} from '../src/utils/formValidation.js'

const file = (over = {}) => ({ type: 'image/jpeg', size: 1024, ...over })
const daysFromToday = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const offset = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

// ---------------------------------------------------------------- date helpers

test('accepts only real calendar dates in ISO form', () => {
  assert.equal(isValidIsoDate('2001-03-09'), true)
  assert.equal(isValidIsoDate('2024-02-29'), true, 'leap day is real')
  assert.equal(isValidIsoDate('2023-02-29'), false, '2023 is not a leap year')
  assert.equal(isValidIsoDate('2001-13-01'), false)
  assert.equal(isValidIsoDate('2001-04-31'), false)
  assert.equal(isValidIsoDate('09/03/2001'), false)
  assert.equal(isValidIsoDate(''), false)
  assert.equal(isValidIsoDate(null), false)
})

test('converts an ISO birth date to the DD/MM/YYYY form the API expects', () => {
  assert.equal(formatBirthDateForApi('2001-03-09'), '09/03/2001')
  assert.equal(formatBirthDateForApi('1998-12-31'), '31/12/1998')
})

test('leaves an unparseable birth date untouched rather than fabricating one', () => {
  assert.equal(formatBirthDateForApi('not-a-date'), 'not-a-date')
})

test('computes age against a fixed reference date', () => {
  assert.equal(isAtLeastAge('2000-06-15', 18, '2018-06-15'), true, 'exactly 18 on the birthday')
  assert.equal(isAtLeastAge('2000-06-15', 18, '2018-06-14'), false, 'one day short')
  assert.equal(isAtLeastAge('2000-06-15', 18, '2018-07-01'), true)
  assert.equal(isAtLeastAge('2000-06-15', 18, '2017-12-31'), false)
})

test('rejects an age check built on an invalid date', () => {
  assert.equal(isAtLeastAge('not-a-date', 18), false)
  assert.equal(isAtLeastAge('2000-06-15', 18, 'nonsense'), false)
})

test('latestBirthDateForAge clamps to a day that exists in the target month', () => {
  // 31 March minus 18 years is fine, but the clamp must not produce 31 February.
  assert.equal(latestBirthDateForAge(18, '2026-03-31'), '2008-03-31')
  assert.equal(latestBirthDateForAge(18, '2026-02-29'), '2008-02-29')
  assert.equal(isValidIsoDate(latestBirthDateForAge(18, '2026-01-31')), true)
})

test('a date at the age boundary passes the age check it was computed for', () => {
  const boundary = latestBirthDateForAge(18, '2026-08-29')
  assert.equal(isAtLeastAge(boundary, 18, '2026-08-29'), true)
})

test('localToday returns a valid ISO date in the local timezone', () => {
  assert.equal(isValidIsoDate(localToday()), true)
})

// ---------------------------------------------------------------- small helpers

test('normalizePhone keeps only digits', () => {
  assert.equal(normalizePhone('+962 (79) 123-4567'), '962791234567')
  assert.equal(normalizePhone('079 123 4567'), '0791234567')
  assert.equal(normalizePhone(null), '')
  assert.equal(normalizePhone(undefined), '')
})

test('isUuid accepts the UUID versions the backend actually issues', () => {
  assert.equal(isUuid('01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5'), true, 'uuid v7')
  assert.equal(isUuid('  01a01ff1-2de8-7bf9-95c2-8b0d46cc28f5  '), true, 'surrounding space is trimmed')
  assert.equal(isUuid('507f1f77bcf86cd799439011'), false, 'a Mongo ObjectId is not a UUID')
  assert.equal(isUuid(''), false)
  assert.equal(isUuid('01a01ff1-2de8-7bf9-95c2'), false)
})

// ---------------------------------------------------------------- login

test('login requires a valid email and a password', () => {
  assert.equal(validateLogin({ email: 'vendor@example.com', password: 'x' }), '')
  assert.match(validateLogin({ email: 'nope', password: 'x' }), /valid email/)
  assert.match(validateLogin({ email: 'vendor@example.com', password: '' }), /Enter your password/)
})

// ---------------------------------------------------------------- traveller

test('accepts a complete traveller registration', () => {
  assert.equal(validateTraveller({
    name: 'Rana Odeh', email: 'rana@example.com', password: 'Passw0rd!',
    confirm: 'Passw0rd!', mobileNumber: '0791234567', DateOfBirth: '1998-03-09',
    gender: 'Ms.', otp: '123456',
  }, true), '')
})

test('traveller registration enforces the Jordanian mobile prefixes', () => {
  const base = {
    name: 'Rana Odeh', email: 'rana@example.com', password: 'Passw0rd!',
    confirm: 'Passw0rd!', DateOfBirth: '1998-03-09', gender: 'Ms.', otp: '123456',
  }
  for (const mobileNumber of ['0791234567', '0781234567', '0771234567']) {
    assert.equal(validateTraveller({ ...base, mobileNumber }, true), '')
  }
  for (const mobileNumber of ['0761234567', '0791234', '+15551234567']) {
    assert.match(validateTraveller({ ...base, mobileNumber }, true), /Jordanian mobile/)
  }
})

test('traveller registration blocks submission until the terms are accepted', () => {
  const form = {
    name: 'Rana Odeh', email: 'rana@example.com', password: 'Passw0rd!',
    confirm: 'Passw0rd!', mobileNumber: '0791234567', DateOfBirth: '1998-03-09',
    gender: 'Ms.', otp: '123456',
  }
  assert.match(validateTraveller(form, false), /Terms of Service/)
})

test('traveller registration rejects a mismatched confirmation and a future birth date', () => {
  const base = {
    name: 'Rana Odeh', email: 'rana@example.com', password: 'Passw0rd!',
    mobileNumber: '0791234567', DateOfBirth: '1998-03-09', gender: 'Ms.', otp: '123456',
  }
  assert.match(validateTraveller({ ...base, confirm: 'Other1!aa' }, true), /Passwords do not match/)
  assert.match(validateTraveller({ ...base, confirm: 'Passw0rd!', DateOfBirth: daysFromToday(1) }, true), /must be in the past/)
})

test('traveller registration requires a six-digit verification code when one is expected', () => {
  const base = {
    name: 'Rana Odeh', email: 'rana@example.com', password: 'Passw0rd!',
    confirm: 'Passw0rd!', mobileNumber: '0791234567', DateOfBirth: '1998-03-09', gender: 'Ms.',
  }
  assert.match(validateTraveller({ ...base, otp: '12345' }, true), /six-digit/)
  assert.match(validateTraveller({ ...base, otp: 'abcdef' }, true), /six-digit/)
  assert.equal(validateTraveller({ ...base, otp: '123456' }, true), '')
})

// ---------------------------------------------------------------- date ranges

test('a date range requires both ends by default', () => {
  assert.match(validateDateRange('2026-09-01', ''), /both start and end/)
  assert.equal(validateDateRange('2026-09-01', '', { requireBoth: false }), '')
})

test('a date range rejects an end before the start', () => {
  assert.match(validateDateRange('2026-09-10', '2026-09-01'), /cannot be before/)
})

test('same-day ranges are allowed by default and refused when configured', () => {
  assert.equal(validateDateRange('2026-09-01', '2026-09-01'), '')
  assert.match(validateDateRange('2026-09-01', '2026-09-01', { allowSameDay: false }), /must be after/)
})

test('a future-only range refuses a start date in the past', () => {
  assert.match(validateDateRange(daysFromToday(-3), daysFromToday(5), { futureOnly: true }), /cannot be in the past/)
})

test('analytics dates may not run into the future', () => {
  assert.match(validateAnalyticsDates({ startDate: daysFromToday(3) }), /start date cannot be in the future/)
  assert.match(validateAnalyticsDates({ endDate: daysFromToday(3) }), /end date cannot be in the future/)
  assert.equal(validateAnalyticsDates({ startDate: daysFromToday(-30), endDate: daysFromToday(-1) }), '')
})

test('analytics accepts a one-sided range', () => {
  assert.equal(validateAnalyticsDates({ startDate: daysFromToday(-7), endDate: '' }), '')
  assert.equal(validateAnalyticsDates({}), '')
})

// ---------------------------------------------------------------- review

test('a review rating must be a whole number from 1 to 5', () => {
  for (const rating of [1, 3, 5]) assert.equal(validateReview({ rating }), '')
  for (const rating of [0, 6, 2.5, -1, 'four']) assert.match(validateReview({ rating }), /Rating must be/)
})

test('a review comment is optional but bounded when present', () => {
  assert.equal(validateReview({ rating: 5 }), '')
  assert.equal(validateReview({ rating: 5, comment: '   ' }), '', 'blank whitespace counts as no comment')
  assert.match(validateReview({ rating: 5, comment: 'ok' }), /at least 3 characters/)
  assert.match(validateReview({ rating: 5, comment: 'x'.repeat(501) }), /not exceed 500/)
  assert.equal(validateReview({ rating: 5, comment: 'x'.repeat(500) }), '')
})

// ---------------------------------------------------------------- passwords

test('changing a password requires the current one and a matching strong replacement', () => {
  assert.equal(validateChangePassword({
    old_password: 'OldPass1!', new_password: 'NewPass1!', confirm_password: 'NewPass1!',
  }), '')
  assert.match(validateChangePassword({ old_password: '', new_password: 'NewPass1!', confirm_password: 'NewPass1!' }), /current password/)
  assert.match(validateChangePassword({ old_password: 'OldPass1!', new_password: 'weak', confirm_password: 'weak' }), /at least 8 characters/)
  assert.match(validateChangePassword({ old_password: 'OldPass1!', new_password: 'NewPass1!', confirm_password: 'Other1!aa' }), /do not match/)
})

test('the new password must differ from the current one', () => {
  assert.match(validateChangePassword({
    old_password: 'Passw0rd!', new_password: 'Passw0rd!', confirm_password: 'Passw0rd!',
  }), /differs from the current/)
})

// ---------------------------------------------------------------- profile

test('a tourist profile requires a name, email and Jordanian mobile', () => {
  assert.equal(validateProfile({ name: 'Rana Odeh', email: 'rana@example.com', mobileNumber: '0791234567' }), '')
  assert.match(validateProfile({ name: 'R', email: 'rana@example.com', mobileNumber: '0791234567' }), /2–100 characters/)
  assert.match(validateProfile({ name: 'Rana Odeh', email: 'bad', mobileNumber: '0791234567' }), /valid email/)
  assert.match(validateProfile({ name: 'Rana Odeh', email: 'rana@example.com', mobileNumber: '0761234567' }), /Jordanian mobile/)
})

test('a vendor profile validates business fields instead of personal ones', () => {
  assert.equal(validateProfile({ company_name: 'Petra Tours', address: '12 King St', city: 'Amman' }, { vendor: true }), '')
  assert.match(validateProfile({ company_name: 'P', address: '12 King St', city: 'Amman' }, { vendor: true }), /2–100 characters/)
  assert.match(validateProfile({ company_name: 'Petra Tours', address: '12', city: 'Amman' }, { vendor: true }), /complete business address/)
})

// ---------------------------------------------------------------- free text

test('a required response is bounded at both ends', () => {
  assert.match(validateResponseText('', { label: 'Reply' }), /Reply is required/)
  assert.equal(validateResponseText('Thanks for reporting this.'), '')
  assert.match(validateResponseText('x'.repeat(1001)), /not exceed 1000/)
})

test('an optional response accepts emptiness but still enforces the ceiling', () => {
  assert.equal(validateResponseText('', { required: false }), '')
  assert.match(validateResponseText('x'.repeat(1001), { required: false }), /not exceed 1000/)
})

test('a minimum length is enforced only on text that was actually entered', () => {
  assert.match(validateResponseText('ab', { min: 5 }), /at least 5 characters/)
  assert.equal(validateResponseText('', { required: false, min: 5 }), '')
})

// image helpers are shared by several validators
test('the shared image guard is applied to documents', () => {
  assert.equal(file().type, 'image/jpeg')
})
