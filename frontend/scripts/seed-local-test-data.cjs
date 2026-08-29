// Local-only demo fixture generator. Never point this script at Atlas.
const path = require('path')

const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })

const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const User = require(path.join(backendRoot, 'src/Models/UserModel'))
const Vendor = require(path.join(backendRoot, 'src/Models/VendorModel'))
const VendorVerification = require(path.join(backendRoot, 'src/Models/VendorVerificationModel'))
const Package = require(path.join(backendRoot, 'src/Models/PackageModel'))
const PackageDetails = require(path.join(backendRoot, 'src/Models/packageDetailsModels'))
const Booking = require(path.join(backendRoot, 'src/Models/BookingModel'))
const Review = require(path.join(backendRoot, 'src/Models/ReviewModel'))
const Complaint = require(path.join(backendRoot, 'src/Models/ComplaintModel'))
const Employee = require(path.join(backendRoot, 'src/Models/EmployeeModels'))
const BookingPayment = require(path.join(backendRoot, 'src/Models/BookingPaymentModels'))
const VendorSubscription = require(path.join(backendRoot, 'src/Models/VendorSubscriptionModels'))
const Notification = require(path.join(backendRoot, 'src/Models/NotificationModel'))
const Report = require(path.join(backendRoot, 'src/Models/ReportsModels'))

const password = process.env.XENON_TEST_PASSWORD
const databaseUri = process.env.XENON_TEST_DATABASE || process.env.DATABASE_LOCAL || 'mongodb://127.0.0.1:27017/Xenon'
if (!password) throw new Error('Set XENON_TEST_PASSWORD before generating demo fixtures.')
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(databaseUri)) {
  throw new Error(`Refusing to seed a non-local database: ${databaseUri.replace(/:\/\/.*@/, '://***@')}`)
}

const image = (name, url) => ({ url, public_id: `xenon-local-demo-${name}` })

async function upsertUser(details) {
  let user = await User.findOne({ email: details.email })
  if (!user) user = new User(details)
  Object.assign(user, details, { password, isActive: true, isEmailVerified: true, isDelete: false })
  await user.save()
  return user
}

async function upsertVendor(owner, details) {
  return Vendor.findOneAndUpdate(
    { vendor_owner_id: owner._id },
    { ...details, vendor_owner_id: owner._id, vendor_user_id: owner._id, vendor_email: owner.email, vendor_phone: owner.mobileNumber, isDelete: false },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )
}

async function upsertPackage(vendor, details) {
  let packageRecord = await Package.findOne({ vendor_id: vendor._id, package_name: details.package_name })
  if (!packageRecord) packageRecord = new Package({ vendor_id: vendor._id, package_name: details.package_name })
  Object.assign(packageRecord, details, { vendor_id: vendor._id, deletionRequestedAt: null })
  await packageRecord.save()
  return packageRecord
}

async function upsertBooking(query, details) {
  return Booking.findOneAndUpdate(query, { ...details, deletionRequestedAt: null }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true })
}

