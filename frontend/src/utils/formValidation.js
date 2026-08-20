const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9\s()-]{8,18}$/

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
  if (!emailPattern.test(form.email.trim())) return 'Enter a valid email address.'
  if (!form.password) return 'Enter your password.'
  return ''
}

export function validateTraveller(form, agreed) {
  if (form.name.trim().length < 2) return 'Full name must contain at least 2 characters.'
  if (!emailPattern.test(form.email.trim())) return 'Enter a valid email address.'
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (!/^07[789]\d{7}$/.test(form.mobileNumber.replace(/\D/g, ''))) return 'Use a Jordanian mobile number beginning with 077, 078, or 079.'
  if (form.password !== form.confirm) return 'Passwords do not match.'
  if (!phonePattern.test(form.mobileNumber.trim())) return 'Enter a valid mobile number with 8–18 digits.'
  if (!form.DateOfBirth) return 'Select your date of birth.'
  if (new Date(form.DateOfBirth) >= new Date()) return 'Date of birth must be in the past.'
  if (!form.gender) return 'Select a title or prefix.'
  if (!agreed) return 'Accept the Terms of Service and Privacy Policy to continue.'
  return ''
}

export function validateVendorAccount(form) {
  if (form.name.trim().length < 2) return 'Full name must contain at least 2 characters.'
  if (!emailPattern.test(form.email.trim())) return 'Enter a valid work email address.'
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  return ''
}

export function validateBooking(form) {
  if (!form.date) return 'Select a travel date.'
  if (new Date(form.date) <= new Date()) return 'Booking date must be in the future.'
  const guests = Number(form.guests)
  if (!guests || guests < 1 || guests > 5) return 'You can book for 1 to 5 people.'
  return ''
}

export function validateReview(form) {
  const rating = Number(form.rating)
  if (!rating || rating < 1 || rating > 5) return 'Choose a rating from 1 to 5.'
  if (form.comment && form.comment.trim().length > 0 && form.comment.trim().length < 3) return 'Comment must be at least 3 characters.'
  return ''
}

export function validateChangePassword(form) {
  if (!form.old_password) return 'Enter your current password.'
  if (!isAcceptablePassword(form.new_password)) return 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.'
  if (form.new_password !== form.confirm_password) return 'New passwords do not match.'
  return ''
}

export function validateVendorBusiness(form) {
  if (form.company_name.trim().length < 2) return 'Business name must contain at least 2 characters.'
  if (!form.vendor_type) return 'Select a business type.'
  if (!/^07[789]\d{7}$/.test(form.phone_no.replace(/\D/g, ''))) return 'Use a Jordanian mobile number beginning with 077, 078, or 079.'
  if (form.address.trim().length < 5) return 'Enter a complete business address.'
  if (form.city.trim().length < 2) return 'Enter a valid city.'
  if (form.state.trim().length < 2) return 'Enter a valid state or governorate.'
  if (!/^\d{4,10}$/.test(form.pincode.trim())) return 'Postal code must contain 4-10 digits.'
  if (form.country.trim().length < 2) return 'Enter a valid country.'
  return ''
}
