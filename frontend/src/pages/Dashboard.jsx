// Libraries
import { CompassIcon, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

// Components and services
import ClientShell from '../components/client/ClientShell.jsx'
import { VendorMetric, VendorNotice, VendorStatus } from '../components/vendor/VendorUi.jsx'
import useApi from '../hooks/useApi.js'
import { bookingApi, packageApi } from '../services/api.js'
import { storage } from '../services/storage.js'
import { getBookingId, getCollection } from '../utils/vendorData.js'

// Page component
export default function Dashboard() {
  const user = storage.get('xenon_user')
  const bookingsState = useApi(bookingApi.getMine)
  const packagesState = useApi(packageApi.getAll)
  const bookings = getCollection(bookingsState.data)
  const packages = getCollection(packagesState.data)
  const pendingBookings = bookings.filter((item) => String(item.status || '').toLowerCase() === 'pending')

  return (
    <ClientShell title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Here is what is happening with your journey.">
      <section className="vendor-metrics">
        <VendorMetric label="Active bookings" value={bookingsState.loading ? '—' : bookings.length} />
        <VendorMetric label="Pending requests" value={bookingsState.loading ? '—' : pendingBookings.length} />
        <VendorMetric label="Packages to explore" value={packagesState.loading ? '—' : packages.length} />
        <VendorMetric label="Profile" value="Connected" note="Keep details current" />
      </section>

      <section className="vendor-grid two">
        <div className="vendor-card">
          <h2>Your upcoming journeys</h2>
          <VendorNotice state={bookingsState} empty={!bookings.length} />
          {bookings.slice(0, 4).map((booking) => (
            <Link className="vendor-list-row" key={getBookingId(booking)} to={`/bookings/${getBookingId(booking)}`}>
              <strong>{booking.package_id?.package_name || booking.package_name || 'Package'}</strong>
              <span>{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : '—'}</span>
              <VendorStatus value={booking.status} />
            </Link>
          ))}
        </div>

        <div className="vendor-card quick">
          <h2>Quick actions</h2>
          <Link className="vendor-button" to="/packages"><CompassIcon size={17} /> Browse packages</Link>
          <Link className="vendor-button secondary" to="/bookings">View all bookings</Link>
          <Link className="vendor-button secondary" to="/register/vendor"><Plus size={17} /> Become a partner</Link>
        </div>
      </section>
    </ClientShell>
  )
}
