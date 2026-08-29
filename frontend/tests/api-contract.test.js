import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const apiSource = await readFile(new URL('../src/services/api.js', import.meta.url), 'utf8')

test('uses the final backend vendor reply routes', () => {
  assert.match(apiSource, /\/reviews\/reply\/\$\{reviewId\}/)
  assert.match(apiSource, /\/complaints\/respondToComplaint\/\$\{complaintId\}/)
  assert.doesNotMatch(apiSource, /\/complaints\/\$\{complaintId\}\/reply/)
})

test('uploads payment records as multipart form data', () => {
  assert.match(apiSource, /createBookingPayment:[\s\S]*body: toFormData\(data\)/)
  assert.match(apiSource, /createSubscription:[\s\S]*body: toFormData\(data\)/)
})
