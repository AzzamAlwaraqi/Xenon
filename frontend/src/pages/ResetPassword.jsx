// Libraries
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

// Components, services, and validation
import PasswordField from '../components/PasswordField.jsx'
import { authApi } from '../services/api.js'
import { storage } from '../services/storage.js'
import { validatePasswordReset } from '../utils/formValidation.js'

// OTP password-reset page
export default function ResetPassword() {
  const location = useLocation()
  const [form, setForm] = useState({
    email: location.state?.email || '',
    otpCode: '',
    password: '',
    confirm_password: '',
  })
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })
  const [complete, setComplete] = useState(false)

  function updateField(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    const validationError = validatePasswordReset(form)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    try {
      await authApi.resetPassword({
        email: form.email.trim().toLowerCase(),
        otpCode: form.otpCode.trim(),
        newPassword: form.password,
        confirmPassword: form.confirm_password,
      })
      storage.clearAuth()
      setForm((current) => ({ ...current, otpCode: '', password: '', confirm_password: '' }))
      setComplete(true)
      setStatus({ loading: false, message: 'Your password has been reset. You can now sign in.', type: 'success' })
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <main className="simple-page">
      <Link className="brand" to="/">Xenon</Link>
      <section className="login-card legal-card">
        <h1 className="auth-title">Set a new password</h1>
        <p>Enter the six-digit code sent to your email. The code expires after five minutes.</p>
        <form className="form-stack" onSubmit={submit} noValidate>
          <div className="field">
            <label>Email address</label>
            <input type="email" autoComplete="email" value={form.email} onChange={updateField('email')} disabled={complete} required />
          </div>
          <div className="field">
            <label>Verification code</label>
            <input
              className="otp-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength="6"
              placeholder="000000"
              value={form.otpCode}
              onChange={(event) => setForm((current) => ({ ...current, otpCode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
              disabled={complete}
              required
            />
          </div>
          {!complete && <>
            <PasswordField label="New password" value={form.password} onChange={updateField('password')} />
            <PasswordField label="Confirm new password" value={form.confirm_password} onChange={updateField('confirm_password')} showStrength={false} />
          </>}
          {status.message && <p className={`form-message ${status.type}`} role="status">{status.message}</p>}
          {!complete && <button className="primary-button" disabled={status.loading}>{status.loading ? 'Resetting…' : 'Reset password'}</button>}
        </form>
        {complete ? <Link className="text-link" to="/login">Continue to sign in</Link> : <Link className="text-link" to="/forgot-password">Request a new code</Link>}
      </section>
    </main>
  )
}
