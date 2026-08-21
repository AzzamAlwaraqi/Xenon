// Libraries
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import { packageApi } from '../../services/api.js'
import { getPackageId, getRecord } from '../../utils/vendorData.js'

// Constants
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const EMPTY_PACKAGE = {
  package_name: '',
  package_description: '',
  package_price: '',
  package_type: 'cultural',
  package_status: 'active',
  startDate: '',
  endDate: '',
  max_people: '',
  package_image: null,
}

function dateInputValue(value) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizePackage(record) {
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
  }
}

function validatePackage(form, edit) {
  if (form.package_name.trim().length < 3) return 'Package name must contain at least 3 characters.'
  if (!form.package_description.trim()) return 'Add a package description.'
  if (form.package_description.trim().length > 500) return 'Description must not exceed 500 characters.'
  if (form.package_price === '' || Number(form.package_price) < 0) return 'Enter a valid non-negative price.'
  if (!form.startDate || !form.endDate) return 'Select both start and end dates.'
  if (new Date(form.endDate) <= new Date(form.startDate)) return 'End date must be after the start date.'
  if (!Number.isInteger(Number(form.max_people)) || Number(form.max_people) < 1 || Number(form.max_people) > 100) return 'Capacity must be a whole number from 1 to 100.'
  if (!edit && !form.package_image) return 'Choose a JPEG, PNG, or WebP cover photo.'
  if (form.package_image && !ALLOWED_IMAGE_TYPES.has(form.package_image.type)) return 'Cover photo must be JPEG, PNG, or WebP.'
  if (form.package_image && form.package_image.size > MAX_IMAGE_BYTES) return 'Cover photo must be 5 MB or smaller.'
  return ''
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
    const validationError = validatePackage(form, edit)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== '') body.append(key, value)
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
          <label>Description<textarea rows="7" maxLength="500" value={form.package_description} onChange={updateField('package_description')} required /></label>
          <VendorField label="Price per traveller (JOD)" type="number" min="0" step="0.01" value={form.package_price} onChange={updateField('package_price')} required />
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
            <VendorField label="Start date" type="date" value={form.startDate} onChange={updateField('startDate')} required />
            <VendorField label="End date" type="date" min={form.startDate || undefined} value={form.endDate} onChange={updateField('endDate')} required />
          </div>
        </section>

        <aside className="vendor-card vendor-form">
          <h2>Publishing</h2>
          <label>
            Status
            <select value={form.package_status} onChange={updateField('package_status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <VendorField label="Maximum travellers" type="number" min="1" max="100" step="1" value={form.max_people} onChange={updateField('max_people')} required />
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
