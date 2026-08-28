const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9\s()-]{8,18}$/
const jordanMobilePattern = /^07[789]\d{7}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

const WORK_SYSTEMS = ['part-time', 'full-time', 'contract', 'freelance']
const STAFF_POSITIONS = {
  admin: ['manager', 'supervisor', 'customer-support', 'accountant'],
  vendor: ['tour-guide', 'driver', 'event-organizer', 'photographer', 'translator', 'hospitality'],
}

export function localToday() {
  const today = new Date()
  const offset = today.getTimezoneOffset() * 60 * 1000
  return new Date(today.getTime() - offset).toISOString().slice(0, 10)
}

export function isValidIsoDate(value) {
  if (!isoDatePattern.test(String(value))) return false
  const [year, month, day] = String(value).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function isAtLeastAge(value, minimumAge, referenceDate = localToday()) {
  if (!isValidIsoDate(value) || !isValidIsoDate(referenceDate)) return false
  const [birthYear, birthMonth, birthDay] = value.split('-').map(Number)
  const [currentYear, currentMonth, currentDay] = referenceDate.split('-').map(Number)
  let age = currentYear - birthYear
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) age -= 1
  return age >= minimumAge
}

export function latestBirthDateForAge(minimumAge, referenceDate = localToday()) {
  const [year, month, day] = referenceDate.split('-').map(Number)
  const targetYear = year - minimumAge
  const lastDayOfMonth = new Date(targetYear, month, 0).getDate()
  return `${targetYear}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDayOfMonth)).padStart(2, '0')}`
}

export function formatBirthDateForApi(value) {
  if (!isValidIsoDate(value)) return value
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

export function isUuid(value) {
  return uuidPattern.test(String(value).trim())
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '')
}

export function isValidEmail(email) {
  return emailPattern.test(String(email).trim())
}

export function isStrongPassword(password) {
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

export function isAcceptablePassword(password) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password)
  )
}

export function validateLogin(form) {
  if (!isValidEmail(form.email)) return 'Enter a valid email address.'
  if (!form.password) return 'Enter your password.'
  return ''
}

export function validatePasswordReset(form) {
  if (!isValidEmail(form.email)) return 'Enter a valid email address.'
  if (!/^\d{6}$/.test(String(form.otpCode).trim())) return 'Enter the six-digit verification code from your email.'
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (form.password !== form.confirm_password) return 'Passwords do not match.'
  return ''
}

export function validateTraveller(form, agreed) {
  if (form.name.trim().length < 2) return 'Full name must contain at least 2 characters.'
  if (form.name.trim().length > 100) return 'Full name must not exceed 100 characters.'
  if (!isValidEmail(form.email)) return 'Enter a valid email address.'
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (!jordanMobilePattern.test(normalizePhone(form.mobileNumber))) return 'Use a Jordanian mobile number beginning with 077, 078, or 079.'
  if (form.password !== form.confirm) return 'Passwords do not match.'
  if (form.otp !== undefined && !/^\d{6}$/.test(String(form.otp).trim())) return 'Enter the six-digit email verification code.'
  if (!phonePattern.test(form.mobileNumber.trim())) return 'Enter a valid mobile number with 8–18 digits.'
  if (!form.DateOfBirth) return 'Select your date of birth.'
  if (!isValidIsoDate(form.DateOfBirth)) return 'Select a valid date of birth.'
  if (form.DateOfBirth >= localToday()) return 'Date of birth must be in the past.'
  if (!['Mr.', 'Ms.'].includes(form.gender)) return 'Select a valid title or prefix.'
  if (!agreed) return 'Accept the Terms of Service and Privacy Policy to continue.'
  return ''
}

export function validateVendorAccount(form) {
  if (form.name.trim().length < 2) return 'Full name must contain at least 2 characters.'
  if (form.name.trim().length > 100) return 'Full name must not exceed 100 characters.'
  if (!isValidEmail(form.email)) return 'Enter a valid work email address.'
  if (!form.DateOfBirth) return 'Select your date of birth.'
  if (!isValidIsoDate(form.DateOfBirth)) return 'Select a valid date of birth.'
  if (form.DateOfBirth >= localToday()) return 'Date of birth must be in the past.'
  if (!isAtLeastAge(form.DateOfBirth, 18)) return 'Vendor applicants must be at least 18 years old.'
  if (!['male', 'female'].includes(form.gender)) return 'Select a valid title or prefix.'
  if (!jordanMobilePattern.test(normalizePhone(form.mobileNumber))) return 'Use a Jordanian mobile number beginning with 077, 078, or 079.'
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (form.confirm !== undefined && form.password !== form.confirm) return 'Passwords do not match.'
  return ''
}

