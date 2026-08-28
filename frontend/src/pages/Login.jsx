// Libraries
import { ArrowRight, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Components and services
import AuthImage from '../components/AuthImage.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { authApi } from '../services/api.js'
import { storage } from '../services/storage.js'
import { ROUTES } from '../routes/routes.config.js'
import { validateLogin } from '../utils/formValidation.js'
import { getPortalRole } from '../utils/authToken.js'

// Page image
const loginImage = 'https://images.unsplash.com/photo-1724739541524-dd6ee3fc7ff9?auto=format&fit=crop&w=1800&q=88'

// Login page
export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('vendor')
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })

  // Submit the selected account type
  async function submit(event) {
    event.preventDefault()
    const validationError = validateLogin(form)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }
    setStatus({ loading: true, message: '', type: '' })
    try {
      const result = await authApi.login({ email: form.email.trim().toLowerCase(), password: form.password })
      const token = result.data?.token
      if (!token) throw new Error('The API did not return an authentication token.')
      const authenticatedRole = getPortalRole(token)
      if (!authenticatedRole || authenticatedRole !== role) throw new Error('The authenticated account does not match the selected portal.')
      storage.setAuthSession({
        token,
        refreshToken: result.data?.refreshToken || null,
        role: authenticatedRole,
        session: result.data?.session || null,
        user: result.data?.user || { email: form.email.trim().toLowerCase() },
      })
      setStatus({ loading: false, message: 'Welcome back. Your session is ready.', type: 'success' })
      navigate(authenticatedRole === 'admin' ? ROUTES.ADMIN : ROUTES.VENDOR, { replace: true })
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <div className="auth-page">
      <main className="auth-panel">
        <div className="auth-inner">
          <header className="auth-head"><Link className="brand" to="/">Xenon</Link><p>Sign in to access your curated journeys.</p></header>
          <section className="login-card">
            <div className="role-tabs">
              {[['vendor','Vendor'],['admin','Admin']].map(([value,label]) => (
                <button key={value} type="button" className={`role-tab ${role === value ? 'active' : ''}`} onClick={() => setRole(value)}>{label}</button>
              ))}
            </div>
            <form className="form-stack" onSubmit={submit}>
              <div className="field"><label>Email Address</label><div className="input-wrap"><Mail size={17}/><input className="has-icon" type="email" placeholder="hello@example.com" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} required /></div></div>
              <div><div className="label-line"><span /><Link className="text-link" to={ROUTES.FORGOT_PASSWORD}>Forgot?</Link></div><PasswordField value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} showStrength={false} autoComplete="current-password" /></div>
              {status.message && <p className={`form-message ${status.type}`} role="status">{status.message}</p>}
              <button className="primary-button" disabled={status.loading}>{status.loading ? 'Signing in…' : <>Sign In <ArrowRight size={15}/></>}</button>
            </form>
            {role === 'vendor' && <div className="login-footer">
              <p>Offer a Jordan experience? <Link className="text-link" to="/register/vendor">Register as a partner</Link></p>
            </div>}
          </section>
          <p className="legal">Protected by Xenon secure authentication.</p>
        </div>
      </main>
      <AuthImage image={loginImage} quote='"The journey not the arrival matters."' attribution="WADI RUM · JORDAN" />
    </div>
  )
}
