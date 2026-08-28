// Libraries
import { Link, useNavigate, useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi } from '../../services/api.js'
import { getPackageImage, getRecord } from '../../utils/vendorData.js'

function getDetails(packageItem) {
  return packageItem.package_details || packageItem.details || packageItem
}

function detailText(item) {
  return item?.activities || item?.description || item?.title || String(item || '')
}

// Page component
export default function VendorPackageDetails() {
  const { packageId: id } = useParams()
  const navigate = useNavigate()
  const packageState = useApi(() => packageApi.getById(id), [id])
  const packageItem = getRecord(packageState.data)
  const details = getDetails(packageItem)

  async function removePackage() {
    if (!window.confirm('Pause or remove this package?')) return
    try {
      await packageApi.remove(id)
      navigate('/vendor/packages')
    } catch (error) {
      window.alert(error.message)
    }
  }

  return (
    <VendorShell title={packageItem.package_name || packageItem.name || 'Package details'} subtitle={`${packageItem.package_status || 'Package'} · Live package record`}>
      <VendorNotice state={packageState} />
      {!packageState.loading && !packageState.error && (
        <section className="vendor-card package-detail">
          <div className="package-cover">{getPackageImage(packageItem) ? <img src={getPackageImage(packageItem)} alt={packageItem.package_name || 'Package cover'} /> : <span>No package image available</span>}</div>
          <div>
            <VendorStatus value={packageItem.package_status || 'inactive'} />
            <p>{packageItem.package_description || 'No description has been added yet.'}</p>
            <div className="detail-facts">
              <span><b>Type</b>{packageItem.package_type || '—'}</span>
              <span><b>Dates</b>{packageItem.startDate && packageItem.endDate ? `${new Date(packageItem.startDate).toLocaleDateString()} – ${new Date(packageItem.endDate).toLocaleDateString()}` : '—'}</span>
              <span><b>Price</b>JOD {packageItem.package_price ?? '—'}</span>
              <span><b>Capacity</b>{packageItem.max_people ?? '—'}</span>
              <span><b>Available seats</b>{packageItem.available_seats ?? '—'}</span>
              <span><b>Meeting point</b>{details.meeting_point || '—'}</span>
            </div>
            <div className="row-actions">
              <Link className="vendor-button" to={`/vendor/packages/${id}/edit`}>Edit package</Link>
              <button className="vendor-button danger" onClick={removePackage}>Remove package</button>
            </div>
          </div>
        </section>
      )}
      {!packageState.loading && !packageState.error && (
        <section className="vendor-grid two">
          <article className="vendor-card detail-section"><h2>Itinerary</h2>{details.itinerary?.length ? <ol className="detail-list">{details.itinerary.map((item, index) => <li key={item.day_number || index}><strong>{item.title || `Day ${item.day_number || index + 1}`}</strong><span>{detailText(item)}</span></li>)}</ol> : <p className="vendor-hint">No itinerary has been added.</p>}</article>
          <article className="vendor-card detail-section"><h2>What is included</h2>{details.included_services?.length ? <ul className="detail-list compact">{details.included_services.map((item, index) => <li key={index}>{detailText(item)}</li>)}</ul> : <p className="vendor-hint">No included services listed.</p>}</article>
          <article className="vendor-card detail-section"><h2>Cancellation policy</h2><p>{details.cancellation_policy || 'Standard cancellation rules apply.'}</p></article>
        </section>
      )}
    </VendorShell>
  )
}