export function validateVendorBusiness(form) {
  if (form.company_name.trim().length < 2) return 'Business name must contain at least 2 characters.'
  if (form.company_name.trim().length > 100) return 'Business name must not exceed 100 characters.'
  if (!form.vendor_type) return 'Select a business type.'
  if (form.address.trim().length < 5) return 'Enter a complete business address.'
  if (form.city.trim().length < 2) return 'Enter a valid city.'
  if (form.state.trim().length < 2) return 'Enter a valid state or governorate.'
  if (!/^\d{4,10}$/.test(form.pincode.trim())) return 'Postal code must contain 4-10 digits.'
  if (form.country.trim().length < 2) return 'Enter a valid country.'
  if (!/^JO\d{28}$/.test(String(form.iban_number || '').replace(/\s/g, '').toUpperCase())) return 'Enter a valid Jordanian IBAN beginning with JO followed by 28 digits.'
  const requiredDocuments = [
    ['commercial_register_image', 'Commercial registration'],
    ['vocational_license_image', 'Vocational licence'],
    ['owner_id_image', 'Owner ID'],
    ['iban_letter_image', 'IBAN letter'],
  ]
  for (const [key, label] of requiredDocuments) {
    if (!form[key]) return `${label} image is required.`
  }
  for (const file of [...requiredDocuments.map(([key]) => form[key]), form.tourism_license_image].filter(Boolean)) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Documents must be JPEG, PNG, or WebP images.'
    if (file.size <= 0 || file.size > 5 * 1024 * 1024) return 'Each document must be a non-empty image no larger than 5 MB.'
  }
  return ''
}

export function validateDateRange(startDate, endDate, { requireBoth = true, futureOnly = false, allowSameDay = true } = {}) {
  if (requireBoth && (!startDate || !endDate)) return 'Select both start and end dates.'
  if (startDate && !isValidIsoDate(startDate)) return 'Select a valid start date.'
  if (endDate && !isValidIsoDate(endDate)) return 'Select a valid end date.'
  if (futureOnly && startDate && startDate < localToday()) return 'Start date cannot be in the past.'
  if (startDate && endDate && (allowSameDay ? endDate < startDate : endDate <= startDate)) return allowSameDay ? 'End date cannot be before the start date.' : 'End date must be after the start date.'
  return ''
}

export function validateAnalyticsDates(dates) {
  const rangeError = validateDateRange(dates.startDate, dates.endDate, { requireBoth: false })
  if (rangeError) return rangeError
  if (dates.startDate && dates.startDate > localToday()) return 'Analytics start date cannot be in the future.'
  if (dates.endDate && dates.endDate > localToday()) return 'Analytics end date cannot be in the future.'
  return ''
}

export function validatePackage(form, edit = false, allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']), maxImageBytes = 5 * 1024 * 1024) {
  if (form.package_name.trim().length < 3) return 'Package name must contain at least 3 characters.'
  if (form.package_name.trim().length > 100) return 'Package name must not exceed 100 characters.'
  const price = Number(form.package_price)
  if (form.package_price === '' || !Number.isFinite(price) || price < 0) return 'Enter a valid non-negative price.'
  if (form.package_image && !allowedImageTypes.has(form.package_image.type)) return 'Cover photo must be JPEG, PNG, or WebP.'
  if (form.package_image && form.package_image.size <= 0) return 'The selected cover photo is empty.'
  if (form.package_image && form.package_image.size > maxImageBytes) return 'Cover photo must be 5 MB or smaller.'
  if (edit) return ''
  if (!form.package_description.trim()) return 'Add a package description.'
  if (form.package_description.trim().length > 500) return 'Description must not exceed 500 characters.'
  if (!['adventure', 'cultural', 'relaxation', 'historical', 'family'].includes(form.package_type)) return 'Select a valid experience type.'
  if (!['active', 'inactive', 'draft'].includes(form.package_status)) return 'Select a valid publishing status.'
  const dateError = validateDateRange(form.startDate, form.endDate, { futureOnly: true, allowSameDay: false })
  if (dateError) return dateError
  if (!Number.isInteger(Number(form.max_people)) || Number(form.max_people) < 1 || Number(form.max_people) > 100) return 'Capacity must be a whole number from 1 to 100.'
  if (!form.meeting_point.trim()) return 'Add an exact meeting point for travellers.'
  if (!form.package_image) return 'Choose a JPEG, PNG, or WebP cover photo.'
  return ''
}

export function validatePayment(form, role) {
  const recordId = role === 'admin' ? form.vendor_id : form.booking_id
  if (!isUuid(recordId)) return `Enter a valid ${role === 'admin' ? 'vendor' : 'booking'} ID.`
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount < 0.01) return 'Amount must be at least JOD 0.01.'
  const allowedMethods = role === 'admin' ? ['ManualBankTransfer', 'OnlineGateway'] : ['CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway']
  if (!allowedMethods.includes(form.payment_method)) return 'Select a supported payment method.'
  if (role === 'vendor' && !/^\d{10}$/.test(normalizePhone(form.customer_phone))) return 'Customer phone must contain exactly 10 digits.'
  const description = form.payment_description.trim()
  if (!description) return 'Enter a payment description.'
  if (description.length > 500) return 'Payment description must not exceed 500 characters.'
  return ''
}

