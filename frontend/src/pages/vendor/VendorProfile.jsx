// Libraries
import { useEffect, useState } from 'react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField, VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { profileApi } from '../../services/api.js'
import { getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_PROFILE = {
  name: '', company_name: '', email: '', phone_no: '', address: '',
}

// Page component
export default function VendorProfile() {
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
    setMessage('Saving…')
    try {
      await profileApi.update(form)
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <VendorShell title="Business profile" subtitle="Keep your public identity and contact information accurate.">
      <VendorNotice state={profileState} />
      <form className="vendor-card vendor-form profile-form" onSubmit={saveProfile}>
        <h2>Business information</h2>
        <VendorField label="Contact name" value={form.name || ''} onChange={updateField('name')} />
        <VendorField label="Business name" value={form.company_name || ''} onChange={updateField('company_name')} />
        <VendorField label="Email" type="email" value={form.email || ''} onChange={updateField('email')} />
        <VendorField label="Phone" value={form.phone_no || ''} onChange={updateField('phone_no')} />
        <VendorField label="Business address" value={form.address || ''} onChange={updateField('address')} />
        {message && <p>{message}</p>}
        <button className="vendor-button">Save profile</button>
      </form>
    </VendorShell>
  )
}
