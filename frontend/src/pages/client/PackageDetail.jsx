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
import { localToday, validateBooking } from '../../utils/formValidation.js'
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

    const validationError = validateBooking(form, packageItem)
    if (validationError) {
      setStatus({ loading: false, message: validationError, type: 'error' })
      return
    }

    setStatus({ loading: true, message: '', type: '' })
    try {
      await bookingApi.create({
        package_Name: packageItem.package_name,
        vendor_id: packageItem.vendor_id?._id || packageItem.vendor_id?.id || packageItem.vendor_id,
        date: form.date,
        guests: Number(form.guests),
      })
      setStatus({ loading: false, message: 'Booking request sent. Track it from My Bookings.', type: 'success' })
    } catch (error) {
      setStatus({ loading: false, message: error.message, type: 'error' })
    }
  }

  const image = packageItem.images?.[0]?.url
  const packageStart = String(packageItem.startDate || '').slice(0, 10)
  const packageEnd = String(packageItem.endDate || '').slice(0, 10)
  const minimumDate = packageStart && packageStart > localToday() ? packageStart : localToday()
  const maximumGuests = Math.max(0, Math.min(5, Number(packageItem.available_seats ?? 5)))

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
              <label>Travel date<input type="date" min={minimumDate} max={packageEnd || undefined} value={form.date} onChange={updateField('date')} required /></label>
              <label>Guests<input type="number" min="1" max={maximumGuests || 1} step="1" value={form.guests} onChange={updateField('guests')} required /></label>
              {status.message && <p className={`form-message ${status.type}`}>{status.message}</p>}
              <button className="vendor-button" disabled={status.loading || maximumGuests < 1 || packageItem.package_status === 'inactive'}>{status.loading ? 'Requesting…' : maximumGuests < 1 ? 'Sold out' : 'Request booking'}</button>
            </form>
          </div>
        </section>
      )}
    </ClientShell>
  )
}
