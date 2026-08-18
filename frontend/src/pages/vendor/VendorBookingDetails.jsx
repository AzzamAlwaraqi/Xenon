// Libraries
import { useState } from 'react'
import { useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { vendorBookingApi } from '../../services/api.js'
import { getRecord } from '../../utils/vendorData.js'

// Page component
export default function VendorBookingDetails() {
  const { bookingId: id } = useParams()
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const bookingState = useApi(() => vendorBookingApi.getById(id), [id, refresh])
  const booking = getRecord(bookingState.data)

  async function updateDecision(status) {
    setBusy(status)
    try {
      await vendorBookingApi.updateStatus(id, status)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
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
            <VendorInfo label="Name" value={booking.user?.name || booking.client?.name || booking.name} />
            <VendorInfo label="Email" value={booking.user?.email || booking.client?.email || booking.email} />
            <VendorInfo label="Phone" value={booking.phone_no || booking.phone} />
            <VendorInfo label="Special request" value={booking.special_request || booking.notes || 'None'} />
          </div>
          <div className="vendor-card">
            <h2>Trip summary</h2>
            <VendorInfo label="Package" value={booking.package?.package_name || booking.package_name} />
            <VendorInfo label="Date" value={booking.date || booking.booking_date} />
            <VendorInfo label="Guests" value={booking.guests || booking.number_of_people} />
            <VendorStatus value={booking.status} />
          </div>
        </section>
      )}
      <div className="row-actions">
        <button className="vendor-button danger" disabled={busy} onClick={() => updateDecision('declined')}>Decline request</button>
        <button className="vendor-button" disabled={busy} onClick={() => updateDecision('confirmed')}>Confirm booking</button>
      </div>
    </VendorShell>
  )
}
