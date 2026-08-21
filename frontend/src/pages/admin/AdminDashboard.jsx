// Libraries
import { Link } from 'react-router-dom'

// Components and services
import AdminShell from '../../components/admin/AdminShell.jsx'
import { VendorMetric } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { adminApi, reviewApi } from '../../services/api.js'
import { getCollection } from '../../utils/vendorData.js'

// Page component
export default function AdminDashboard() {
  const vendorsState = useApi(adminApi.getVendors)
  const reportsState = useApi(adminApi.getReports)
  const reviewsState = useApi(reviewApi.getAll)
  const vendors = getCollection(vendorsState.data)
  const reports = getCollection(reportsState.data)
  const reviews = getCollection(reviewsState.data)
  const pendingVendors = vendors.filter((item) => !item.approval_status || item.approval_status === 'pending')
  const pendingReports = reports.filter((item) => item.status === 'pending')
  const pendingReviews = reviews.filter((item) => item.review_status === 'in-progress')

  return (
    <AdminShell title="Admin console" subtitle="Keep the marketplace safe, fair, and well curated.">
      <section className="vendor-metrics">
        <VendorMetric label="Pending vendor approvals" value={vendorsState.loading ? '—' : pendingVendors.length} />
        <VendorMetric label="Open reports" value={reportsState.loading ? '—' : pendingReports.length} />
        <VendorMetric label="Reviews awaiting moderation" value={reviewsState.loading ? '—' : pendingReviews.length} />
        <VendorMetric label="Total vendors" value={vendorsState.loading ? '—' : vendors.length} />
      </section>

      <section className="vendor-grid two">
        <div className="vendor-card quick">
          <h2>Quick actions</h2>
          <Link className="vendor-button" to="/admin/vendors">Review vendor approvals</Link>
          <Link className="vendor-button secondary" to="/admin/reports">Handle moderation reports</Link>
          <Link className="vendor-button secondary" to="/admin/reviews">Moderate reviews</Link>
        </div>
      </section>
    </AdminShell>
  )
}
