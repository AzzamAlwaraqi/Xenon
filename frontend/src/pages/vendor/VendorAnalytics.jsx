// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorMetric } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi, vendorBookingApi } from '../../services/api.js'
import { getCollection, getPackageId } from '../../utils/vendorData.js'

// Page component
export default function VendorAnalytics() {
  const packagesState = useApi(packageApi.getAll)
  const bookingsState = useApi(vendorBookingApi.getRequests)
  const packages = getCollection(packagesState.data)
  const bookings = getCollection(bookingsState.data)
  const confirmedBookings = bookings.filter((item) => {
    return String(item.status || '').toLowerCase().includes('confirm')
  })
  const revenue = confirmedBookings.reduce((sum, item) => {
    return sum + Number(item.total || item.price || 0)
  }, 0)
  const error = packagesState.error || bookingsState.error

  return (
    <VendorShell title="Analytics" subtitle="Understand bookings and the experiences travellers value.">
      <section className="vendor-metrics">
        <VendorMetric label="Revenue" value={`JOD ${revenue.toLocaleString()}`} />
        <VendorMetric label="Bookings" value={bookings.length} />
        <VendorMetric label="Confirmed" value={confirmedBookings.length} />
        <VendorMetric label="Packages" value={packages.length} />
      </section>

      <div className="vendor-card analytics-card">
        <h2>Live overview</h2>
        <div className="analytics-bars">
          {packages.slice(0, 6).map((item, index) => (
            <div key={getPackageId(item)}>
              <span>{item.package_name || item.name}</span>
              <i style={{ width: `${Math.max(18, 90 - index * 12)}%` }} />
            </div>
          ))}
        </div>
        {error && <p className="form-message error">{error}</p>}
      </div>
    </VendorShell>
  )
}
