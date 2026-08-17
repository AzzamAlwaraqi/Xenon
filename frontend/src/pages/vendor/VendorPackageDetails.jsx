// Libraries
import { Link, useNavigate, useParams } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi } from '../../services/api.js'
import { getRecord } from '../../utils/vendorData.js'

// Page component
export default function VendorPackageDetails() {
  const { packageId: id } = useParams()
  const navigate = useNavigate()
  const packageState = useApi(() => packageApi.getById(id), [id])
  const packageItem = getRecord(packageState.data)

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
    <VendorShell title={packageItem.package_name || packageItem.name || 'Package details'} subtitle={`${packageItem.status || 'Package'} · Live package record`}>
      <VendorNotice state={packageState} />
      {!packageState.loading && !packageState.error && (
        <section className="vendor-card package-detail">
          <div className="package-cover">{packageItem.image && <img src={packageItem.image} alt="" />}</div>
          <div>
            <VendorStatus value={packageItem.status || 'Published'} />
            <p>{packageItem.description || 'No description has been added yet.'}</p>
            <div className="detail-facts">
              <span><b>Location</b>{packageItem.location || 'Jordan'}</span>
              <span><b>Duration</b>{packageItem.duration || '—'}</span>
              <span><b>Price</b>JOD {packageItem.price || '—'}</span>
              <span><b>Capacity</b>{packageItem.capacity || '—'}</span>
            </div>
            <div className="row-actions">
              <Link className="vendor-button" to={`/vendor/packages/${id}/edit`}>Edit package</Link>
              <button className="vendor-button danger" onClick={removePackage}>Remove package</button>
            </div>
          </div>
        </section>
      )}
    </VendorShell>
  )
}
