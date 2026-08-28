// Libraries
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import { packageApi } from '../../services/api.js'
import { localToday, validatePackage } from '../../utils/formValidation.js'
import { getPackageId, getRecord } from '../../utils/vendorData.js'

// Constants
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EDIT_FIELDS = new Set(['package_name', 'package_price', 'package_image'])
const EMPTY_PACKAGE = {
  package_name: '',
  package_description: '',
  package_price: '',
  package_type: 'cultural',
  package_status: 'active',
  startDate: '',
  endDate: '',
  max_people: '',
  itinerary: '',
  included_services: '',
  meeting_point: '',
  cancellation_policy: '',
  package_image: null,
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizePackage(record) {
  const details = record.details || record.package_details || record
  return {
    ...EMPTY_PACKAGE,
    package_name: record.package_name || '',
    package_description: record.package_description || '',
    package_price: record.package_price ?? '',
    package_type: record.package_type || 'cultural',
    package_status: record.package_status || 'active',
    startDate: dateInputValue(record.startDate),
    endDate: dateInputValue(record.endDate),
    max_people: record.max_people ?? '',
    itinerary: formatDetails(details.itinerary),
    included_services: formatDetails(details.included_services),
    meeting_point: details.meeting_point || '',
    cancellation_policy: details.cancellation_policy || '',
  }
}

function formatDetails(value) {
  if (!value) return ''
  if (!Array.isArray(value)) return String(value)
  return value.map((item) => item.activities || item.description || item.title || String(item)).join('\n')
}

function nonEmptyLines(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function serializeDetails(key, value) {
  if (key === 'itinerary') {
    return JSON.stringify(nonEmptyLines(value).map((activities, index) => ({ day_number: index + 1, title: `Day ${index + 1}`, activities })))
  }
  if (key === 'included_services') {
    return JSON.stringify(nonEmptyLines(value).map((title) => ({ title, description: '' })))
  }
  return value
}

// Page component
export default function VendorPackageForm({ edit = false }) {
  const { packageId: id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_PACKAGE)
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })

  useEffect(() => {
    if (!edit || !id) return
    packageApi
      .getById(id)
      .then((data) => setForm(normalizePackage(getRecord(data))))
      .catch((error) => setStatus({ loading: false, message: error.message, type: 'error' }))
  }, [edit, id])

  function updateField(key) {
    return (event) => {
      const value = event.target.type === 'file' ? event.target.files?.[0] || null : event.target.value
      setForm((current) => ({ ...current, [key]: value }))
    }
  }

  async function submitPackage(event) {
    event.preventDefault()
    const validationError = validatePackage(form, edit, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (edit && !EDIT_FIELDS.has(key)) return
      if (value !== null && value !== '') body.append(key, serializeDetails(key, value))
    })

    try {
      const result = edit ? await packageApi.update(id, body) : await packageApi.create(body)
      const savedId = getPackageId(getRecord(result)) || id
      navigate(savedId ? `/vendor/packages/${savedId}` : '/vendor/packages')
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  return (
    <VendorShell
      title={edit ? 'Edit package' : 'Create a package'}
      subtitle={edit ? 'Update details without losing booking history.' : 'Turn a local experience into a clear, bookable journey.'}
    >
      <form className="vendor-form-layout" onSubmit={submitPackage} noValidate>
        <section className="vendor-card vendor-form">
          <h2>Package basics</h2>
          <VendorField label="Package name" maxLength="100" value={form.package_name} onChange={updateField('package_name')} required />
          <VendorField label="Price per traveller (JOD)" type="number" min="0" step="0.01" value={form.package_price} onChange={updateField('package_price')} required />
          {!edit && <>
            <label>Description<textarea rows="7" maxLength="500" value={form.package_description} onChange={updateField('package_description')} required /></label>
            <label>
              Experience type
              <select value={form.package_type} onChange={updateField('package_type')} required>
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="relaxation">Relaxation</option>
                <option value="historical">Historical</option>
                <option value="family">Family</option>
              </select>
            </label>
            <div className="field-grid">
              <VendorField label="Start date" type="date" min={localToday()} max={form.endDate || undefined} value={form.startDate} onChange={updateField('startDate')} required />
              <VendorField label="End date" type="date" min={form.startDate || localToday()} value={form.endDate} onChange={updateField('endDate')} required />
            </div>
          </>}
          {!edit && <fieldset className="vendor-form detail-fieldset">
            <h2>Experience details</h2>
            <label>Itinerary<textarea rows="5" value={form.itinerary} onChange={updateField('itinerary')} placeholder="Describe the daily activities and schedule." /></label>
            <label>Included services<textarea rows="4" value={form.included_services} onChange={updateField('included_services')} placeholder="Transport, meals, guide..." /></label>
            <VendorField label="Meeting point" value={form.meeting_point} onChange={updateField('meeting_point')} placeholder="Exact meeting location" required />
            <label>Cancellation policy<textarea rows="4" value={form.cancellation_policy} onChange={updateField('cancellation_policy')} /></label>
          </fieldset>}
          {edit && <p className="vendor-hint">Postman permits changing only the package name, price, and cover photo.</p>}
        </section>

        <aside className="vendor-card vendor-form">
          <h2>Publishing</h2>
          {!edit && <>
            <label>
              Status
              <select value={form.package_status} onChange={updateField('package_status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <VendorField label="Maximum travellers" type="number" min="1" max="100" step="1" value={form.max_people} onChange={updateField('max_people')} required />
          </>}
          <label>
            Cover photo
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={updateField('package_image')} required={!edit} />
          </label>
          <p className="vendor-hint">JPEG, PNG, or WebP. Maximum size: 5 MB.</p>
          {status.message && <p className={`form-message ${status.type}`} role="alert">{status.message}</p>}
          <button className="vendor-button" disabled={status.loading}>
            {status.loading ? 'Saving…' : edit ? 'Save changes' : 'Create package'}
          </button>
        </aside>
      </form>
    </VendorShell>
  )
}
