// Libraries
import { useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { complaintApi } from '../../services/api.js'
import { validateResponseText } from '../../utils/formValidation.js'
import { getCollection, getId } from '../../utils/vendorData.js'

export default function AdminComplaints() {
  const [refresh, setRefresh] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState('')
  const [responseForm, setResponseForm] = useState({ status: 'accepted', admin_response: '' })
  const state = useApi(() => complaintApi.getAll({ page, limit: 10, status: statusFilter, priority: priorityFilter }), [refresh, statusFilter, priorityFilter, page])
  const complaints = getCollection(state.data)
  const pagination = state.data?.pagination || state.data?.data?.pagination || {}
  const totalPages = Number(pagination.totalPages) || 1

  function openResponse(complaint) {
    const complaintId = getId(complaint) || complaint.complaint_id
    setEditingId(complaintId)
    setResponseForm({ status: complaint.complaint_status === 'cancelled' ? 'pending' : complaint.complaint_status || 'accepted', admin_response: complaint.admin_response || '' })
    setMessage('')
  }

  async function respond(event, complaintId) {
    event.preventDefault()
    const { status, admin_response: adminResponse } = responseForm
    if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
      setMessage('Choose pending, accepted, rejected, or completed.')
      return
    }
    const validationError = validateResponseText(adminResponse, { required: false, max: 1000, label: 'Administrative response' })
    if (validationError) {
      setMessage(validationError)
      return
    }
    setBusy(complaintId)
    setMessage('')
    try {
      await complaintApi.respond(complaintId, { status, admin_response: adminResponse.trim() || undefined })
      setMessage('Complaint response saved.')
      setEditingId('')
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return <>
    <header className="admin-header"><div><h1>Complaints</h1><p>Investigate service complaints, record decisions, and close resolved cases.</p></div><div className="row-actions"><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }} aria-label="Filter complaint status"><option value="">All statuses</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><select value={priorityFilter} onChange={(event) => { setPriorityFilter(event.target.value); setPage(1) }} aria-label="Filter complaint priority"><option value="">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div></header>
    {message && <p className="admin-data-state">{message}</p>}
    <VendorNotice state={state} empty={!complaints.length} />
    <section className="vendor-stack">{complaints.map((complaint) => {
      const id = getId(complaint) || complaint.complaint_id
      return <article className="vendor-card" key={id}><div className="row-actions" style={{ justifyContent: 'space-between' }}><h2>{complaint.complaint_title || 'Complaint'}</h2><VendorStatus value={complaint.complaint_status || 'Pending'} /></div><VendorInfo label="Reference" value={complaint.complaint_id || id} /><VendorInfo label="Priority" value={complaint.complaint_priority} /><VendorInfo label="Type" value={complaint.complaint_type} /><VendorInfo label="Traveller" value={complaint.user_id?.name || complaint.user_id?.email} /><VendorInfo label="Vendor" value={complaint.vendor_id?.vendor_company || complaint.vendor_id} /><VendorInfo label="Booking" value={complaint.booking_id} /><p>{complaint.complaint_message}</p>{(complaint.vendor_reply || complaint.reply) && <p className="vendor-hint"><strong>Vendor reply:</strong> {complaint.vendor_reply || complaint.reply}</p>}{complaint.admin_response && <p className="vendor-hint"><strong>Administrative response:</strong> {complaint.admin_response}</p>}{editingId === id && <form className="vendor-form" onSubmit={(event) => respond(event, id)} noValidate><label>Status<select value={responseForm.status} onChange={(event) => setResponseForm((current) => ({ ...current, status: event.target.value }))}><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></select></label><label>Administrative response<textarea rows="4" maxLength="1000" value={responseForm.admin_response} onChange={(event) => setResponseForm((current) => ({ ...current, admin_response: event.target.value }))} /></label><div className="row-actions"><button className="vendor-button" disabled={busy === id}>{busy === id ? 'Saving…' : 'Save response'}</button><button className="vendor-button secondary" type="button" onClick={() => setEditingId('')}>Cancel</button></div></form>}<button className="vendor-button" disabled={busy === id} onClick={() => openResponse(complaint)}>Respond and update status</button></article>
    })}</section>
    {totalPages > 1 && <nav className="row-actions" aria-label="Complaint pages"><button className="vendor-button secondary" disabled={page <= 1 || state.loading} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button className="vendor-button secondary" disabled={page >= totalPages || state.loading} onClick={() => setPage((value) => value + 1)}>Next</button></nav>}
  </>
}
