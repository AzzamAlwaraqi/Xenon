// Libraries
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorMetric, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi, vendorBookingApi } from '../../services/api.js'
import { getBookingId, getBookingPackage, getBookingTraveller, getCollection } from '../../utils/vendorData.js'

// Page component
export default function VendorDashboard() {
  const packagesState = useApi(packageApi.getAll)
  const bookingsState = useApi(vendorBookingApi.getRequests)
  const packages = getCollection(packagesState.data)
  const bookings = getCollection(bookingsState.data)
  const pendingBookings = bookings.filter(hasStatus('pending'))
  const confirmedBookings = bookings.filter(hasStatus('confirm'))

  return (
    <VendorShell title="Vendor dashboard" subtitle="Here is what is happening with your experiences today.">
      <VendorNotice state={packagesState} empty={false} />
      <section className="vendor-metrics">
        <VendorMetric label="Active packages" value={packagesState.loading ? '—' : packagesState.error ? 'Unavailable' : packages.length} />
        <VendorMetric label="Pending requests" value={bookingsState.loading ? '—' : pendingBookings.length} />
        <VendorMetric label="Confirmed bookings" value={bookingsState.loading ? '—' : confirmedBookings.length} />
        <VendorMetric label="Profile" value="Complete" note="Keep details current" />
      </section>

      <section className="vendor-grid two">
        <div className="vendor-card">
          <h2>Recent booking requests</h2>
          <VendorNotice state={bookingsState} empty={!bookings.length} />
          {bookings.slice(0, 4).map((booking) => (
            <Link className="vendor-list-row" key={getBookingId(booking)} to={`/vendor/bookings/${getBookingId(booking)}`}>
              <strong>{getBookingTraveller(booking)}</strong>
              <span>{getBookingPackage(booking)}</span>
              <VendorStatus value={booking.status} />
            </Link>
          ))}
        </div>

        <div className="vendor-card quick">
          <h2>Quick actions</h2>
          <Link className="vendor-button" to="/vendor/packages/new"><Plus size={17} /> Create new package</Link>
          <Link className="vendor-button secondary" to="/vendor/bookings">Review booking requests</Link>
        </div>
      </section>
    </VendorShell>
  )
}

// Helper functions
function hasStatus(status) {
  return (item) => String(item.status || '').toLowerCase().includes(status)
}
