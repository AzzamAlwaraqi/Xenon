// Libraries
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi, vendorBookingApi } from '../../services/api.js'
import { getBookingId, getBookingPackage, getBookingTraveller, getCollection, getPackageId } from '../../utils/vendorData.js'

// Page component
export default function VendorBookings() {
  const packagesState = useApi(packageApi.getMine)
  const [packageId, setPackageId] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const packages = getCollection(packagesState.data)
  const activePackageId = packageId || getPackageId(packages[0]) || ''
  const bookingsState = useApi(
    () => activePackageId ? vendorBookingApi.getRequests(activePackageId) : Promise.resolve({ data: [] }),
    [activePackageId],
  )
  const pendingState = useApi(vendorBookingApi.getPendingCount)
  const bookings = getCollection(bookingsState.data)
  const filteredBookings = bookings.filter((booking) => `${getBookingTraveller(booking)} ${getBookingPackage(booking)} ${booking.booking_no || ''}`.toLowerCase().includes(query.toLowerCase()) && (!status || String(booking.status || '').toLowerCase() === status))

  const pendingCount = pendingState.data?.data?.pendingRequestsCount ?? '—'

  return (
    <VendorShell title="Booking requests" subtitle="Review new requests and keep travellers informed.">
      <section className="vendor-card">
        <span className="vendor-kicker">ALL PACKAGES</span>
        <h2>{pendingState.loading ? 'Loading…' : pendingCount} pending requests</h2>
        {pendingState.error && <p className="form-message error">{pendingState.error}</p>}
      </section>
      <div className="vendor-toolbar"><div className="toolbar-fields"><select aria-label="Select package" value={activePackageId} onChange={(event) => setPackageId(event.target.value)} disabled={packagesState.loading || !packages.length}><option value="">Select package</option>{packages.map((item) => <option key={getPackageId(item)} value={getPackageId(item)}>{item.package_name || 'Unnamed package'}</option>)}</select><input aria-label="Search bookings" placeholder="Search traveller, package, or reference" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter booking status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All request statuses</option><option value="pending">Pending</option><option value="pending_payment">Pending payment</option></select></div></div>
      <VendorNotice state={packagesState} empty={!packagesState.loading && !packages.length} />
      {activePackageId && <VendorNotice state={bookingsState} empty={!bookings.length} />}
      {!bookingsState.loading && bookings.length > 0 && filteredBookings.length === 0 && <p className="vendor-notice">No bookings match the selected filters.</p>}
      <section className="vendor-stack">
        {filteredBookings.map((booking) => (
          <article className="vendor-booking-row" key={getBookingId(booking)}>
            <div>
              <h2>{getBookingTraveller(booking)}</h2>
              <p>{getBookingPackage(booking)} · {booking.guests || booking.number_of_people || '—'} guests · {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'Date pending'}</p>
            </div>
            <VendorStatus value={booking.status} />
            <Link className="vendor-button secondary" to={`/vendor/bookings/${getBookingId(booking)}`}>Review</Link>
          </article>
        ))}
      </section>
    </VendorShell>
  )
}
