// Libraries
import { useMemo, useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { adminApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminVendors() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [rejectingId, setRejectingId] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [message, setMessage] = useState('')
  const vendorsState = useApi(() => adminApi.vendors(statusFilter ? { vendor_status: statusFilter } : {}), [refresh, statusFilter])
  const vendors = getCollection(vendorsState.data)
  const filteredVendors = useMemo(() => vendors.filter((vendor) => JSON.stringify(vendor).toLowerCase().includes(query.toLowerCase())), [vendors, query])
  const selectedVendor = selected?.vendor || selected
  const selectedVerification = selected?.verification

  async function updateStatus(vendorId, status, reason) {
    setBusy(vendorId)
    setMessage('')
    try {
      await adminApi.updateVendorStatus(vendorId, status, reason)
      setMessage(`Vendor status changed to ${status}.`)
      setRejectingId('')
      setRejectionReason('')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  function submitRejection(event, vendorId) {
    event.preventDefault()
    const reason = rejectionReason.trim()
    if (reason.length < 10) {
      setMessage('Rejection reason must contain at least 10 characters.')
      return
    }
    updateStatus(vendorId, 'rejected', reason)
  }

  async function viewDetails(vendorId) {
    setBusy(vendorId)
    try {
      const result = await adminApi.getVendor(vendorId)
      setSelected(result.data || result)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <header className="admin-header"><div><h1>Vendor approvals</h1><p>Review partner applications and manage account standing.</p></div><div className="row-actions"><input aria-label="Search vendors" placeholder="Search vendors" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter vendor status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="pending_approval">Pending approval</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="inactive">Inactive</option></select></div></header>
      {message && <p className="admin-data-state">{message}</p>}
      <VendorNotice state={vendorsState} empty={!vendors.length} />
      {selected && <section className="vendor-card"><div className="row-actions" style={{ justifyContent: 'space-between' }}><h2>Application details</h2><button className="vendor-button secondary" onClick={() => setSelected(null)}>Close</button></div><VendorInfo label="Company" value={selectedVendor?.vendor_company_name} /><VendorInfo label="Owner" value={selectedVendor?.owner_user_id?.name} /><VendorInfo label="Email" value={selectedVendor?.owner_user_id?.email} /><VendorInfo label="Phone" value={selectedVendor?.owner_user_id?.mobileNumber} /><VendorInfo label="Address" value={[selectedVendor?.vendor_address, selectedVendor?.vendor_city].filter(Boolean).join(', ')} /><VendorInfo label="IBAN" value={selectedVerification?.iban_number} /><VendorInfo label="Rejection reason" value={selectedVendor?.rejection_reason} /><div className="row-actions">{[['commercial_register_image', 'Commercial registration'], ['vocational_license_image', 'Vocational licence'], ['tourism_license_image', 'Tourism licence'], ['owner_id_image', 'Owner ID'], ['iban_letter_image', 'IBAN letter']].map(([key, label]) => selectedVerification?.[key]?.url && <a className="text-link" href={selectedVerification[key].url} target="_blank" rel="noreferrer" key={key}>{label}</a>)}</div></section>}
      <section className="vendor-stack">
        {filteredVendors.map((vendor) => {
          const id = getId(vendor)
          const status = vendor.vendor_status || 'pending_approval'
          return (
            <article className="vendor-card" key={id}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{vendor.vendor_company_name || 'Vendor application'}</h2>
                <VendorStatus value={status} />
              </div>
              <VendorInfo label="Owner" value={vendor.owner_user_id?.name} />
              <VendorInfo label="Email" value={vendor.owner_user_id?.email} />
              <VendorInfo label="Phone" value={vendor.owner_user_id?.mobileNumber} />
              <VendorInfo label="Location" value={vendor.vendor_city} />
              {rejectingId === id && <form className="vendor-form" onSubmit={(event) => submitRejection(event, id)} noValidate><label>Rejection reason<textarea rows="4" minLength="10" maxLength="500" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} required /></label><div className="row-actions"><button className="vendor-button danger" disabled={busy === id}>Confirm rejection</button><button className="vendor-button secondary" type="button" onClick={() => setRejectingId('')}>Cancel</button></div></form>}
              <div className="row-actions">
                <button className="vendor-button secondary" disabled={busy === id} onClick={() => viewDetails(id)}>View details</button>
                {['pending_approval', 'rejected', 'inactive'].includes(status) && <button className="vendor-button" disabled={busy === id} onClick={() => updateStatus(id, 'approved')}>{status === 'pending_approval' ? 'Approve' : 'Activate'}</button>}
                {status === 'pending_approval' && <button className="vendor-button danger" disabled={busy === id} onClick={() => { setRejectingId(id); setRejectionReason('') }}>Reject</button>}
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