async function seed() {
  await mongoose.connect(databaseUri)

  const emailMigrations = [
    ['vendor.demo@xenon.test', 'vendor.demo@example.com'],
    ['vendor.pending@xenon.test', 'vendor.pending@example.com'],
    ['vendor.rejected@xenon.test', 'vendor.rejected@example.com'],
    ['traveller.demo@xenon.test', 'traveller.demo@example.com'],
    ['traveller.two@xenon.test', 'traveller.two@example.com'],
    ['admin.demo@xenon.test', 'admin.demo@example.com'],
    ['admin.operations@xenon.test', 'admin.operations@example.com'],
    ['admin.moderation@xenon.test', 'admin.moderation@example.com'],
    ['guide.demo@xenon.test', 'guide.demo@example.com'],
    ['driver.demo@xenon.test', 'driver.demo@example.com'],
  ]
  for (const [oldEmail, newEmail] of emailMigrations) {
    await User.collection.updateOne({ email: oldEmail }, { $set: { email: newEmail } })
  }

  const [mainOwner, pendingOwner, rejectedOwner, traveller, travellerTwo, admin, operationsAdmin, moderationAdmin] = await Promise.all([
    upsertUser({ name: 'Omar Petra Journals', email: 'vendor.demo@example.com', mobileNumber: '0799100001', role: 'vendor' }),
    upsertUser({ name: 'Dana Wadi Rum Camp', email: 'vendor.pending@example.com', mobileNumber: '0799100002', role: 'user', gender: 'female', DateOfBirth: new Date('1994-04-18') }),
    upsertUser({ name: 'Laith Dead Sea Retreat', email: 'vendor.rejected@example.com', mobileNumber: '0799100003', role: 'user', gender: 'male', DateOfBirth: new Date('1990-09-12') }),
    upsertUser({ name: 'Lina Haddad', email: 'traveller.demo@example.com', mobileNumber: '0799100010', role: 'user', gender: 'female', DateOfBirth: new Date('1996-05-18') }),
    upsertUser({ name: 'Yazan Nasser', email: 'traveller.two@example.com', mobileNumber: '0799100011', role: 'user', gender: 'male', DateOfBirth: new Date('1992-02-11') }),
    upsertUser({ name: 'Azzam Xenon Administrator', email: 'admin.demo@example.com', mobileNumber: '0799100020', role: 'admin' }),
    upsertUser({ name: 'Nour Operations Admin', email: 'admin.operations@example.com', mobileNumber: '0799100021', role: 'admin' }),
    upsertUser({ name: 'Sami Moderation Admin', email: 'admin.moderation@example.com', mobileNumber: '0799100022', role: 'admin' }),
  ])

  const [mainVendor, pendingVendor, rejectedVendor] = await Promise.all([
    upsertVendor(mainOwner, { vendor_company: 'Petra Journals Experiences', vendor_address: 'Tourism Street', vendor_city: 'Wadi Musa', vendor_state: 'Ma\'an', vendor_pincode: '71810', vendor_country: 'Jordan', vendor_type: 'Tour Operator', vendor_status: 'active' }),
    upsertVendor(pendingOwner, { vendor_company: 'Wadi Rum Starlight Camp', vendor_address: 'Disah Road', vendor_city: 'Wadi Rum', vendor_state: 'Aqaba', vendor_pincode: '77110', vendor_country: 'Jordan', vendor_type: 'Boutique Camp', vendor_status: 'pending_approval' }),
    upsertVendor(rejectedOwner, { vendor_company: 'Dead Sea Quiet Retreat', vendor_address: 'Sweimeh Road', vendor_city: 'Sweimeh', vendor_state: 'Balqa', vendor_pincode: '18186', vendor_country: 'Jordan', vendor_type: 'Wellness Retreat', vendor_status: 'rejected', rejectionReason: 'Demo record: missing renewed vocational licence.' }),
  ])

  const documentImage = image('verification', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c')
  await VendorVerification.findOneAndUpdate(
    { vendor_id: pendingVendor._id },
    { vendor_id: pendingVendor._id, commercial_register_image: documentImage, vocational_license_image: documentImage, tourism_license_image: documentImage, owner_id_image: documentImage, iban_letter_image: documentImage, iban_number: `JO${'1'.repeat(28)}` },
    { upsert: true, new: true, runValidators: true },
  )

  const packageDefinitions = [
    { package_name: 'Petra by Lantern Light', package_description: 'A slow-paced evening journey through Petra with local storytelling and a traditional dinner.', package_price: 145, startDate: new Date('2026-09-01'), endDate: new Date('2026-12-20'), images: [image('petra', 'https://images.unsplash.com/photo-1548786811-dd6e453ccca7')], tags: ['petra', 'cultural', 'evening'], package_type: 'cultural', package_status: 'active', max_people: 20, available_seats: 12, ratingsAverage: 4.8, ratingsQuantity: 18 },
    { package_name: 'Wadi Rum Desert Astronomy', package_description: 'Sunset jeep exploration, Bedouin hospitality, and guided stargazing under the desert sky.', package_price: 95, startDate: new Date('2026-09-10'), endDate: new Date('2027-03-30'), images: [image('wadi-rum', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e')], tags: ['wadi-rum', 'adventure', 'stars'], package_type: 'adventure', package_status: 'active', max_people: 16, available_seats: 7, ratingsAverage: 4.6, ratingsQuantity: 11 },
    { package_name: 'Ajloun Forest Table', package_description: 'A family-friendly forest walk followed by a seasonal farm-to-table lunch in Ajloun.', package_price: 55, startDate: new Date('2026-09-05'), endDate: new Date('2026-11-15'), images: [image('ajloun', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470')], tags: ['ajloun', 'family', 'food'], package_type: 'family', package_status: 'inactive', max_people: 24, available_seats: 24, ratingsAverage: 4.3, ratingsQuantity: 7 },
  ]
  const packages = []
  for (const definition of packageDefinitions) packages.push(await upsertPackage(mainVendor, definition))

  const details = [
    { package_id: packages[0]._id, itinerary: [{ day_number: 1, title: 'The Siq and Treasury', activities: 'Private guided walk, tea with a local host, and lantern-lit dinner.' }], included_services: [{ title: 'Local guide', description: 'Licensed English-speaking guide' }, { title: 'Dinner', description: 'Traditional Jordanian menu' }], excluded_services: [{ title: 'Personal purchases', description: 'Souvenirs and optional gratuities' }], meeting_point: 'Petra Visitor Centre', location_coordinates: { lat: 30.3285, lng: 35.4444 }, cancellation_policy: 'Free cancellation up to 48 hours before departure.', important_notes: 'Comfortable walking shoes are recommended.' },
    { package_id: packages[1]._id, itinerary: [{ day_number: 1, title: 'Desert sunset', activities: 'Jeep tour, sunset viewpoint, dinner, and astronomy session.' }], included_services: [{ title: 'Jeep tour', description: 'Four-hour guided desert route' }], excluded_services: [{ title: 'Hotel transfer', description: 'Available on request' }], meeting_point: 'Wadi Rum Visitor Centre', location_coordinates: { lat: 29.576, lng: 35.419 }, cancellation_policy: 'Free cancellation up to 72 hours before departure.' },
    { package_id: packages[2]._id, itinerary: [{ day_number: 1, title: 'Forest and farm', activities: 'Guided nature trail and seasonal lunch.' }], included_services: [{ title: 'Lunch', description: 'Seasonal local menu' }], excluded_services: [{ title: 'Transport', description: 'Meet at Ajloun Forest Reserve' }], meeting_point: 'Ajloun Forest Reserve reception', location_coordinates: { lat: 32.3407, lng: 35.752 }, cancellation_policy: 'Free cancellation up to 24 hours before departure.' },
  ]
  for (const entry of details) await PackageDetails.findOneAndUpdate({ package_id: entry.package_id }, entry, { upsert: true, new: true, runValidators: true })

  const bookingSpecs = [
    [traveller, packages[0], 'completed', new Date('2026-09-15'), 2],
    [travellerTwo, packages[0], 'pending', new Date('2026-10-12'), 3],
    [traveller, packages[1], 'accepted', new Date('2026-11-02'), 2],
    [travellerTwo, packages[1], 'pending_payment', new Date('2026-11-18'), 1],
    [traveller, packages[2], 'cancelled', new Date('2026-10-05'), 4],
    [travellerTwo, packages[2], 'rejected', new Date('2026-10-20'), 2],
  ]
  const bookings = []
  for (const [user, pkg, status, bookingDate, people] of bookingSpecs) {
    bookings.push(await upsertBooking(
      { user_id: user._id, package_id: pkg._id, status },
      { user_id: user._id, vendor_id: mainVendor._id, package_id: pkg._id, booking_date: bookingDate, number_of_people: people, creator_role: 'user', booked_by: user._id, booking_source: 'CustomerApp', status, total_price: pkg.package_price * people, status_history: [{ status, changed_by: mainOwner._id, changed_at: new Date() }] },
    ))
  }

  const reviews = [
    { booking_id: bookings[0]._id, user_id: traveller._id, package_id: packages[0]._id, review_text: 'The lantern walk felt personal and beautifully organised. Our guide made Petra come alive.', review_rating: 5, review_status: 'accepted', vendor_reply: 'Thank you, Lina. We are delighted the evening felt special.', vendor_replied_at: new Date() },
    { booking_id: bookings[2]._id, user_id: traveller._id, package_id: packages[1]._id, review_text: 'The stargazing explanation was excellent and the camp dinner was memorable.', review_rating: 4, review_status: 'in-progress', vendor_reply: null },
  ]
  for (const review of reviews) await Review.findOneAndUpdate({ booking_id: review.booking_id }, { ...review, vendor_id: mainVendor._id, deletionRequestedAt: null }, { upsert: true, new: true, runValidators: true })

  const complaints = [
    { complaint_id: 'CMP-DEMO-001', user_id: travellerTwo._id, vendor_id: mainVendor._id, booking_id: bookings[1]._id, complaint_type: 'booking', complaint_title: 'Pickup timing clarification', complaint_message: 'The itinerary and confirmation show different pickup times.', complaint_priority: 'medium', complaint_status: 'pending', attachments: [] },
    { complaint_id: 'CMP-DEMO-002', user_id: traveller._id, vendor_id: mainVendor._id, booking_id: bookings[2]._id, complaint_type: 'service', complaint_title: 'Dietary request follow-up', complaint_message: 'Please confirm the vegetarian meal request before departure.', complaint_priority: 'low', complaint_status: 'accepted', admin_response: 'The vendor has confirmed the dietary request.', reply: 'Vegetarian meals are confirmed for your booking.', attachments: [] },
  ]
  for (const complaint of complaints) await Complaint.findOneAndUpdate({ complaint_id: complaint.complaint_id }, complaint, { upsert: true, new: true, runValidators: true })

  const staffUsers = await Promise.all([
    upsertUser({ name: 'Maya Demo Guide', email: 'guide.demo@example.com', mobileNumber: '0799100030', role: 'user', gender: 'female', DateOfBirth: new Date('1995-03-10') }),
    upsertUser({ name: 'Tareq Demo Driver', email: 'driver.demo@example.com', mobileNumber: '0799100031', role: 'user', gender: 'male', DateOfBirth: new Date('1988-08-21') }),
  ])
  await Employee.findOneAndUpdate({ user_id: staffUsers[0]._id, vendor_id: mainVendor._id }, { user_id: staffUsers[0]._id, vendor_id: mainVendor._id, workSystem: 'full-time', salary: 850, allowances: 75, position: 'tour-guide', job_active: true }, { upsert: true, new: true, runValidators: true })
  await Employee.findOneAndUpdate({ user_id: staffUsers[1]._id, vendor_id: mainVendor._id }, { user_id: staffUsers[1]._id, vendor_id: mainVendor._id, workSystem: 'part-time', hourOfWork: 6, allowances: 40, position: 'driver', job_active: true }, { upsert: true, new: true, runValidators: true })
  await Employee.findOneAndUpdate({ user_id: operationsAdmin._id }, { user_id: operationsAdmin._id, workSystem: 'full-time', salary: 1200, allowances: 120, position: 'manager', job_active: true }, { upsert: true, new: true, runValidators: true })
  await Employee.findOneAndUpdate({ user_id: moderationAdmin._id }, { user_id: moderationAdmin._id, workSystem: 'full-time', salary: 1050, allowances: 90, position: 'customer-support', job_active: true }, { upsert: true, new: true, runValidators: true })

  await BookingPayment.findOneAndUpdate({ booking_id: bookings[0]._id }, { user_id: traveller._id, vendor_id: mainVendor._id, booking_id: bookings[0]._id, amount: bookings[0].total_price, currency: 'JOD', payment_method: 'OnlineGateway', payment_status: 'Verified', transaction_id: 'DEMO-TXN-001', payment_description: 'Paid online for Petra by Lantern Light', verified_by: admin._id, verified_at: new Date(), payment_metadata: { demo: true } }, { upsert: true, new: true, runValidators: true })
  await BookingPayment.findOneAndUpdate({ booking_id: bookings[3]._id }, { user_id: travellerTwo._id, vendor_id: mainVendor._id, booking_id: bookings[3]._id, amount: bookings[3].total_price, currency: 'JOD', payment_method: 'ManualBankTransfer', payment_status: 'Pending', payment_description: 'Manual transfer awaiting verification', payment_metadata: { demo: true } }, { upsert: true, new: true, runValidators: true })
  await VendorSubscription.findOneAndUpdate({ vendor_id: mainVendor._id }, { vendor_id: mainVendor._id, amount: 240, currency: 'JOD', payment_method: 'OnlineGateway', payment_status: 'Verified', subscription_start_date: new Date('2026-01-01'), subscription_end_date: new Date('2026-12-31'), subscription_status: 'Active', transaction_id: 'DEMO-SUB-001', verified_by: admin._id, verified_at: new Date(), payment_metadata: { plan: 'Premium Demo' } }, { upsert: true, new: true, runValidators: true })

  const reportSpecs = [
    { report_id: 'REP-DEMO-001', reporter: travellerTwo._id, reported_user: mainOwner._id, content_type: 'Package', content_id: packages[2]._id, reason: 'other', description: 'Demo report requesting clarification of the seasonal availability.', status: 'pending' },
    { report_id: 'REP-DEMO-002', reporter: traveller._id, reported_user: mainOwner._id, content_type: 'Package', content_id: packages[0]._id, reason: 'inappropriate_content', description: 'Demo resolved report used to show moderation history.', status: 'resolved', action_taken: 'dismiss', resolved_by: admin._id, admin_notes: 'Content reviewed and found compliant.' },
  ]
  for (const report of reportSpecs) await Report.findOneAndUpdate({ report_id: report.report_id }, report, { upsert: true, new: true, runValidators: true })

  const notifications = [
    { user_id: mainOwner._id, vendor_id: mainVendor._id, admin_id: admin._id, title: 'New booking request', notification_type: 'booking', notification_message: 'A new three-person booking request is awaiting your review.', is_read: false },
    { user_id: mainOwner._id, vendor_id: mainVendor._id, admin_id: admin._id, title: 'Subscription active', notification_type: 'system_alert', notification_message: 'Your Premium Demo subscription is active through December 2026.', is_read: true },
    { user_id: traveller._id, vendor_id: mainVendor._id, admin_id: admin._id, title: 'Booking accepted', notification_type: 'update', notification_message: 'Your Wadi Rum Desert Astronomy booking was accepted.', is_read: false },
  ]
  for (const note of notifications) {
    const record = new Notification(note)
    await record.validate()
    const values = record.toObject()
    const recordId = values._id
    delete values._id
    await Notification.collection.updateOne(
      { user_id: note.user_id, title: note.title },
      { $set: { ...values, updatedAt: new Date() }, $setOnInsert: { _id: recordId, createdAt: new Date() } },
      { upsert: true },
    )
  }

  console.log(JSON.stringify({
    database: databaseUri,
    accounts: { admin: admin.email, vendor: mainOwner.email, traveller: traveller.email },
    ids: { admin: admin._id.toString(), vendorUser: mainOwner._id.toString(), vendor: mainVendor._id.toString() },
    counts: { vendors: 3, packages: packages.length, bookings: bookings.length, reviews: reviews.length, complaints: complaints.length, reports: reportSpecs.length },
  }, null, 2))
  await mongoose.disconnect()
}

seed().catch(async (error) => {
  console.error(error.stack || error.message)
  await mongoose.disconnect().catch(() => {})
  process.exitCode = 1
})
