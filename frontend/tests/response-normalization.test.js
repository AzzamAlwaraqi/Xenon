import test from 'node:test'
import assert from 'node:assert/strict'

import { getCollection, getPackageImage, getRecord } from '../src/utils/vendorData.js'

test('normalizes direct and paginated API collections', () => {
  const records = [{ id: 'one' }]

  assert.deepEqual(getCollection({ data: records }), records)
  assert.deepEqual(getCollection({ data: { data: records, pagination: { currentPage: 1 } } }), records)
  assert.deepEqual(getCollection({ data: { notifications: records } }), records)
})

test('normalizes named and nested API records', () => {
  const record = { id: 'one' }

  assert.deepEqual(getRecord({ data: { package: record } }), record)
  assert.deepEqual(getRecord({ data: { data: record } }), record)
  assert.deepEqual(getRecord({ data: { profile: record } }), record)
})

test('reads Cloudinary package images from API image objects', () => {
  assert.equal(
    getPackageImage({ images: [{ url: 'https://res.cloudinary.com/xenon/package.webp' }] }),
    'https://res.cloudinary.com/xenon/package.webp',
  )
  assert.equal(getPackageImage({ image: 'fallback.jpg' }), 'fallback.jpg')
})
