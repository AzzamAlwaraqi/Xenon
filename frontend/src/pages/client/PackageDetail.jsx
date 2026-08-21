// Libraries
import { Star } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { bookingApi, packageApi } from '../../services/api.js'
import { storage, TOKEN_KEY } from '../../services/storage.js'
import { validateBooking } from '../../utils/formValidation.js'
import { getRecord } from '../../utils/vendorData.js'

// Constants
const EMPTY_BOOKING = { date: '', guests: 1 }

// Page component
export default function PackageDetail() {
  const { packageId: id } = useParams()
  const navigate = useNavigate()
  const packageState = useApi(() => packageApi.getById(id), [id])
  const packageItem = getRecord(packageState.data)
  const [form, setForm] = useState(EMPTY_BOOKING)
  const [status, setStatus] = useState({ loading: false, message: '', type: '' })

  function updateField(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function submitBooking(event) {
    event.preventDefault()
    if (!storage.get(TOKEN_KEY)) {
      navigate('/login', { state: { from: `/packages/${id}` } })
      return
    }

    const validationError = validateBooking(form)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    try {
      await bookingApi.create({
        package_Name: packageItem.package_name,
        VENDOR_Name: packageItem.vendor_id?.vendor_name,
        date: form.date,
        guests: Number(form.guests),
      })
      setStatus({ loading: false, message: 'Booking request sent. Track it from My Bookings.', type: 'success' })
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  const image = packageItem.images?.[0]?.url

  return (
    <ClientShell title={packageItem.package_name || 'Package details'} subtitle={packageItem.vendor_id?.vendor_name || 'Xenon Partner'}>
      <VendorNotice state={packageState} />
      {!packageState.loading && !packageState.error && (
        <section className="vendor-card package-detail">
          <div className="package-cover">{image && <img src={image} alt="" />}</div>
          <div>
            {packageItem.ratingsQuantity > 0 && (
              <p className="rating-chip"><Star size={14} fill="currentColor" /> {packageItem.ratingsAverage} · {packageItem.ratingsQuantity} reviews</p>
            )}
            <p>{packageItem.package_description || 'No description has been added yet.'}</p>
            <div className="detail-facts">
              <span><b>Type</b>{packageItem.package_type || '—'}</span>
              <span><b>Price</b>JOD {packageItem.package_price || '—'}</span>
              <span><b>Starts</b>{packageItem.startDate ? new Date(packageItem.startDate).toLocaleDateString() : '—'}</span>
              <span><b>Seats left</b>{packageItem.available_seats ?? '—'}</span>
            </div>

            <form className="vendor-form book-form" onSubmit={submitBooking}>
              <h2>Request to book</h2>
              <label>Travel date<input type="date" min={new Date().toISOString().split('T')[0]} value={form.date} onChange={updateField('date')} required /></label>
              <label>Guests<input type="number" min="1" max="5" value={form.guests} onChange={updateField('guests')} required /></label>
              {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
              <button className="vendor-button" disabled={status.loading}>{status.loading ? 'Requesting…' : 'Request booking'}</button>
            </form>
          </div>
        </section>
      )}
    </ClientShell>
  )
}
