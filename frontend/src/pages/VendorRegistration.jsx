// Libraries
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and services
import AuthImage from '../components/AuthImage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { ROUTES } from '../routes/routes.config.js'
import { authApi, profileApi } from '../services/api.js'
import { storage } from '../services/storage.js'
import { formatBirthDateForApi, isValidEmail, latestBirthDateForAge, validateVendorAccount, validateVendorBusiness } from '../utils/formValidation.js'

const vendorImage = 'https://images.unsplash.com/photo-1666689468289-bd7ae53d5ba9?auto=format&fit=crop&w=1800&q=88'
const EMPTY_FORM = {
  name: '', email: '', DateOfBirth: '', gender: '', mobileNumber: '', password: '', confirm: '', otp: '',
  company_name: '', vendor_type: 'Tourism', address: '', city: '', state: '', pincode: '', country: 'Jordan', iban_number: '',
  commercial_register_image: null, vocational_license_image: null, tourism_license_image: null, owner_id_image: null, iban_letter_image: null,
}
const DOCUMENTS = [
  ['commercial_register_image', 'Commercial registration', true],
  ['vocational_license_image', 'Vocational licence', true],
  ['tourism_license_image', 'Tourism licence', false],
  ['owner_id_image', 'Owner ID', true],
  ['iban_letter_image', 'IBAN letter', true],
]

