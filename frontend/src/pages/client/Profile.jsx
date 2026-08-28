// Libraries
import { useEffect, useState } from 'react'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorField, VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { profileApi } from '../../services/api.js'
import { normalizePhone, validateProfile } from '../../utils/formValidation.js'
import { getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_PROFILE = { name: '', email: '', mobileNumber: '', DateOfBirth: '' }

// Page component
export default function Profile() {
  const profileState = useApi(profileApi.getMe)
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // API data arrives after the controlled form is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profileState.data) setForm((current) => ({ ...current, ...getRecord(profileState.data) }))
  }, [profileState.data])

  function updateField(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    const validationError = validateProfile(form)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setMessage('Saving…')
    try {
      await profileApi.update({ name: form.name.trim(), email: form.email.trim().toLowerCase(), mobileNumber: normalizePhone(form.mobileNumber) })
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <ClientShell title="Your profile" subtitle="Keep your travel identity and contact information accurate.">
      <VendorNotice state={profileState} />
      <form className="vendor-card vendor-form profile-form" onSubmit={saveProfile} noValidate>
        <h2>Personal information</h2>
        <VendorField label="Full name" minLength="2" maxLength="100" value={form.name || ''} onChange={updateField('name')} required />
        <VendorField label="Email" type="email" value={form.email || ''} onChange={updateField('email')} required />
        <VendorField label="Mobile number" inputMode="numeric" maxLength="10" value={form.mobileNumber || ''} onChange={updateField('mobileNumber')} required />
        {message && <p>{message}</p>}
        <button className="vendor-button">Save profile</button>
      </form>
    </ClientShell>
  )
}
