// Libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import { profileApi } from '../../services/api.js'
import { storage, TOKEN_KEY, USER_KEY } from '../../services/storage.js'
import { getTokenClaims } from '../../utils/authToken.js'
import { validateChangePassword } from '../../utils/formValidation.js'

// Constants
const EMPTY_PASSWORDS = { old_password: '', new_password: '', confirm_password: '' }

// Page component
export default function VendorSettings() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [deleteReason, setDeleteReason] = useState('')
  const [status, setStatus] = useState({ message: '', type: '', loading: false })

  function updatePassword(key) {
    return (event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))
  }

  async function changePassword(event) {
    event.preventDefault()
    const validationError = validateChangePassword(passwords)
    if (validationError) {
      setStatus({ message: validationError, type: 'error', loading: false })
      return
    }

    setStatus({ message: '', type: '', loading: true })
    try {
      await profileApi.changePassword({
        oldPassword: passwords.old_password,
        newPassword: passwords.new_password,
        confiomPassword: passwords.confirm_password,
      })
      storage.clearAuth()
      navigate('/login', { replace: true })
    } catch (error) {
      setStatus({ message: error.message, type: 'error', loading: false })
    }
  }

  async function removeAccount() {
    if (!window.confirm('Permanently delete this vendor account?')) return
    const storedUser = storage.get(USER_KEY) || {}
    const claims = getTokenClaims(storage.get(TOKEN_KEY)) || {}
    const email = storedUser.email || ''
    const userId = claims.id || claims._id || claims.user_id || storedUser.id || storedUser._id || ''

    if (!email || !userId) {
      setStatus({ message: 'Your session is missing the account identity required for deletion. Sign out and sign in again.', type: 'error', loading: false })
      return
    }

    try {
      await profileApi.delete({ email, user_id: userId, reason: deleteReason.trim() })
      storage.clearAuth()
      navigate('/', { replace: true })
    } catch (error) {
      setStatus({ message: error.message, type: 'error', loading: false })
    }
  }

  return (
    <VendorShell title="Settings" subtitle="Manage password security and account access.">
      <form className="vendor-card vendor-form settings-form" onSubmit={changePassword}>
        <h2>Change password</h2>
        <VendorField label="Current password" type="password" autoComplete="current-password" value={passwords.old_password} onChange={updatePassword('old_password')} required />
        <PasswordField label="New password" value={passwords.new_password} onChange={updatePassword('new_password')} />
        <PasswordField label="Confirm new password" value={passwords.confirm_password} onChange={updatePassword('confirm_password')} showStrength={false} />
        <p className="vendor-hint">The current backend requires 8+ characters with uppercase, lowercase, a number, and a symbol. Twelve characters are recommended.</p>
        {status.message && <p className={`form-message ${status.type}`} role="alert">{status.message}</p>}
        <button className="vendor-button" disabled={status.loading}>{status.loading ? 'Updating…' : 'Update password'}</button>
      </form>

      <section className="vendor-card danger-zone">
        <h2>Danger zone</h2>
        <p>Request account deletion only after resolving active employees and active or future packages.</p>
        <label className="vendor-form">Reason (optional)<textarea maxLength="500" rows="4" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Tell us why you are leaving" /></label>
        <button className="vendor-button danger" type="button" onClick={removeAccount}>Delete vendor account</button>
      </section>
    </VendorShell>
  )
}
