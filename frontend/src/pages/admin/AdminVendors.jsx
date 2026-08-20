// Libraries
import { useState } from 'react'

// Components and services
import AdminShell from '../../components/admin/AdminShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { adminApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminVendors() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const vendorsState = useApi(adminApi.getVendors, [refresh])
  const vendors = getCollection(vendorsState.data)

  async function updateStatus(vendorId, status) {
    let rejectionReason
    if (status === 'rejected') {
      rejectionReason = window.prompt('Provide a rejection reason (at least 10 characters):')
      if (!rejectionReason || rejectionReason.trim().length < 10) return
    }

    setBusy(vendorId)
    try {
      await adminApi.updateVendorStatus(vendorId, status, rejectionReason)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <AdminShell title="Vendor approvals" subtitle="Review partner applications and manage account standing.">
      <VendorNotice state={vendorsState} empty={!vendors.length} />
      <section className="vendor-stack">
        {vendors.map((vendor) => {
          const id = getId(vendor)
          return (
            <article className="vendor-card" key={id}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{vendor.vendor_name}</h2>
                <VendorStatus value={vendor.approval_status || 'pending'} />
              </div>
              <VendorInfo label="Email" value={vendor.vendor_email} />
              <VendorInfo label="Phone" value={vendor.vendor_mobile} />
              <VendorInfo label="Type" value={vendor.vendor_type} />
              <VendorInfo label="Location" value={[vendor.vendor_city, vendor.vendor_country].filter(Boolean).join(', ')} />
              <div className="row-actions">
                <button className="vendor-button" disabled={busy === id} onClick={() => updateStatus(id, 'approved')}>Approve</button>
                <button className="vendor-button danger" disabled={busy === id} onClick={() => updateStatus(id, 'rejected')}>Reject</button>
                <button className="vendor-button secondary" disabled={busy === id} onClick={() => updateStatus(id, 'suspended')}>Suspend</button>
              </div>
            </article>
          )
        })}
      </section>
    </AdminShell>
  )
}
