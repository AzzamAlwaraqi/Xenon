// Libraries
import { Link } from 'react-router-dom'
import { BarChart3, Plus } from 'lucide-react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorInfo, VendorMetric, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { analyticsApi, packageApi, vendorBookingApi } from '../../services/api.js'
import { formatCurrency, toNumber } from '../../utils/analyticsData.js'
import { getCollection } from '../../utils/vendorData.js'

// Page component
export default function VendorDashboard() {
  const packagesState = useApi(packageApi.getMine)
  const pendingState = useApi(vendorBookingApi.getPendingCount)
  const analyticsState = useApi(analyticsApi.vendor)
  const packages = getCollection(packagesState.data)
  const activePackages = packages.filter((item) => item.package_status === 'active').length
  const pendingRequests = toNumber(pendingState.data?.data?.pendingRequestsCount)
  const analytics = analyticsState.data?.data || {}
  const financials = analytics.financials || {}
  const quality = analytics.quality_score || {}
  const bookingStatuses = Array.isArray(analytics.bookings_overview) ? analytics.bookings_overview : []

  return (
    <VendorShell title="Vendor dashboard" subtitle="Here is what is happening with your experiences today.">
      <VendorNotice state={packagesState} empty={false} />
      <section className="vendor-metrics">
        <VendorMetric label="Active packages" value={packagesState.loading ? '—' : packagesState.error ? 'Unavailable' : activePackages} note={`${packages.length} total packages`} />
        <VendorMetric label="Pending requests" value={pendingState.loading ? '—' : pendingState.error ? 'Unavailable' : pendingRequests} note="Pending and pending payment" />
        <VendorMetric label="Total revenue" value={analyticsState.loading ? '—' : analyticsState.error ? 'Unavailable' : formatCurrency(financials.total_revenue)} note="Accepted and completed bookings" />
        <VendorMetric label="Average rating" value={analyticsState.loading ? '—' : analyticsState.error ? 'Unavailable' : `${toNumber(quality.average_rating).toFixed(1)} / 5`} note={`${toNumber(quality.total_complaints_received)} complaints`} />
      </section>

      <section className="vendor-grid two">
        <div className="vendor-card">
          <h2>Booking overview</h2>
          <VendorNotice state={analyticsState} empty={!bookingStatuses.length} />
          {bookingStatuses.map((item) => <div className="vendor-list-row" key={item.status}><VendorStatus value={item.status} /><VendorInfo label="Bookings" value={toNumber(item.count).toLocaleString()} /></div>)}
        </div>

        <div className="vendor-card quick">
          <h2>Quick actions</h2>
          <Link className="vendor-button" to="/vendor/packages/new"><Plus size={17} /> Create new package</Link>
          <Link className="vendor-button secondary" to="/vendor/bookings">Review booking requests</Link>
          <Link className="vendor-button secondary" to="/vendor/analytics"><BarChart3 size={17} /> Open analytics</Link>
        </div>
      </section>
    </VendorShell>
  )
}
