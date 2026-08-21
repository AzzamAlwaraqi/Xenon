// Local-only test fixture generator. This file never runs in the browser build.
const path = require('path')

const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })

const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const User = require(path.join(backendRoot, 'src/Models/UserModel'))
const Package = require(path.join(backendRoot, 'src/Models/PackageModel'))

const password = process.env.XENON_TEST_PASSWORD
if (!password) throw new Error('Set XENON_TEST_PASSWORD in your terminal before running local test fixtures.')
const databaseUri = process.env.DATABASE.includes('<PASSWORD>')
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : process.env.DATABASE

async function upsertUser(details) {
  const existing = await User.findOne({ email: details.email })
  if (existing) return existing
  return User.create({ ...details, password, isActive: true, isEmailVerified: true })
}

async function seed() {
  await mongoose.connect(databaseUri)

  const vendor = await User.findOne({ email: 'vendor.petrajournals.test@example.com' })
  if (!vendor) throw new Error('Create the vendor through POST /api/v1/auth/register before running this seed.')

  const admins = await Promise.all([
    ['Xenon Test Administrator', 'admin.test@example.com', '0799000102'],
    ['Nour Test Operations Admin', 'admin.operations.test@example.com', '0799000106'],
    ['Sami Test Moderation Admin', 'admin.moderation.test@example.com', '0799000107'],
  ].map(([name, email, mobileNumber]) => upsertUser({ name, email, mobileNumber, role: 'admin' })))
  const traveller = await upsertUser({
    name: 'Lina Haddad Test Traveller',
    email: 'traveller.test@example.com',
    mobileNumber: '0799000103',
    role: 'user',
    gender: 'female',
    DateOfBirth: new Date('1996-05-18'),
  })

  let testPackage = await Package.findOne({ package_name: 'Petra by Lantern Light — TEST', vendor_id: vendor._id })
  if (!testPackage) {
    testPackage = new Package({
      vendor_id: vendor._id,
      package_name: 'Petra by Lantern Light — TEST',
      package_description: 'A clearly marked test experience used to verify the Xenon vendor and admin interfaces.',
      package_price: 145,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-20'),
      images: [{ url: 'https://images.unsplash.com/photo-1548786811-dd6e453ccca7', public_id: 'xenon-local-test-petra' }],
      tags: ['test', 'petra', 'cultural'],
      package_type: 'cultural',
      package_status: 'active',
      max_people: 20,
      available_seats: 20,
    })
    await testPackage.validate()
    await Package.collection.insertOne(testPackage.toObject())
  }

  console.log(JSON.stringify({
    adminIds: admins.map((admin) => admin._id.toString()),
    travellerId: traveller._id.toString(),
    vendorId: vendor._id.toString(),
    packageId: testPackage._id.toString(),
  }))
  await mongoose.disconnect()
}

seed().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect().catch(() => {})
  process.exitCode = 1
})
