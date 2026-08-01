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
    /\d/.test(password)
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
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase and lowercase letters and a number.'
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
  if (!isAcceptablePassword(form.password)) return 'Use at least 8 characters with uppercase and lowercase letters and a number.'
  return ''
}

export function validateVendorBusiness(form) {
  if (form.company_name.trim().length < 2) return 'Business name must contain at least 2 characters.'
  if (!form.vendor_type) return 'Select a business type.'
  if (!phonePattern.test(form.mobile.trim())) return 'Enter a valid mobile number with 8–18 digits.'
  if (form.address.trim().length < 5) return 'Enter a complete business address.'
  if (form.city.trim().length < 2) return 'Enter a valid city.'
  if (form.country.trim().length < 2) return 'Enter a valid country.'
  return ''
}
