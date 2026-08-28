// Libraries
import { useEffect, useState } from 'react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField, VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { profileApi } from '../../services/api.js'
import { validateProfile } from '../../utils/formValidation.js'
import { getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_PROFILE = {
  name: '', company_name: '', city: '', state: '', country: 'Jordan',
}

function normalizeProfile(record) {
  return {
    ...EMPTY_PROFILE,
    name: record.name || record.vendor_owner_id?.name || '',
    company_name: record.company_name || record.vendor_company || '',
    city: record.city || record.vendor_city || '',
    state: record.state || record.vendor_state || '',
    country: record.country || record.vendor_country || 'Jordan',
  }
}

// Page component
export default function VendorProfile() {
  const profileState = useApi(profileApi.getMe)
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // API data arrives after the controlled form is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profileState.data) setForm(normalizeProfile(getRecord(profileState.data)))
  }, [profileState.data])

  function updateField(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function saveProfile(event) {
    event.preventDefault()
    const validationError = validateProfile(form, { vendor: true })
    if (validationError) {
      setMessage(validationError)
      return
    }
    setMessage('Saving…')
    try {
      await profileApi.update({
        name: form.name.trim(),
        company_name: form.company_name.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
      })
      setMessage('Profile saved.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <VendorShell title="Business profile" subtitle="Keep your public identity and contact information accurate.">
      <VendorNotice state={profileState} />
      <form className="vendor-card vendor-form profile-form" onSubmit={saveProfile} noValidate>
        <h2>Business information</h2>
        <VendorField label="Contact name" minLength="2" maxLength="100" value={form.name || ''} onChange={updateField('name')} required />
        <VendorField label="Business name" minLength="2" maxLength="100" value={form.company_name || ''} onChange={updateField('company_name')} required />
        <div className="field-grid"><VendorField label="City" value={form.city} onChange={updateField('city')} /><VendorField label="Governorate" value={form.state} onChange={updateField('state')} /></div>
        <VendorField label="Country" value={form.country} onChange={updateField('country')} required />
        {message && <p>{message}</p>}
        <button className="vendor-button">Save profile</button>
      </form>
    </VendorShell>
  )
}
