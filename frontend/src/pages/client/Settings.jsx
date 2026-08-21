// Libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import { profileApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'
import { validateChangePassword } from '../../utils/formValidation.js'

// Constants
const EMPTY_PASSWORDS = { old_password: '', new_password: '', confirm_password: '' }

// Page component
export default function Settings() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [message, setMessage] = useState('')
  const [reason, setReason] = useState('')

  function updatePassword(key) {
    return (event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))
  }

  async function changePassword(event) {
    event.preventDefault()
    const validationError = validateChangePassword(passwords)
    if (validationError) {
      setMessage(validationError)
      return
    }

    try {
      await profileApi.changePassword(passwords)
      setMessage('Password updated.')
      setPasswords(EMPTY_PASSWORDS)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function removeAccount() {
    if (!window.confirm('Permanently delete your Xenon account?')) return
    try {
      await profileApi.delete(reason)
      storage.clear()
      navigate('/')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <ClientShell title="Settings" subtitle="Manage password security and account access.">
      <form className="vendor-card vendor-form settings-form" onSubmit={changePassword}>
        <h2>Change password</h2>
        <VendorField label="Current password" type="password" value={passwords.old_password} onChange={updatePassword('old_password')} />
        <VendorField label="New password" type="password" value={passwords.new_password} onChange={updatePassword('new_password')} />
        <VendorField label="Confirm new password" type="password" value={passwords.confirm_password} onChange={updatePassword('confirm_password')} />
        <p className="vendor-hint">Use at least 8 characters with uppercase, lowercase, a number, and a special character.</p>
        {message && <p>{message}</p>}
        <button className="vendor-button">Update password</button>
      </form>

      <section className="vendor-card danger-zone">
        <h2>Danger zone</h2>
        <p>Deleting your account removes access to Xenon. Existing bookings remain on record.</p>
        <label>Reason (optional)<textarea rows="3" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <button className="vendor-button danger" onClick={removeAccount}>Delete my account</button>
      </section>
    </ClientShell>
  )
}
