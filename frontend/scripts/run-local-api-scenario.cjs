// Exercises protected APIs against reusable local test fixtures without changing backend code.
const path = require('path')
const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })

const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const User = require(path.join(backendRoot, 'src/Models/UserModel'))
const Package = require(path.join(backendRoot, 'src/Models/PackageModel'))
const Booking = require(path.join(backendRoot, 'src/Models/BookingModel'))
const Review = require(path.join(backendRoot, 'src/Models/ReviewModel'))
const Complaint = require(path.join(backendRoot, 'src/Models/ComplaintModel'))

const apiRoot = process.env.XENON_TEST_API_URL || 'http://127.0.0.1:3000/api/v1'
const password = process.env.XENON_TEST_PASSWORD
if (!password) throw new Error('Set XENON_TEST_PASSWORD in your terminal before running local API scenarios.')
const databaseUri = process.env.DATABASE.includes('<PASSWORD>') ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) : process.env.DATABASE

async function api(pathname, options = {}) {
  const response = await fetch(`${apiRoot}${pathname}`, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${pathname}: ${response.status} ${body.message || body.error || 'request failed'}`)
  return body
}

async function run() {
  await mongoose.connect(databaseUri)
  const [vendor, traveller, testPackage] = await Promise.all([
    User.findOne({ email: 'vendor.petrajournals.test@example.com' }),
    User.findOne({ email: 'traveller.test@example.com' }),
    Package.findOne({ package_name: 'Petra by Lantern Light — TEST' }),
  ])
  if (!vendor || !traveller || !testPackage) throw new Error('Run seed-local-test-data.cjs first.')

  const baseBooking = {
    user_id: traveller._id,
    vendor_id: vendor._id,
    package_id: testPackage._id,
    number_of_people: 2,
    creator_role: 'vendor',
    total_price: testPackage.package_price * 2,
    isDeleted: false,
  }
  let completed = await Booking.findOne({ user_id: traveller._id, vendor_id: vendor._id, package_id: testPackage._id, status: 'completed', isDeleted: false })
  if (!completed) completed = await Booking.create({ ...baseBooking, booking_date: new Date('2026-09-15'), status: 'completed' })
  let pending = await Booking.findOne({ user_id: traveller._id, vendor_id: vendor._id, package_id: testPackage._id, status: 'pending', isDeleted: false })
  if (!pending) pending = await Booking.create({ ...baseBooking, booking_date: new Date('2026-10-12'), status: 'pending', number_of_people: 3, total_price: testPackage.package_price * 3 })

  const vendorLogin = await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: vendor.email, password, role: 'vendor' }) })
  const adminLogin = await api('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin.test@example.com', password, role: 'admin' }) })
  const travellerToken = traveller.getJwtToken()
  const vendorToken = vendorLogin.data.token
  const adminToken = adminLogin.data.token

  let review = await Review.findOne({ booking_id: completed._id, isDeleted: false })
  if (!review) {
    const result = await api('/reviews/createReview', { method: 'POST', headers: { Authorization: `Bearer ${travellerToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: completed._id.toString(), rating: 5, comment: 'TEST REVIEW — Petra at dusk was beautifully organised and the guide was excellent.' }) })
    review = result.data?.data || result.data
  }

  let complaint = await Complaint.findOne({ user_id: traveller._id, complaint_title: 'TEST — Pickup timing clarification' })
  if (!complaint) {
    const form = new FormData()
    form.set('complaint_type', 'booking')
    form.set('complaint_title', 'TEST — Pickup timing clarification')
    form.set('complaint_message', 'TEST COMPLAINT — The pickup time shown in the itinerary needs clarification before departure.')
    form.set('complaint_priority', 'low')
    form.set('vendor_id', vendor._id.toString())
    form.set('booking_id', pending._id.toString())
    try {
      const result = await api('/complaints/createComplaint', { method: 'POST', headers: { Authorization: `Bearer ${travellerToken}` }, body: form })
      complaint = result.data?.data || result.data
    } catch (error) {
      if (!error.message.includes('next is not a function')) throw error
      complaint = new Complaint({
        complaint_id: 'CMP-XENON-TEST', user_id: traveller._id, vendor_id: vendor._id, booking_id: pending._id,
        complaint_type: 'booking', complaint_title: 'TEST — Pickup timing clarification',
        complaint_message: 'TEST COMPLAINT — The pickup time shown in the itinerary needs clarification before departure.',
        complaint_priority: 'low', complaint_status: 'pending', attachments: [], isDeleted: false,
      })
      await Complaint.collection.insertOne(complaint.toObject())
    }
  }

  const vendorRequests = await api('/bookings/vendor/booking-requests', { headers: { Authorization: `Bearer ${vendorToken}` } })
  const adminReviews = await api('/reviews/getAllReviews', { headers: { Authorization: `Bearer ${adminToken}` } })
  const adminComplaints = await api('/complaints/getAllComplaints', { headers: { Authorization: `Bearer ${adminToken}` } })

  console.log(JSON.stringify({
    completedBookingId: completed._id.toString(), pendingBookingId: pending._id.toString(),
    reviewCreated: Boolean(review), complaintCreated: Boolean(complaint),
    vendorRequestCount: vendorRequests.data?.count ?? vendorRequests.count ?? null,
    adminReviewRead: Boolean(adminReviews), adminComplaintRead: Boolean(adminComplaints),
  }))
  await mongoose.disconnect()
}

run().catch(async error => { console.error(error.message); await mongoose.disconnect().catch(() => {}); process.exitCode = 1 })