// Vendor account and onboarding application
export default function VendorRegistration() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })
  const [otpStatus, setOtpStatus] = useState({ loading: false, sent: false, message: '' })

  function update(key) {
    return (event) => {
      if (key === 'email' && event.target.value !== form.email) setOtpStatus({ loading: false, sent: false, message: '' })
      setForm((current) => ({ ...current, [key]: event.target.value }))
    }
  }

  function updateFile(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.files?.[0] || null }))
  }

  async function sendOtp() {
    if (!isValidEmail(form.email)) {
      setStatus({ loading: false, message: 'Enter a valid work email before requesting a code.', type: 'error' })
      return
    }
    setOtpStatus({ loading: true, sent: false, message: '' })
    setStatus({ loading: false, message: '', type: '' })
    try {
      await authApi.sendOtp({ email: form.email.trim().toLowerCase(), purpose: 'registration', length: 6 })
      setOtpStatus({ loading: false, sent: true, message: 'A six-digit code was sent to your email and expires in five minutes.' })
    } catch (error) {
      setOtpStatus({ loading: false, sent: false, message: error.message })
    }
  }

  function saveAccountSession(result) {
    const token = result.data?.accessToken || result.data?.token
    if (!token) throw new Error('The API did not return an authentication token.')
    storage.setAuthSession({
      token,
      refreshToken: result.data?.refreshToken || null,
      role: 'user',
      session: result.data?.session || null,
      user: result.data?.user || { name: form.name.trim(), email: form.email.trim().toLowerCase(), role: 'user' },
    })
  }

  async function createAccount(event) {
    event.preventDefault()
    const validationError = validateVendorAccount(form)
    if (validationError) return setStatus({ loading: false, message: validationError, type: 'error' })
    if (!otpStatus.sent) return setStatus({ loading: false, message: 'Request the verification code sent to your work email.', type: 'error' })
    if (!/^\d{6}$/.test(form.otp.trim())) return setStatus({ loading: false, message: 'Enter the six-digit verification code.', type: 'error' })

    setStatus({ loading: true, message: '', type: '' })
    const credentials = { email: form.email.trim().toLowerCase(), password: form.password, role: 'user' }
    try {
      let result
      try {
        result = await authApi.register({
          name: form.name.trim(), email: credentials.email, password: form.password, passwordConfirm: form.confirm,
          role: 'user', DateOfBirth: formatBirthDateForApi(form.DateOfBirth), gender: form.gender,
          mobileNumber: form.mobileNumber.replace(/\D/g, ''), otp: form.otp.trim(),
        })
      } catch (registrationError) {
        // Current backend versions may save the user before failing to compose the response.
        if (![409, 500].includes(registrationError.status)) throw registrationError
        result = await authApi.login(credentials)
      }
      saveAccountSession(result)
      setStatus({ loading: false, message: '', type: '' })
      setStep(2)
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  async function submitApplication(event) {
    event.preventDefault()
    const validationError = validateVendorBusiness(form)
    if (validationError) return setStatus({ loading: false, message: validationError, type: 'error' })

    const body = new FormData()
    ;['company_name', 'address', 'city', 'state', 'pincode', 'country', 'vendor_type'].forEach((key) => body.append(key, form[key].trim()))
    body.append('iban_number', form.iban_number.replace(/\s/g, '').toUpperCase())
    DOCUMENTS.forEach(([key]) => { if (form[key]) body.append(key, form[key]) })

    setStatus({ loading: true, message: '', type: '' })
    try {
      await profileApi.requestVendor(body)
      storage.clearAuth()
      setStatus({ loading: false, message: '', type: '' })
      setStep(3)
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <div className="auth-page">
      <div className="top-row"><Link className="brand" to={ROUTES.LANDING}>Xenon</Link><Link className="text-link" to={ROUTES.LANDING}>Return to Home</Link></div>
      <main className="auth-panel vendor-panel">
        <div className="auth-inner">
          {step < 3 && <div className="stepper"><p>STEP {step} OF 2</p><div className="step-track"><span style={{ width: `${step * 50}%` }} /></div></div>}
          <header className="auth-head"><h1 className="auth-title">{step === 3 ? 'Application received' : 'Partner Registration'}</h1><p className="auth-subtitle">{step === 1 ? 'Create your secure account before submitting your business for review.' : step === 2 ? 'Provide the business details and verification documents required for approval.' : 'Your business information is now waiting for Xenon administrator review.'}</p></header>

          {step === 1 && <form className="register-form" onSubmit={createAccount} noValidate>
            <div className="field"><label>Full Name</label><input autoComplete="name" maxLength="100" value={form.name} onChange={update('name')} required /></div>
            <div className="field-grid"><div className="field"><label>Work Email</label><input type="email" autoComplete="email" value={form.email} onChange={update('email')} required /></div><div className="field"><label>Date of Birth</label><input type="date" max={latestBirthDateForAge(18)} value={form.DateOfBirth} onChange={update('DateOfBirth')} required /><p className="field-hint">Applicants must be at least 18 years old.</p></div></div>
            <div className="field-grid"><div className="field"><label>Title / Prefix</label><select value={form.gender} onChange={update('gender')} required><option value="">Select</option><option value="male">Mr.</option><option value="female">Ms.</option></select></div><div className="field"><label>Mobile Number</label><input type="tel" inputMode="numeric" autoComplete="tel" maxLength="10" placeholder="0790000000" value={form.mobileNumber} onChange={update('mobileNumber')} required /></div></div>
            <div className="field"><label>Email verification code</label><div className="input-action-row"><input inputMode="numeric" autoComplete="one-time-code" maxLength="6" placeholder="000000" value={form.otp} onChange={update('otp')} required /><button className="secondary-button" type="button" disabled={otpStatus.loading} onClick={sendOtp}>{otpStatus.loading ? 'Sending…' : otpStatus.sent ? 'Resend code' : 'Send code'}</button></div>{otpStatus.message && <p className={`form-message ${otpStatus.sent ? 'success' : 'error'}`}>{otpStatus.message}</p>}</div>
            <PasswordField value={form.password} onChange={update('password')} />
            <PasswordField label="Confirm password" value={form.confirm} onChange={update('confirm')} showStrength={false} autoComplete="new-password" />
            {status.message && <p className={`form-message ${status.type}`} role="alert">{status.message}</p>}
            <div className="vendor-actions"><button className="primary-button" disabled={status.loading}>{status.loading ? 'Creating account…' : <>Continue to Business Details <ArrowRight size={15} /></>}</button></div>
          </form>}

          {step === 2 && <form className="register-form" onSubmit={submitApplication} noValidate>
            <div className="field"><label>Business Name</label><input maxLength="100" value={form.company_name} onChange={update('company_name')} required /></div>
            <div className="field-grid"><div className="field"><label>Business Type</label><select value={form.vendor_type} onChange={update('vendor_type')}><option>Tourism</option><option>Boutique Hotel</option><option>Tour Operator</option><option>Artisan Experience</option><option>Wellness Retreat</option></select></div><div className="field"><label>IBAN Number</label><input placeholder="JO00 0000 0000 0000 0000 0000 0000 00" value={form.iban_number} onChange={update('iban_number')} required /></div></div>
            <div className="field"><label>Business Address</label><input value={form.address} onChange={update('address')} required /></div>
            <div className="field-grid"><div className="field"><label>City</label><input value={form.city} onChange={update('city')} required /></div><div className="field"><label>Governorate</label><input value={form.state} onChange={update('state')} required /></div></div>
            <div className="field"><label>Postal Code</label><input inputMode="numeric" maxLength="10" value={form.pincode} onChange={update('pincode')} required /><p className="field-hint">Vendor applications are currently available for businesses operating in Jordan.</p></div>
            <div className="document-grid">{DOCUMENTS.map(([key, label, required]) => <div className="field" key={key}><label>{label}{required ? ' *' : ' (optional)'}</label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={updateFile(key)} required={required} /><p className="field-hint">JPEG, PNG, or WebP · maximum 5 MB</p></div>)}</div>
            {status.message && <p className={`form-message ${status.type}`} role="alert">{status.message}</p>}
            <div className="vendor-actions"><button className="secondary-button" type="button" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button><button className="primary-button" disabled={status.loading}>{status.loading ? 'Submitting…' : <>Submit Application <ArrowRight size={15} /></>}</button></div>
          </form>}

          {step === 3 && <section className="registration-success" role="status"><CheckCircle2 size={52} /><h2>Pending administrator approval</h2><p>We will review your company information and documents. You can sign in to the Vendor portal after an administrator approves and activates your application.</p><Link className="primary-button" to={ROUTES.LANDING}>Return to Home</Link></section>}
          {step < 3 && <p className="legal">Already an approved partner? <Link className="text-link" to={ROUTES.LOGIN}>Sign in here.</Link></p>}
        </div>
      </main>
      <AuthImage image={vendorImage} quote="&quot;Jordan rewards those who slow down, listen, and travel with intention.&quot;" attribution="WADI RUM · JORDAN" />
    </div>
  )
}
