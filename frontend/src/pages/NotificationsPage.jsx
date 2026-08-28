// Libraries
import { useState } from 'react'

// Components and services
import { VendorInfo, VendorNotice, VendorStatus } from '../components/vendor/VendorUi.jsx'
import useApi from '../hooks/useApi.js'
import { notificationApi } from '../services/api.js'
import { validateBroadcast } from '../utils/formValidation.js'
import { getCollection, getId } from '../utils/vendorData.js'

// Notifications shared by vendor and administrator portals
export default function NotificationsPage({ role = 'vendor' }) {
  const [refresh, setRefresh] = useState(0)
  const [tab, setTab] = useState('inbox')
  const [showComposer, setShowComposer] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'broadcast', message: '', targetAudience: role === 'admin' ? 'all' : 'users_only' })
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const state = useApi(tab === 'inbox' ? notificationApi.getMine : notificationApi.getSent, [refresh, tab])
  const notifications = getCollection(state.data)

  async function run(action, successMessage) {
    setBusy(successMessage)
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
      setRefresh((value) => value + 1)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy('')
    }
  }

  async function sendBroadcast(event) {
    event.preventDefault()
    const validationError = validateBroadcast(form, role)
    if (validationError) {
      setMessage(validationError)
      return
    }
    await run(() => notificationApi.broadcast({ ...form, title: form.title.trim(), message: form.message.trim() }), 'Broadcast submitted.')
    setForm({ title: '', type: 'broadcast', message: '', targetAudience: role === 'admin' ? 'all' : 'users_only' })
    setShowComposer(false)
  }

  return (
    <>
      <header className="admin-header">
        <div><h1>Notifications</h1><p>Review account alerts and keep the notification inbox current.</p></div>
        <div className="row-actions"><button className="admin-primary" onClick={() => setShowComposer((value) => !value)}>{showComposer ? 'Close composer' : 'Send broadcast'}</button>{tab === 'inbox' && <button className="vendor-button secondary" disabled={busy || !notifications.length} onClick={() => run(notificationApi.markAllRead, 'All notifications marked as read.')}>Mark all read</button>}</div>
      </header>
      <div className="role-tabs" style={{ maxWidth: 320 }}><button type="button" className={`role-tab ${tab === 'inbox' ? 'active' : ''}`} onClick={() => setTab('inbox')}>Inbox</button><button type="button" className={`role-tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>Sent</button></div>
      {showComposer && <form className="vendor-card vendor-form" onSubmit={sendBroadcast} noValidate><h2>New broadcast</h2><label>Title<input value={form.title} minLength="3" maxLength="100" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required /></label><label>Message<textarea rows="5" value={form.message} minLength="5" maxLength="500" onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required /></label>{role === 'admin' && <label>Audience<select value={form.targetAudience} onChange={(event) => setForm((current) => ({ ...current, targetAudience: event.target.value }))}><option value="all">All accounts</option><option value="users_only">Travellers only</option><option value="vendors_only">Vendors only</option></select></label>}<button className="vendor-button" disabled={busy}>Send notification</button></form>}
      <VendorNotice state={state} empty={!notifications.length} />
      {message && <p className="admin-data-state">{message}</p>}
      <section className="vendor-stack">
        {notifications.map((item) => {
          const id = getId(item)
          return <article className="vendor-card" key={id}>
            <div className="row-actions" style={{ justifyContent: 'space-between' }}><h2>{item.title || item.notification_type || 'Notification'}</h2><VendorStatus value={item.is_read ? 'Read' : 'Unread'} /></div>
            <p>{item.notification_message || item.message || '-'}</p>
            <VendorInfo label="Received" value={item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'} />
            <div className="row-actions">
              {tab === 'inbox' && !item.is_read && <button className="vendor-button" disabled={busy} onClick={() => run(() => notificationApi.markRead(id), 'Notification marked as read.')}>Mark read</button>}
              {tab === 'inbox' && <button className="vendor-button danger" disabled={busy} onClick={() => run(() => notificationApi.remove(id), 'Notification removed.')}>Remove</button>}
            </div>
          </article>
        })}
      </section>
    </>
  )
}
