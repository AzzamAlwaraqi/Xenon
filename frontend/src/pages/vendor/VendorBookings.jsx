// Libraries
import { Link } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { vendorBookingApi } from '../../services/api.js'
import { getBookingId, getBookingPackage, getBookingTraveller, getCollection } from '../../utils/vendorData.js'

// Page component
export default function VendorBookings() {
  const bookingsState = useApi(vendorBookingApi.getRequests)
  const bookings = getCollection(bookingsState.data)

  return (
    <VendorShell title="Booking requests" subtitle="Review new requests and keep travellers informed.">
      <VendorNotice state={bookingsState} empty={!bookings.length} />
      <section className="vendor-stack">
        {bookings.map((booking) => (
          <article className="vendor-booking-row" key={getBookingId(booking)}>
            <div>
              <h2>{getBookingTraveller(booking)}</h2>
              <p>{getBookingPackage(booking)} · {booking.guests || booking.number_of_people || '—'} guests</p>
            </div>
            <VendorStatus value={booking.status} />
            <Link className="vendor-button secondary" to={`/vendor/bookings/${getBookingId(booking)}`}>Review</Link>
          </article>
        ))}
      </section>
    </VendorShell>
  )
}
