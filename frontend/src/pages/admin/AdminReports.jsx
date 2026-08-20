// Libraries
import { useState } from 'react'

// Components and services
import AdminShell from '../../components/admin/AdminShell.jsx'
import { VendorInfo, VendorNotice, VendorStatus } from '../../components/vendor/VendorUi.jsx'
import useApi from '../../hooks/useApi.js'
import { adminApi } from '../../services/api.js'
import { getCollection, getId } from '../../utils/vendorData.js'

// Page component
export default function AdminReports() {
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState('')
  const reportsState = useApi(adminApi.getReports, [refresh])
  const reports = getCollection(reportsState.data)

  async function resolve(reportId, action) {
    let adminNotes
    if (['suspend_user', 'delete_content'].includes(action)) {
      adminNotes = window.prompt('Admin notes (at least 10 characters, required for this action):')
      if (!adminNotes || adminNotes.trim().length < 10) return
    }

    setBusy(reportId)
    try {
      await adminApi.resolveReport(reportId, action, adminNotes)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy('')
    }
  }

  async function escalate(reportId) {
    const escalationNotes = window.prompt('Escalation notes (at least 10 characters):')
    if (!escalationNotes || escalationNotes.trim().length < 10) return

    setBusy(reportId)
    try {
      await adminApi.escalateReport(reportId, escalationNotes)
      setRefresh((value) => value + 1)
    } catch (error) {
      window.alert(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <AdminShell title="Moderation reports" subtitle="Review flagged content and users, and take action.">
      <VendorNotice state={reportsState} empty={!reports.length} />
      <section className="vendor-stack">
        {reports.map((report) => {
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
              <div className="row-actions">
                <button className="vendor-button secondary" disabled={closed || busy === id} onClick={() => resolve(id, 'dismiss')}>Dismiss</button>
                <button className="vendor-button secondary" disabled={closed || busy === id} onClick={() => resolve(id, 'warn_user')}>Warn user</button>
                <button className="vendor-button danger" disabled={closed || busy === id} onClick={() => resolve(id, 'suspend_user')}>Suspend user</button>
                <button className="vendor-button danger" disabled={closed || busy === id} onClick={() => resolve(id, 'delete_content')}>Delete content</button>
                <button className="vendor-button" disabled={closed || busy === id} onClick={() => escalate(id)}>Escalate</button>
              </div>
            </article>
          )
        })}
      </section>
    </AdminShell>
  )
}
