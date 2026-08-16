// Libraries
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import { profileApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'

// Constants
const EMPTY_PASSWORDS = { current_password: '', new_password: '' }

// Page component
export default function VendorSettings() {
  const navigate = useNavigate()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [message, setMessage] = useState('')
  const strongEnough = passwords.new_password.length >= 8
    && /[A-Za-z]/.test(passwords.new_password)
    && /\d/.test(passwords.new_password)

  function updatePassword(key) {
    return (event) => setPasswords((current) => ({ ...current, [key]: event.target.value }))
  }

  async function changePassword(event) {
    event.preventDefault()
    if (!strongEnough) {
      setMessage('Use at least 8 characters with letters and numbers.')
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
    if (!window.confirm('Permanently delete this vendor account?')) return
    try {
      await profileApi.delete('Vendor requested account deletion')
      storage.clear()
      navigate('/')
    } catch (error) {
      setMessage(error.message)
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
        <VendorField label="Current password" type="password" value={passwords.current_password} onChange={updatePassword('current_password')} />
        <VendorField label="New password" type="password" value={passwords.new_password} onChange={updatePassword('new_password')} />
        <p className="vendor-hint">Letters and numbers with 8+ characters are required. A symbol and 12+ characters make it stronger.</p>
        {message && <p>{message}</p>}
        <button className="vendor-button">Update password</button>
      </form>

      <section className="vendor-card danger-zone">
        <h2>Danger zone</h2>
        <p>Deleting your vendor account removes portal access. Existing booking records remain with Xenon.</p>
        <button className="vendor-button danger" onClick={removeAccount}>Delete vendor account</button>
      </section>
    </VendorShell>
  )
}
