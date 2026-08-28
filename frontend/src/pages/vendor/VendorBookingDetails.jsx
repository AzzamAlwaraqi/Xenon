// Libraries
import { useState } from 'react'
import { useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { vendorBookingApi } from '../../services/api.js'
import { validateBookingTransition } from '../../utils/formValidation.js'
import { getBookingPackage, getBookingTraveller, getRecord } from '../../utils/vendorData.js'

// Page component
export default function VendorBookingDetails() {
  const { bookingId: id } = useParams()
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const bookingState = useApi(() => vendorBookingApi.getById(id), [id, refresh])
  const booking = getRecord(bookingState.data)

  async function updateDecision(status) {
    const validationError = validateBookingTransition(booking.status, status)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }
    setBusy(status)
    setMessage({ type: '', text: '' })
    try {
      await vendorBookingApi.updateStatus(id, status)
      setMessage({ type: 'success', text: `Booking status changed to ${status}.` })
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy('')
    }
  }

  return (
    <VendorShell title={`Booking request ${booking.booking_no || booking.reference || ''}`} subtitle={`${booking.status || 'Pending'} response`}>
      <VendorNotice state={bookingState} />
      {!bookingState.loading && !bookingState.error && (
        <section className="vendor-grid two">
          <div className="vendor-card">
            <h2>Traveller details</h2>
            <VendorInfo label="Name" value={getBookingTraveller(booking)} />
            <VendorInfo label="Email" value={booking.user_id?.email || booking.user?.email || booking.email} />
            <VendorInfo label="Phone" value={booking.user_id?.mobileNumber || booking.phone_no || booking.phone} />
            <VendorInfo label="Special request" value={booking.special_request || booking.notes || 'None'} />
          </div>
          <div className="vendor-card">
            <h2>Trip summary</h2>
            <VendorInfo label="Package" value={getBookingPackage(booking)} />
            <VendorInfo label="Date" value={(booking.date || booking.booking_date) ? new Date(booking.date || booking.booking_date).toLocaleDateString() : '—'} />
            <VendorInfo label="Guests" value={booking.guests || booking.number_of_people} />
            <VendorInfo label="Total" value={booking.total_price != null ? `JOD ${booking.total_price}` : '—'} />
            <VendorInfo label="Payment" value={booking.payment_status || booking.payment?.payment_status || 'Not recorded'} />
            <VendorStatus value={booking.status} />
          </div>
        </section>
      )}
      {message.text && <p className={`form-message ${message.type}`}>{message.text}</p>}
      {!bookingState.loading && !bookingState.error && <div className="row-actions">
        {booking.status === 'pending' && <><button className="vendor-button danger" disabled={busy} onClick={() => updateDecision('rejected')}>Reject request</button><button className="vendor-button" disabled={busy} onClick={() => updateDecision('accepted')}>Accept booking</button></>}
        {booking.status === 'accepted' && <button className="vendor-button" disabled={busy} onClick={() => updateDecision('completed')}>Mark completed</button>}
      </div>}
    </VendorShell>
  )
}
