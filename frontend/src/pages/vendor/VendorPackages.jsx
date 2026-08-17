// Libraries
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi } from '../../services/api.js'
import { getCollection, getPackageId } from '../../utils/vendorData.js'

// Page component
export default function VendorPackages() {
  const packagesState = useApi(packageApi.getAll)
  const [query, setQuery] = useState('')
  const packages = getCollection(packagesState.data)
  const filteredPackages = packages.filter((item) => {
    const name = item.package_name || item.name || ''
    return name.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <VendorShell title="Your packages" subtitle="Create, publish, and manage every Jordan experience.">
      <div className="vendor-toolbar">
        <input aria-label="Search packages" placeholder="Search packages" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Link className="vendor-button" to="/vendor/packages/new"><Plus size={17} /> Create package</Link>
      </div>

      <VendorNotice state={packagesState} empty={!packages.length} />
      <section className="vendor-stack">
        {filteredPackages.map((item) => {
          const id = getPackageId(item)
          return (
            <article className="vendor-package-row" key={id}>
              <div className="vendor-package-thumb">{item.image && <img src={item.image} alt="" />}</div>
              <div>
                <h2>{item.package_name || item.name}</h2>
                <p>{item.location || item.city || 'Jordan'} · {item.duration || 'Duration pending'} · JOD {item.price || item.package_price || '—'}</p>
                <VendorStatus value={item.status || 'Published'} />
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
