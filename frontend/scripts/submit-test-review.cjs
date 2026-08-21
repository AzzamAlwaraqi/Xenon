// Submits a traveller review through the protected API for a completed local test booking.
const path = require('path')
const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })
const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const User = require(path.join(backendRoot, 'src/Models/UserModel'))

const databaseUri = process.env.DATABASE.includes('<PASSWORD>') ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) : process.env.DATABASE
const bookingId = process.argv[2]

async function run() {
  if (!bookingId) throw new Error('Provide a booking UUID.')
  await mongoose.connect(databaseUri)
  const traveller = await User.findOne({ email: 'traveller.test@example.com' })
  const response = await fetch('http://127.0.0.1:3000/api/v1/reviews/createReview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${traveller.getJwtToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ booking_id: bookingId, rating: 4, comment: 'TEST REVIEW — Excellent Petra experience with clear communication and a memorable local guide.' }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.message || `Review request failed (${response.status})`)
  console.log(JSON.stringify({ status: body.status, reviewId: body.data?.data?.data?.id || body.data?.data?.id || body.data?.id || null }))
  await mongoose.disconnect()
}
run().catch(async (error) => { console.error(error.message); await mongoose.disconnect().catch(() => {}); process.exitCode = 1 })