export function validateStaff(form, portalRole) {
  const name = form.name.trim()
  if (name.length < 3 || name.length > 50) return 'Staff name must contain 3–50 characters.'
  if (!isValidEmail(form.email) || !/@xenon\.com$/i.test(form.email.trim())) return 'Use a valid corporate email ending in @xenon.com.'
  if (!/^\d{10}$/.test(normalizePhone(form.mobileNumber))) return 'Mobile number must contain exactly 10 digits.'
  if (String(form.password).length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return 'Temporary password must be 8+ characters and contain a letter and a number.'
  if (form.role !== portalRole || !['admin', 'vendor'].includes(form.role)) return 'The staff role must match the current portal.'
  if (!WORK_SYSTEMS.includes(form.workSystem)) return 'Select a valid work system.'
  if (!STAFF_POSITIONS[portalRole]?.includes(form.position)) return 'Select a position permitted for this portal.'
  const basePay = Number(form.basePay)
  if (!Number.isFinite(basePay) || basePay < 0) return 'Base pay must be a non-negative number.'
  if (form.allowances !== undefined && form.allowances !== '') {
    if (!['full-time', 'contract'].includes(form.workSystem)) return 'Allowances are only available for full-time or contract staff.'
    if (!Number.isFinite(Number(form.allowances)) || Number(form.allowances) < 0) return 'Allowances must be a non-negative number.'
  }
  return ''
}

export function validateBooking(form, packageItem = {}) {
  if (!isValidIsoDate(form.date)) return 'Select a valid travel date.'
  if (form.date < localToday()) return 'Travel date cannot be in the past.'
  const packageStart = String(packageItem.startDate || '').slice(0, 10)
  const packageEnd = String(packageItem.endDate || '').slice(0, 10)
  if (packageStart && form.date < packageStart) return 'Travel date cannot be before the package starts.'
  if (packageEnd && form.date > packageEnd) return 'Travel date cannot be after the package ends.'
  const guests = Number(form.guests)
  if (!Number.isInteger(guests) || guests < 1 || guests > 5) return 'Guests must be a whole number from 1 to 5.'
  if (Number.isFinite(Number(packageItem.available_seats)) && guests > Number(packageItem.available_seats)) return `Only ${packageItem.available_seats} seats are currently available.`
  if (packageItem.package_status && packageItem.package_status !== 'active') return 'This package is not currently accepting bookings.'
  return ''
}

export function validateBookingTransition(currentStatus, nextStatus) {
  const allowed = {
    pending: ['accepted', 'rejected'],
    pending_payment: ['accepted', 'rejected'],
    accepted: ['completed'],
  }
  if (!allowed[currentStatus]?.includes(nextStatus)) return `A ${currentStatus || 'unknown'} booking cannot be changed to ${nextStatus}.`
  return ''
}

export function validateReview(form) {
  const rating = Number(form.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'Rating must be a whole number from 1 to 5.'
  const comment = String(form.comment || '').trim()
  if (comment && comment.length < 3) return 'Review comment must contain at least 3 characters.'
  if (comment.length > 500) return 'Review comment must not exceed 500 characters.'
  return ''
}

export function validateChangePassword(form) {
  if (!form.old_password) return 'Enter your current password.'
  if (!isAcceptablePassword(form.new_password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (form.new_password !== form.confirm_password) return 'The new passwords do not match.'
  if (form.old_password === form.new_password) return 'Choose a new password that differs from the current password.'
  return ''
}

export function validateProfile(form, { vendor = false } = {}) {
  if (String(form.name || '').trim().length < 2 || String(form.name || '').trim().length > 100) return 'Name must contain 2–100 characters.'
  if (vendor) {
    if (String(form.company_name || '').trim().length < 2 || String(form.company_name || '').trim().length > 100) return 'Business name must contain 2–100 characters.'
    if (String(form.city || '').trim().length < 2) return 'Enter a valid city.'
    if (String(form.state || '').trim().length < 2) return 'Enter a valid governorate.'
    if (String(form.country || '').trim().length < 2) return 'Enter a valid country.'
    return ''
  }
  if (!isValidEmail(form.email)) return 'Enter a valid email address.'
  if (!jordanMobilePattern.test(normalizePhone(form.mobileNumber))) return 'Use a Jordanian mobile number beginning with 077, 078, or 079.'
  return ''
}

export function validateBroadcast(form, role) {
  const title = form.title.trim()
  const message = form.message.trim()
  if (title.length < 3 || title.length > 100) return 'Notification title must contain 3–100 characters.'
  if (message.length < 5 || message.length > 500) return 'Notification message must contain 5–500 characters.'
  if (role === 'admin' && !['all', 'users_only', 'vendors_only'].includes(form.targetAudience)) return 'Select a valid notification audience.'
  return ''
}

export function validateResponseText(value, { required = true, min = 1, max = 1000, label = 'Response' } = {}) {
  const text = String(value || '').trim()
  if (required && !text) return `${label} is required.`
  if (text && text.length < min) return `${label} must contain at least ${min} characters.`
  if (text.length > max) return `${label} must not exceed ${max} characters.`
  return ''
}
