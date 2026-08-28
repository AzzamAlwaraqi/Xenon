// Libraries
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi } from '../../services/api.js'
import { getCollection, getPackageId, getPackageImage } from '../../utils/vendorData.js'

// Page component
export default function VendorPackages() {
  const packagesState = useApi(packageApi.getMine)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const packages = getCollection(packagesState.data)
  const filteredPackages = packages.filter((item) => {
    const name = item.package_name || item.name || ''
    return name.toLowerCase().includes(query.toLowerCase()) && (!status || String(item.package_status || '').toLowerCase() === status)
  })

  return (
    <VendorShell title="Your packages" subtitle="Create, publish, and manage every Jordan experience.">
      <div className="vendor-toolbar">
        <div className="toolbar-fields"><input aria-label="Search packages" placeholder="Search packages" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter package status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <Link className="vendor-button" to="/vendor/packages/new"><Plus size={17} /> Create package</Link>
      </div>

      <VendorNotice state={packagesState} empty={!packages.length} />
      {!packagesState.loading && packages.length > 0 && filteredPackages.length === 0 && <p className="vendor-notice">No packages match the selected filters.</p>}
      <section className="vendor-stack">
        {filteredPackages.map((item) => {
          const id = getPackageId(item)
          return (
            <article className="vendor-package-row" key={id}>
              <div className="vendor-package-thumb">{getPackageImage(item) ? <img src={getPackageImage(item)} alt={`${item.package_name || item.name} cover`} loading="lazy" /> : <span>No image</span>}</div>
              <div>
                <h2>{item.package_name || item.name}</h2>
                <p>{item.package_type || 'Jordan experience'} · {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Dates pending'} · JOD {item.package_price ?? '—'}</p>
                <VendorStatus value={item.package_status || 'inactive'} />
              </div>
              <div className="row-actions">
                <Link className="vendor-button secondary" to={`/vendor/packages/${id}`}>View</Link>
                <Link className="vendor-button secondary" to={`/vendor/packages/${id}/edit`}>Edit</Link>
              </div>
            </article>
          )
        })}
      </section>
    </VendorShell>
  )
}
