// Local integration test for SMTP and the password-reset API.
const crypto = require('crypto')
const path = require('path')

const backendRoot = path.resolve(__dirname, '../../backend')
require(path.join(backendRoot, 'node_modules/dotenv')).config({ path: path.join(backendRoot, 'src/config.env') })

const mongoose = require(path.join(backendRoot, 'node_modules/mongoose'))
const OTP = require(path.join(backendRoot, 'src/Models/OTPModel'))
const emailService = require(path.join(backendRoot, 'src/services/Integration/emailService'))

const apiRoot = process.env.XENON_TEST_API_URL || 'http://127.0.0.1:3000/api/v1'
const testEmail = process.env.XENON_TEST_EMAIL || 'vendor.petrajournals.test@example.com'
const testPassword = process.env.XENON_TEST_PASSWORD
const databaseUri = process.env.DATABASE?.includes('<PASSWORD>')
  ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  : process.env.DATABASE

if (!testPassword) throw new Error('Set XENON_TEST_PASSWORD before running the password-reset integration test.')
if (!databaseUri) throw new Error('DATABASE is not configured.')

async function api(pathname, options = {}) {
  const response = await fetch(`${apiRoot}${pathname}`, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${pathname}: ${response.status} ${body.message || body.error || 'request failed'}`)
  return body
}

async function run() {
  const smtpConnected = await emailService.verifyConnection()
  if (!smtpConnected) throw new Error('SMTP verification failed.')

  if (process.env.XENON_SEND_TEST_EMAIL === '1') {
    await emailService.sendEmail({
      to: process.env.GOOGLE_EMAIL_ADDRESS,
      subject: 'Xenon email service test',
      text: 'The Xenon SMTP connection and transactional email service are working.',
      retries: 0,
    })
  }

  await mongoose.connect(databaseUri)
  const otp = String(crypto.randomInt(100000, 1000000))
  const query = { email: testEmail.toLowerCase(), purpose: 'password_reset' }

  try {
    await OTP.deleteMany(query)
    await OTP.create({ ...query, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) })

    await api('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        otpCode: otp,
        newPassword: testPassword,
        confirmPassword: testPassword,
      }),
    })

    await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, role: 'vendor' }),
    })

    console.log(JSON.stringify({ smtpConnected: true, testEmailSent: process.env.XENON_SEND_TEST_EMAIL === '1', passwordReset: true, loginAfterReset: true }))
  } finally {
    await OTP.deleteMany(query).catch(() => {})
    await mongoose.disconnect().catch(() => {})
  }
}

run().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect().catch(() => {})
  process.exitCode = 1
})
