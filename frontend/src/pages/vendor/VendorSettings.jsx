// Libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import PasswordField from '../../components/PasswordField.jsx'
import { profileApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'
import { isAcceptablePassword } from '../../utils/formValidation.js'

// Constants
const EMPTY_PASSWORDS = { old_password: '', new_password: '', confirm_password: '' }

// Page component
export default function VendorSettings() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [status, setStatus] = useState({ message: '', type: '', loading: false })

  function updatePassword(key) {
    return (event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))
  }

  async function changePassword(event) {
    event.preventDefault()
    if (!passwords.old_password) {
      setStatus({ message: 'Enter your current password.', type: 'error', loading: false })
      return
    }
    if (!isAcceptablePassword(passwords.new_password)) {
      setStatus({ message: 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.', type: 'error', loading: false })
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setStatus({ message: 'The new passwords do not match.', type: 'error', loading: false })
      return
    }
    if (passwords.old_password === passwords.new_password) {
      setStatus({ message: 'Choose a new password that differs from the current password.', type: 'error', loading: false })
      return
    }

    setStatus({ message: '', type: '', loading: true })
    try {
      await profileApi.changePassword(passwords)
      setStatus({ message: 'Password updated.', type: 'success', loading: false })
      setPasswords(EMPTY_PASSWORDS)
    } catch (error) {
      setStatus({ message: error.message, type: 'error', loading: false })
    }
  }

  async function removeAccount() {
    if (!window.confirm('Permanently delete this vendor account?')) return
    try {
      await profileApi.delete('Vendor requested account deletion')
      storage.clearAuth()
      navigate('/')
    } catch (error) {
      setStatus({ message: error.message, type: 'error', loading: false })
    }
  }

  return (
    <VendorShell title="Settings" subtitle="Manage password security and account access.">
      <section className="vendor-card">
        <h2>Notifications</h2>
        <label className="check-row"><input type="checkbox" defaultChecked /> Email me when a booking request arrives</label>
        <label className="check-row"><input type="checkbox" defaultChecked /> Email me when a traveller sends a message</label>
        <p className="vendor-hint">Notification choices are visual-only until the backend exposes a preferences endpoint.</p>
      </section>

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
        <p>Deleting your vendor account removes portal access. Existing booking records remain with Xenon.</p>
        <button className="vendor-button danger" onClick={removeAccount}>Delete vendor account</button>
      </section>
    </VendorShell>
  )
}
