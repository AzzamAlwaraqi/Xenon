import assert from 'node:assert/strict'
import test from 'node:test'

import { formatCurrency, formatNumber, labelize, toNumber } from '../src/utils/analyticsData.js'
import {
  getBookingId,
  getBookingPackage,
  getBookingTraveller,
  getCollection,
  getId,
  getPackageId,
  getPackageImage,
  getRecord,
} from '../src/utils/vendorData.js'
import { canResumeVendorOnboarding, createVendorOnboardingDraft, VENDOR_ONBOARDING_KEY } from '../src/utils/vendorOnboarding.js'

// ---------------------------------------------------------------- number formatting

test('coerces anything unusable to zero rather than showing NaN to a vendor', () => {
  assert.equal(toNumber(42), 42)
  assert.equal(toNumber('42.5'), 42.5)
  assert.equal(toNumber(null), 0)
  assert.equal(toNumber(undefined), 0)
  assert.equal(toNumber('abc'), 0)
  assert.equal(toNumber(Infinity), 0)
  assert.equal(toNumber(NaN), 0)
  assert.equal(toNumber({}), 0)
})

test('money is labelled in Jordanian dinars and capped at two decimals', () => {
  assert.match(formatCurrency(1250.5), /^JOD /)
  assert.ok(formatCurrency(1250.5).includes('1,250.5'))
  assert.ok(formatCurrency(0.129).endsWith('0.13'), 'rounds to two decimals')
})

test('a missing revenue figure renders as JOD 0, never as JOD NaN', () => {
  assert.equal(formatCurrency(undefined), 'JOD 0')
  assert.equal(formatCurrency('not a number'), 'JOD 0')
})

test('counts are thousands-separated', () => {
  assert.ok(formatNumber(1234567).includes('1,234,567'))
  assert.equal(formatNumber(null), '0')
})

test('labelize turns API keys into readable headings', () => {
  assert.equal(labelize('package_type'), 'Package Type')
  assert.equal(labelize('totalRevenue'), 'Total Revenue')
  assert.equal(labelize('adventure'), 'Adventure')
  assert.equal(labelize('pending_payment'), 'Pending Payment')
})

test('labelize falls back to "Other" for a missing bucket name', () => {
  assert.equal(labelize(''), 'Other')
  assert.equal(labelize(null), 'Other')
  assert.equal(labelize(undefined), 'Other')
})

// ---------------------------------------------------------------- collection shapes

test('unwraps every collection shape the API returns', () => {
  const rows = [{ id: 'one' }]
  assert.deepEqual(getCollection(rows), rows, 'a bare array')
  assert.deepEqual(getCollection({ data: rows }), rows, 'data as an array')
  assert.deepEqual(getCollection({ data: { data: rows } }), rows, 'paginated')
  for (const key of ['packages', 'bookings', 'notifications', 'complaints', 'reviews', 'payments', 'employees', 'results']) {
    assert.deepEqual(getCollection({ data: { [key]: rows } }), rows, `named collection: ${key}`)
  }
})

test('an unrecognised or empty payload yields an empty list, never null', () => {
  for (const payload of [null, undefined, {}, { data: {} }, { data: null }, 'oops']) {
    assert.deepEqual(getCollection(payload), [], `payload ${JSON.stringify(payload)} must render as an empty table`)
  }
})

test('a paginated envelope is preferred over the wrapper object', () => {
  const rows = [{ id: 'one' }]
  const payload = { data: { data: rows, pagination: { currentPage: 2, hasNextPage: true } } }
  assert.deepEqual(getCollection(payload), rows)
})

test('unwraps every single-record shape the API returns', () => {
  const record = { id: 'one' }
  for (const key of ['package', 'booking', 'user', 'vendor', 'profile', 'data']) {
    assert.deepEqual(getRecord({ data: { [key]: record } }), record, `named record: ${key}`)
  }
  assert.deepEqual(getRecord({ data: record }), record)
  assert.deepEqual(getRecord(record), record)
})

test('a missing record yields an empty object so pages can render safely', () => {
  assert.deepEqual(getRecord(null), {})
  assert.deepEqual(getRecord(undefined), {})
})

// ---------------------------------------------------------------- identifiers

test('resolves an identifier across every naming convention in the API', () => {
  assert.equal(getPackageId({ _id: 'a' }), 'a')
  assert.equal(getPackageId({ id: 'b' }), 'b')
  assert.equal(getPackageId({ package_id: 'c' }), 'c')
  assert.equal(getBookingId({ booking_id: 'd' }), 'd')
  assert.equal(getId({ employee_id: 'e' }), 'e')
  assert.equal(getId({ notification_id: 'f' }), 'f')
  assert.equal(getId({ complaint_id: 'g' }), 'g')
  assert.equal(getId({ report_id: 'h' }), 'h')
})

