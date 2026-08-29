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
  company_name: '', address: '', city: '',
}

function normalizeProfile(record) {
  return {
    ...EMPTY_PROFILE,
    company_name: record.company_name || record.vendor_company_name || '',
    address: record.address || record.vendor_address || '',
    city: record.city || record.vendor_city || '',
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
        company_name: form.company_name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
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
        <VendorField label="Business name" minLength="2" maxLength="100" value={form.company_name || ''} onChange={updateField('company_name')} required />
        <VendorField label="Business address" value={form.address} onChange={updateField('address')} required />
        <VendorField label="City" value={form.city} onChange={updateField('city')} required />
        {message && <p>{message}</p>}
        <button className="vendor-button">Save profile</button>
      </form>
    </VendorShell>
  )
}
