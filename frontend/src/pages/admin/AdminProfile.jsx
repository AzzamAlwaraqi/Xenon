// Libraries
import { useEffect, useState } from 'react'

// Components and services
import { VendorField, VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { profileApi } from '../../services/api.js'
import { normalizePhone, validateProfile } from '../../utils/formValidation.js'
import { getRecord } from '../../utils/vendorData.js'

const EMPTY_PROFILE = { name: '', email: '', mobileNumber: '' }

export default function AdminProfile() {
  const profileState = useApi(profileApi.getMe)
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const record = getRecord(profileState.data)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profileState.data) setForm({ name: record.name || '', email: record.email || '', mobileNumber: record.mobileNumber || '' })
  }, [profileState.data])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    const validationError = validateProfile(form)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      await profileApi.update({ name: form.name.trim(), email: form.email.trim().toLowerCase(), mobileNumber: normalizePhone(form.mobileNumber) })
      setMessage({ type: 'success', text: 'Admin profile saved.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  return <>
    <header className="admin-header"><div><h1>Admin profile</h1><p>Keep your platform account identity and contact details current.</p></div></header>
    <VendorNotice state={profileState} />
    <form className="vendor-card vendor-form profile-form" onSubmit={saveProfile} noValidate>
      <VendorField label="Full name" name="name" minLength="2" maxLength="100" value={form.name} onChange={updateField} required />
      <VendorField label="Email" type="email" name="email" value={form.email} onChange={updateField} required />
      <VendorField label="Mobile number" name="mobileNumber" inputMode="numeric" maxLength="10" value={form.mobileNumber} onChange={updateField} required />
      {message.text && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="vendor-button" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
    </form>
  </>
}
