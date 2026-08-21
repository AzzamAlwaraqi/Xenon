// Libraries
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Services and validation
import { authApi } from '../services/api.js'
import { isValidEmail } from '../utils/formValidation.js'
import { ROUTES } from '../routes/routes.config.js'

// Password recovery request page
export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })

  async function submit(event) {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setStatus({ loading: false, message: 'Enter a valid email address.', type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    try {
      const normalizedEmail = email.trim().toLowerCase()
      await authApi.forgotPassword(normalizedEmail)
      setStatus({ loading: false, message: 'If this account exists, a verification code has been requested.', type: 'success' })
      navigate(ROUTES.RESET_PASSWORD, { state: { email: normalizedEmail } })
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <main className="simple-page">
      <Link className="brand" to="/">Xenon</Link>
      <section className="login-card legal-card">
        <h1 className="auth-title">Recover your password</h1>
        <p>Enter the email used by your vendor or administrator account.</p>
        <form className="form-stack" onSubmit={submit} noValidate>
          <div className="field">
            <label>Email address</label>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          {status.message && <p className={`form-message ${status.type}`} role="status">{status.message}</p>}
          <button className="primary-button" disabled={status.loading}>{status.loading ? 'Requesting…' : 'Request recovery email'}</button>
        </form>
        <Link className="text-link" to="/login">Return to sign in</Link>
      </section>
    </main>
  )
}
