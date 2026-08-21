// Local fallback for demonstrating a marked test review when the moderation API fails on UUID conversion.
const path = require('path')
const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })
const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const Review = require(path.join(backendRoot, 'src/Models/ReviewModel'))
const databaseUri = process.env.DATABASE.includes('<PASSWORD>') ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) : process.env.DATABASE

async function run() {
  await mongoose.connect(databaseUri)
  const review = await Review.findOneAndUpdate(
    { review_text: { $regex: '^TEST REVIEW — Excellent Petra experience' } },
    { review_status: 'accepted' },
    { new: true },
  )
  if (!review) throw new Error('Marked test review was not found.')
  console.log(JSON.stringify({ reviewId: review.id, status: review.review_status }))
  await mongoose.disconnect()
}
run().catch(async (error) => { console.error(error.message); await mongoose.disconnect().catch(() => {}); process.exitCode = 1 })
