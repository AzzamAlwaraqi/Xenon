// Libraries
import { Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

// Components and services
import ClientShell from '../../components/client/ClientShell.jsx'
import { VendorNotice } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { packageApi } from '../../services/api.js'
import { getCollection, getPackageId } from '../../utils/vendorData.js'

// Page component
export default function Packages() {
  const packagesState = useApi(packageApi.getAll)
  const [query, setQuery] = useState('')
  const packages = getCollection(packagesState.data)
  const filteredPackages = packages.filter((item) => {
    const name = item.package_name || ''
    const type = item.package_type || ''
    return `${name} ${type}`.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <ClientShell title="Explore packages" subtitle="Curated, artisanal journeys across Jordan, ready to book.">
      <div className="vendor-toolbar">
        <input aria-label="Search packages" placeholder="Search by name or type" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <VendorNotice state={packagesState} empty={!packages.length} />
      <section className="package-grid">
        {filteredPackages.map((item) => {
          const id = getPackageId(item)
          const image = item.images?.[0]?.url
          return (
            <Link className="package-tile" key={id} to={`/packages/${id}`}>
              <div className="package-tile-image">{image && <img src={image} alt="" />}</div>
              <div className="package-tile-body">
                <span className="card-kicker">{item.vendor_id?.vendor_name || 'Xenon Partner'}</span>
                <h3>{item.package_name}</h3>
                <p>{item.package_description}</p>
                <div className="package-tile-foot">
                  <span>JOD {item.package_price}</span>
                  {item.ratingsQuantity > 0 && <span className="rating-chip"><Star size={13} fill="currentColor" /> {item.ratingsAverage}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </section>
    </ClientShell>
  )
}
