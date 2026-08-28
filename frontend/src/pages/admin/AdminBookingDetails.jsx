// Libraries
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { vendorBookingApi } from '../../services/api.js'
import { validateBookingTransition } from '../../utils/formValidation.js'
import { getBookingPackage, getBookingTraveller, getRecord } from '../../utils/vendorData.js'

export default function AdminBookingDetails() {
  const { bookingId } = useParams()
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const state = useApi(() => vendorBookingApi.getById(bookingId), [bookingId, refresh])
  const booking = getRecord(state.data)

  async function updateStatus(status) {
    const validationError = validateBookingTransition(booking.status, status)
    if (validationError) {
      setMessage(validationError)
      return
    }
    setBusy(status)
    setMessage('')
    try {
      await vendorBookingApi.updateStatus(bookingId, status)
      setMessage(`Booking changed to ${status}.`)
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return <>
    <header className="admin-header"><div><h1>Booking details</h1><p>Review the traveller, package, price, and lifecycle status.</p></div><Link className="vendor-button secondary" to="/admin/bookings">Back to bookings</Link></header>
    <VendorNotice state={state} />
    {message && <p className="admin-data-state">{message}</p>}
    {!state.loading && !state.error && <><section className="vendor-grid two"><article className="vendor-card"><h2>Traveller</h2><VendorInfo label="Name" value={getBookingTraveller(booking)} /><VendorInfo label="Email" value={booking.user_id?.email} /><VendorInfo label="Phone" value={booking.user_id?.mobileNumber} /><VendorInfo label="Guests" value={booking.guests || booking.number_of_people} /></article><article className="vendor-card"><h2>Journey</h2><VendorInfo label="Package" value={getBookingPackage(booking)} /><VendorInfo label="Date" value={booking.date || booking.booking_date} /><VendorInfo label="Total" value={booking.total_price !== undefined ? `JOD ${booking.total_price}` : '-'} /><VendorStatus value={booking.status} /></article></section><div className="row-actions">{booking.status === 'pending' && <><button className="vendor-button" disabled={busy} onClick={() => updateStatus('accepted')}>Accept</button><button className="vendor-button danger" disabled={busy} onClick={() => updateStatus('rejected')}>Reject</button></>}{booking.status === 'accepted' && <button className="vendor-button secondary" disabled={busy} onClick={() => updateStatus('completed')}>Mark completed</button>}</div></>}
  </>
}
