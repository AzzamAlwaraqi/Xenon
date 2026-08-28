// Libraries
import { useMemo, useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { adminApi } from '../../services/api.js'
import { isUuid, validateResponseText } from '../../utils/formValidation.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminReports() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [actionForm, setActionForm] = useState({ reportId: '', action: '', notes: '' })
  const [historyUserId, setHistoryUserId] = useState('')
  const [history, setHistory] = useState(null)
  const reportsState = useApi(() => adminApi.reports(statusFilter ? { status: statusFilter } : {}), [refresh, statusFilter])
  const reports = getCollection(reportsState.data)
  const filteredReports = useMemo(() => reports.filter((report) => JSON.stringify(report).toLowerCase().includes(query.toLowerCase())), [reports, query])

  async function submitAction(event) {
    event.preventDefault()
    const { reportId, action, notes } = actionForm
    const notesRequired = ['suspend_user', 'delete_content', 'escalate'].includes(action)
    const validationError = validateResponseText(notes, { required: notesRequired, min: notesRequired ? 10 : 1, max: 1000, label: action === 'escalate' ? 'Escalation notes' : 'Admin notes' })
    if (validationError) {
      setMessage(validationError)
      return
    }
    setBusy(reportId)
    setMessage('')
    try {
      if (action === 'escalate') await adminApi.escalateReport(reportId, notes.trim())
      else await adminApi.resolveReport(reportId, action, notes.trim() || undefined)
      setMessage(action === 'escalate' ? 'Report escalated successfully.' : `Report resolved with action: ${action.split('_').join(' ')}.`)
      setActionForm({ reportId: '', action: '', notes: '' })
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function loadHistory(event) {
    event.preventDefault()
    const userId = historyUserId.trim()
    if (!isUuid(userId)) {
      setMessage('Enter a valid user UUID to view moderation history.')
      return
    }
    setBusy('history')
    setMessage('')
    try {
      const result = await adminApi.moderationHistory(userId)
      setHistory(result?.data || result)
    } catch (error) {
      setHistory(null)
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <header className="admin-header"><div><h1>Moderation reports</h1><p>Review flagged content and users, and take action.</p></div><div className="row-actions"><input aria-label="Search reports" placeholder="Search reports" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter report status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="escalated">Escalated</option><option value="closed">Closed</option></select></div></header>
      <section className="vendor-card"><form className="vendor-form" onSubmit={loadHistory} noValidate><h2>User moderation history</h2><label>User ID<input value={historyUserId} onChange={(event) => setHistoryUserId(event.target.value)} placeholder="User UUID" required /></label><button className="vendor-button" disabled={busy === 'history'}>{busy === 'history' ? 'Loading…' : 'View history'}</button></form>{history && <div><VendorInfo label="User" value={history.user_info?.name || history.user_info?.email} /><VendorInfo label="Warnings" value={history.user_info?.warnings_count ?? 0} /><VendorInfo label="Account status" value={history.user_info?.isActive === false ? 'Suspended' : 'Active'} /><VendorInfo label="Past violations" value={Array.isArray(history.past_violations) ? history.past_violations.length : 0} /></div>}</section>
      {message && <p className="admin-data-state">{message}</p>}
      <VendorNotice state={reportsState} empty={!reports.length} />
      <section className="vendor-stack">
        {filteredReports.map((report) => {
          const id = getId(report)
          const closed = ['resolved', 'dismissed', 'closed'].includes(report.status)
          return (
            <article className="vendor-card" key={id}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h2>{report.report_id || 'Report'} · {report.content_type}</h2>
                <VendorStatus value={report.status} />
              </div>
              <VendorInfo label="Reporter" value={report.reporter?.name || report.reporter?.email} />
              <VendorInfo label="Reported user" value={report.reported_user?.name || report.reported_user?.email} />
              <VendorInfo label="Reason" value={report.reason} />
              <VendorInfo label="Description" value={report.description} />
              {actionForm.reportId === id && <form className="vendor-form" onSubmit={submitAction} noValidate><label>{actionForm.action === 'escalate' ? 'Escalation notes' : 'Admin notes'}<textarea rows="4" minLength={['suspend_user', 'delete_content', 'escalate'].includes(actionForm.action) ? 10 : 1} maxLength="1000" value={actionForm.notes} onChange={(event) => setActionForm((current) => ({ ...current, notes: event.target.value }))} required={['suspend_user', 'delete_content', 'escalate'].includes(actionForm.action)} /></label><div className="row-actions"><button className="vendor-button" disabled={busy === id}>Confirm {actionForm.action.split('_').join(' ')}</button><button className="vendor-button secondary" type="button" onClick={() => setActionForm({ reportId: '', action: '', notes: '' })}>Cancel</button></div></form>}
              <div className="row-actions">
                {[['dismiss', 'Dismiss', 'secondary'], ['warn_user', 'Warn user', 'secondary'], ['suspend_user', 'Suspend user', 'danger'], ['delete_content', 'Delete content', 'danger'], ['escalate', 'Escalate', '']].map(([action, label, tone]) => <button key={action} className={`vendor-button ${tone}`} disabled={closed || busy === id} onClick={() => setActionForm({ reportId: id, action, notes: '' })}>{label}</button>)}
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
