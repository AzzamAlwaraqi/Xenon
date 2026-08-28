// Libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Components and services
import PasswordField from '../../components/PasswordField.jsx'
import { profileApi } from '../../services/api.js'
import { storage, TOKEN_KEY, USER_KEY } from '../../services/storage.js'
import { getTokenClaims } from '../../utils/authToken.js'
import { validateChangePassword } from '../../utils/formValidation.js'

const EMPTY_PASSWORDS = { old_password: '', new_password: '', confirm_password: '' }

export default function AdminSettings() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [deleteReason, setDeleteReason] = useState('')
  const [status, setStatus] = useState({ type: '', message: '', loading: false })

  function updatePassword(key) {
    return (event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))
  }

  async function changePassword(event) {
    event.preventDefault()
    const validationError = validateChangePassword(passwords)
    if (validationError) {
      setStatus({ type: 'error', message: validationError, loading: false })
      return
    }

    setStatus({ type: '', message: '', loading: true })
    try {
      await profileApi.changePassword({ oldPassword: passwords.old_password, newPassword: passwords.new_password, confiomPassword: passwords.confirm_password })
      storage.clearAuth()
      navigate('/login', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', message: error.message, loading: false })
    }
  }

  async function removeAccount() {
    if (!window.confirm('Permanently deactivate this Admin account?')) return
    const storedUser = storage.get(USER_KEY) || {}
    const claims = getTokenClaims(storage.get(TOKEN_KEY)) || {}
    const email = storedUser.email || ''
    const userId = claims.id || claims._id || claims.user_id || storedUser.id || storedUser._id || ''
    if (!email || !userId) {
      setStatus({ type: 'error', message: 'Your session is missing the account identity required for deletion. Sign out and sign in again.', loading: false })
      return
    }

    setStatus({ type: '', message: '', loading: true })
    try {
      await profileApi.delete({ email, user_id: userId, reason: deleteReason.trim() })
      storage.clearAuth()
      navigate('/', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', message: error.message, loading: false })
    }
  }

  return <>
    <header className="admin-header"><div><h1>Admin settings</h1><p>Manage password security and account access.</p></div></header>
    <form className="vendor-card vendor-form settings-form" onSubmit={changePassword} noValidate>
      <h2>Change password</h2>
      <PasswordField label="Current password" value={passwords.old_password} onChange={updatePassword('old_password')} showStrength={false} autoComplete="current-password" />
      <PasswordField label="New password" value={passwords.new_password} onChange={updatePassword('new_password')} />
      <PasswordField label="Confirm new password" value={passwords.confirm_password} onChange={updatePassword('confirm_password')} showStrength={false} />
      {status.message && <p className={`form-message ${status.type}`} role="alert">{status.message}</p>}
      <button className="vendor-button" disabled={status.loading}>{status.loading ? 'Updating…' : 'Update password'}</button>
    </form>
    <section className="vendor-card danger-zone">
      <h2>Danger zone</h2>
      <p>Deactivating this account immediately removes its platform access.</p>
      <label className="vendor-form">Reason (optional)<textarea rows="4" maxLength="500" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} /></label>
      <button className="vendor-button danger" type="button" disabled={status.loading} onClick={removeAccount}>Deactivate Admin account</button>
    </section>
  </>
}