test('_id wins when a record carries more than one identifier', () => {
  assert.equal(getPackageId({ _id: 'canonical', id: 'legacy', package_id: 'older' }), 'canonical')
})

test('an identifier lookup on an absent record does not throw', () => {
  assert.equal(getPackageId(undefined), undefined)
  assert.equal(getId(null), undefined)
})

// ---------------------------------------------------------------- display fallbacks

test('reads a package cover image from every response shape', () => {
  assert.equal(getPackageImage({ images: [{ url: 'https://cdn/a.webp' }] }), 'https://cdn/a.webp')
  assert.equal(getPackageImage({ image: { url: 'https://cdn/b.webp' } }), 'https://cdn/b.webp')
  assert.equal(getPackageImage({ image: 'c.jpg' }), 'c.jpg')
})

test('a package with no image yields an empty string, not undefined', () => {
  assert.equal(getPackageImage({}), '')
  assert.equal(getPackageImage({ images: [] }), '')
  assert.equal(getPackageImage(null), '')
})

test('a booking row always shows a traveller and a package name', () => {
  assert.equal(getBookingTraveller({ user_id: { name: 'Rana' } }), 'Rana')
  assert.equal(getBookingTraveller({ user: { name: 'Omar' } }), 'Omar')
  assert.equal(getBookingTraveller({ client: { name: 'Lina' } }), 'Lina')
  assert.equal(getBookingTraveller({ name: 'Sara' }), 'Sara')
  assert.equal(getBookingTraveller({}), 'Traveller', 'never renders "undefined" in the table')

  assert.equal(getBookingPackage({ package_id: { package_name: 'Petra Day' } }), 'Petra Day')
  assert.equal(getBookingPackage({ package: { package_name: 'Wadi Rum' } }), 'Wadi Rum')
  assert.equal(getBookingPackage({ package_name: 'Aqaba' }), 'Aqaba')
  assert.equal(getBookingPackage({}), 'Package')
})

// ---------------------------------------------------------------- vendor onboarding

test('the onboarding draft keeps only the safe, re-enterable fields', () => {
  const draft = createVendorOnboardingDraft({
    name: 'Rana', email: 'rana@example.com', DateOfBirth: '1998-03-09', gender: 'female',
    mobileNumber: '0791234567', company_name: 'Petra Tours', address: '12 King St',
    city: 'Amman', iban_number: 'JO94CBJO0010000000000131000302',
    password: 'Passw0rd!', confirm: 'Passw0rd!', otp: '123456',
  })
  assert.equal(draft.accountCreated, true)
  assert.equal(draft.company_name, 'Petra Tours')
  assert.equal(draft.password, undefined, 'a password must never reach browser storage')
  assert.equal(draft.confirm, undefined)
  assert.equal(draft.otp, undefined, 'a verification code must never be persisted')
})

test('the draft stores every safe field as a string, even when missing', () => {
  const draft = createVendorOnboardingDraft({})
  assert.equal(draft.company_name, '')
  assert.equal(draft.iban_number, '')
})

test('onboarding resumes only for a signed-in, unexpired tourist with a draft', () => {
  const draft = { accountCreated: true }
  assert.equal(canResumeVendorOnboarding({ draft, token: 'abc', role: 'user' }), true)
})

test('onboarding does not resume without a draft, token, or the tourist role', () => {
  assert.equal(canResumeVendorOnboarding({ draft: null, token: 'abc', role: 'user' }), false)
  assert.equal(canResumeVendorOnboarding({ draft: { accountCreated: true }, token: '', role: 'user' }), false)
  assert.equal(canResumeVendorOnboarding({ draft: { accountCreated: true }, token: 'abc', role: 'vendor' }), false)
  assert.equal(canResumeVendorOnboarding({ draft: { accountCreated: false }, token: 'abc', role: 'user' }), false)
})

test('an expired session never resumes onboarding', () => {
  assert.equal(canResumeVendorOnboarding({
    draft: { accountCreated: true }, token: 'abc', role: 'user', expired: true,
  }), false)
})

test('the onboarding draft has its own namespaced storage key', () => {
  assert.equal(VENDOR_ONBOARDING_KEY, 'xenon_vendor_onboarding')
  assert.ok(VENDOR_ONBOARDING_KEY.startsWith('xenon_'))
})
