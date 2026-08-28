// Libraries
import { useState } from 'react'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { complaintApi } from '../../services/api.js'
import { validateResponseText } from '../../utils/formValidation.js'
import { getCollection, getId } from '../../utils/vendorData.js'

export default function VendorComplaints() {
  const [refresh, setRefresh] = useState(0)
  const [drafts, setDrafts] = useState({})
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const state = useApi(complaintApi.againstVendor, [refresh])
  const complaints = getCollection(state.data)

  function updateDraft(complaintId, value) {
    setDrafts((current) => ({ ...current, [complaintId]: value }))
  }

  async function submitReply(event, complaintId) {
    event.preventDefault()
    const reply = drafts[complaintId] || ''
    const validationError = validateResponseText(reply, { min: 2, max: 1000, label: 'Complaint reply' })
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setBusy(complaintId)
    setMessage({ type: '', text: '' })
    try {
      await complaintApi.reply(complaintId, reply.trim())
      setDrafts((current) => ({ ...current, [complaintId]: '' }))
      setMessage({ type: 'success', text: 'Your reply was added to the complaint.' })
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setBusy('')
    }
  }

  return (
    <VendorShell title="Complaints" subtitle="Review traveller concerns involving your company and respond professionally.">
      {message.text && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <VendorNotice state={state} empty={!complaints.length} />
      <section className="vendor-stack">
        {complaints.map((complaint) => {
          const complaintId = getId(complaint) || complaint.complaint_id
          const previousReply = complaint.vendor_reply || complaint.reply

          return (
            <article className="vendor-card" key={complaintId}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{complaint.complaint_title || 'Complaint'}</h2>
                <VendorStatus value={complaint.complaint_status || 'Pending'} />
              </div>
              <VendorInfo label="Type" value={complaint.complaint_type} />
              <VendorInfo label="Priority" value={complaint.complaint_priority} />
              <p>{complaint.complaint_message}</p>
              {previousReply && <p className="vendor-hint"><strong>Your reply:</strong> {previousReply}</p>}
              <form className="vendor-form" onSubmit={(event) => submitReply(event, complaintId)} noValidate>
                <label>
                  {previousReply ? 'Update reply' : 'Reply to complaint'}
                  <textarea rows="4" minLength="2" maxLength="1000" value={drafts[complaintId] || ''} onChange={(event) => updateDraft(complaintId, event.target.value)} placeholder="Explain how you will address this concern" required />
                </label>
                <button className="vendor-button" disabled={busy === complaintId}>{busy === complaintId ? 'Sending…' : 'Send reply'}</button>
              </form>
            </article>
          )
        })}
      </section>
    </VendorShell>
  )
}
