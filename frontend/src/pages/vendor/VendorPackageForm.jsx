// Libraries
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorField } from '../../components/vendor/VendorUi.jsx'
import { packageApi } from '../../services/api.js'
import { getPackageId, getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_PACKAGE = {
  package_name: '', location: '', duration: '', price: '', capacity: '',
  status: 'Draft', description: '', image: null,
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
      .then((data) => setForm((current) => ({ ...current, ...getRecord(data) })))
      .catch((error) => setStatus({ loading: false, message: error.message, type: 'error' }))
  }, [edit, id])

  function updateField(key) {
    return (event) => {
      const value = event.target.type === 'file' ? event.target.files[0] : event.target.value
      setForm((current) => ({ ...current, [key]: value }))
    }
  }

  async function submitPackage(event) {
    event.preventDefault()
    if (!form.package_name.trim() || !form.location.trim() || !String(form.price).trim()) {
      setStatus({ loading: false, message: 'Package name, location, and price are required.', type: 'error' })
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
      <form className="vendor-form-layout" onSubmit={submitPackage}>
        <section className="vendor-card vendor-form">
          <h2>Package basics</h2>
          <VendorField label="Package name" value={form.package_name} onChange={updateField('package_name')} required />
          <VendorField label="Location" value={form.location} onChange={updateField('location')} required />
          <VendorField label="Duration" value={form.duration} onChange={updateField('duration')} />
          <VendorField label="Price per traveller" type="number" min="0" value={form.price} onChange={updateField('price')} required />
          <label>Description<textarea rows="7" value={form.description} onChange={updateField('description')} /></label>
        </section>

        <aside className="vendor-card vendor-form">
          <h2>Publishing</h2>
          <label>
            Status
            <select value={form.status} onChange={updateField('status')}>
              <option>Draft</option><option>Published</option><option>Paused</option>
            </select>
          </label>
          <VendorField label="Capacity" type="number" min="1" value={form.capacity} onChange={updateField('capacity')} />
          <label>Cover photo<input type="file" accept="image/*" onChange={updateField('image')} /></label>
          {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
          <button className="vendor-button" disabled={status.loading}>
            {status.loading ? 'Saving…' : edit ? 'Save changes' : 'Create package'}
          </button>
        </aside>
      </form>
    </VendorShell>
  )
}
