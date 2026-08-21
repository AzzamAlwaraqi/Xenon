// Libraries
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { bookingApi } from '../../services/api.js'
import { getBookingId, getCollection } from '../../utils/vendorData.js'

// Page component
export default function Bookings() {
  const [tab, setTab] = useState('active')
  const activeState = useApi(bookingApi.getMine)
  const historyState = useApi(bookingApi.getHistory)
  const bookingsState = tab === 'active' ? activeState : historyState
  const bookings = getCollection(bookingsState.data)

  return (
    <ClientShell title="My bookings" subtitle="Track every journey you have requested or completed.">
      <div className="role-tabs" style={{ maxWidth: 320 }}>
        <button type="button" className={`role-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
        <button type="button" className={`role-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>

      <VendorNotice state={bookingsState} empty={!bookings.length} />
      <section className="vendor-stack">
        {bookings.map((booking) => (
          <article className="vendor-booking-row" key={getBookingId(booking)}>
            <div>
              <h2>{booking.package_id?.package_name || 'Package'}</h2>
              <p>{booking.vendor_id?.vendor_name || 'Vendor'} · {booking.number_of_people || '—'} guests · {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : '—'}</p>
            </div>
            <VendorStatus value={booking.status} />
            <Link className="vendor-button secondary" to={`/bookings/${getBookingId(booking)}`}>View</Link>
          </article>
        ))}
      </section>
    </ClientShell>
  )
}
