// Libraries
import { useMemo, useState } from 'react'
import { Bell, BookOpen, MessageSquareWarning, Search, Star, TrendingUp } from 'lucide-react'

// Hooks and services
import useApi from '../hooks/useApi.js'
import { adminApi } from '../services/api.js'
import { getCollection } from '../utils/vendorData.js'

function Header({ title, text, action }) { return <header className="admin-header"><div><h1>{title}</h1><p>{text}</p></div>{action}</header> }
function Status({ children }) { return <span className={`admin-status ${String(children).toLowerCase().replace(/\s+/g, '-')}`}>{children}</span> }
function SearchBox({ value, onChange, placeholder }) { return <label className="admin-search"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label> }
function DataState({ state, empty, noun }) {
  if (state.loading) return <p className="admin-data-state">Loading {noun}…</p>
  if (state.error) return <p className="admin-data-state error">{state.error}</p>
  if (empty) return <p className="admin-data-state">No {noun} exist yet.</p>
  return null
}
function Table({ headers, rows }) {
  if (!rows.length) return null
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{headers.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === row.length - 1 ? <Status>{cell}</Status> : cell}</td>)}</tr>)}</tbody></table></div>
}
const loadOverview = () => Promise.all([adminApi.bookings(), adminApi.reviews(), adminApi.complaints()])

export function AdminDashboard() {
  const state = useApi(loadOverview)
  const [bookingPayload, reviewPayload, complaintPayload] = state.data || []
  const bookings = getCollection(bookingPayload), reviews = getCollection(reviewPayload), complaints = getCollection(complaintPayload)
  const pendingBookings = bookings.filter((item) => item.status === 'pending').length
  const pendingReviews = reviews.filter((item) => item.review_status === 'in-progress').length
  const pendingComplaints = complaints.filter((item) => item.complaint_status === 'pending').length
  const cards = [[BookOpen, 'Bookings', bookings.length, `${pendingBookings} pending`], [Star, 'Reviews', reviews.length, `${pendingReviews} awaiting moderation`], [MessageSquareWarning, 'Complaints', complaints.length, `${pendingComplaints} pending`]]
  return <><Header title="Command Center" text="Live operational information from the connected Xenon APIs." action={<button className="admin-icon" aria-label="Notifications"><Bell size={19} /></button>} /><DataState state={state} empty={!bookings.length && !reviews.length && !complaints.length} noun="platform activity" />{!state.loading && !state.error && <><section className="admin-grid">{cards.map(([Icon, label, value, note]) => <article className="admin-kpi" key={label}><Icon /><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</section><section className="admin-panel"><h2>Operational overview</h2><div className="admin-modules"><article><BookOpen /><b>Booking requests</b><p>{pendingBookings} require vendor action</p></article><article><Star /><b>Moderation queue</b><p>{pendingReviews} reviews await approval</p></article><article><MessageSquareWarning /><b>Open reports</b><p>{pendingComplaints} complaints require review</p></article></div></section></>}</>
}

function DirectoryPage({ type }) {
  const [query, setQuery] = useState(''), isVendor = type === 'vendors'
  const state = useApi(isVendor ? adminApi.vendors : adminApi.users)
  const rows = getCollection(state.data).map((item) => isVendor ? [item.vendor_name || item.company_name || item.name, item.vendor_email || item.email, item.vendor_type || '—', item.vendor_status || item.status || 'Active'] : [item.name, item.email, item.role || 'User', item.isActive === false ? 'Inactive' : 'Active'])
  const filtered = useMemo(() => rows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase())), [rows, query])
  return <><Header title={isVendor ? 'Vendor Moderation' : 'User Directory'} text={isVendor ? 'Review partners, applications, and account status.' : 'Manage profiles, roles, and account access.'} action={<SearchBox value={query} onChange={setQuery} placeholder={`Search ${type}...`} />} /><DataState state={state} empty={!rows.length} noun={type} /><Table headers={isVendor ? ['Business', 'Contact', 'Type', 'Status'] : ['User', 'Contact', 'Role', 'Status']} rows={filtered} /></>
}
export const AdminUsers = () => <DirectoryPage type="users" />
export const AdminVendors = () => <DirectoryPage type="vendors" />

export function AdminBookings() {
  const [query, setQuery] = useState(''), state = useApi(adminApi.bookings)
  const rows = getCollection(state.data).map((item) => [item.id || item._id, item.user_id?.name || 'Traveller', item.package_id?.package_name || 'Package', `JOD ${item.total_price ?? '—'}`, item.status || 'Pending'])
  const filtered = rows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase()))
  return <><Header title="Master Ledger" text="Complete oversight of curated experiences and client itineraries." action={<SearchBox value={query} onChange={setQuery} placeholder="Search client or ref..." />} /><DataState state={state} empty={!rows.length} noun="bookings" /><Table headers={['Reference', 'Client', 'Experience', 'Value', 'Status']} rows={filtered} /></>
}

export function AdminReviews() {
  const [refresh, setRefresh] = useState(0), [busy, setBusy] = useState(''), [message, setMessage] = useState('')
  const state = useApi(adminApi.reviews, [refresh]), reviews = getCollection(state.data)
  async function moderate(id, status) {
    setBusy(id); setMessage('')
    try { await adminApi.updateReviewStatus(id, status); setMessage(`Review changed to ${status}.`); setRefresh((value) => value + 1) }
    catch (error) { setMessage(error.message) }
    finally { setBusy('') }
  }
  return <><Header title="Reviews Moderation" text="Protect trust by reviewing pending and reported feedback." /><DataState state={state} empty={!reviews.length} noun="reviews" />{message && <p className="admin-data-state">{message}</p>}{reviews.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Review</th><th>Author</th><th>Experience</th><th>Status</th><th>Actions</th></tr></thead><tbody>{reviews.map((item) => <tr key={item.id || item._id}><td>{item.review_text || 'Review without comment'}</td><td>{item.user_id?.name || 'Traveller'}</td><td>{item.package_id?.package_name || 'Package'}</td><td><Status>{item.review_status}</Status></td><td><div className="admin-row-actions"><button disabled={busy} onClick={() => moderate(item.id || item._id, 'accepted')}>Accept</button><button disabled={busy} onClick={() => moderate(item.id || item._id, 'rejected')}>Reject</button></div></td></tr>)}</tbody></table></div>}</>
}

const pageConfig = {
  staff: ['Staff Management', 'Manage administrative access and responsibilities.', adminApi.staff, ['Name', 'Role', 'Status']],
  reports: ['Reports & Complaints', 'Investigate user reports and maintain a moderation trail.', adminApi.complaints, ['Reference', 'Subject', 'Status']],
  notifications: ['Notification Center', 'Monitor operational alerts and targeted announcements.', adminApi.notifications, ['Notification', 'Details', 'Status']],
}
export function AdminSimplePage({ type }) {
  const [title, text, load, headers] = pageConfig[type], state = useApi(load), records = getCollection(state.data)
  const rows = type === 'reports' ? records.map((item) => [item.complaint_id || item.id, item.complaint_title || 'Complaint', item.complaint_status || 'Pending']) : type === 'staff' ? records.map((item) => [item.name, item.position || item.role || '—', item.isActive === false ? 'Inactive' : 'Active']) : records.map((item) => [item.title || item.notification_type, item.message || '—', item.status || 'Unread'])
  return <><Header title={title} text={text} /><DataState state={state} empty={!rows.length} noun={type} /><Table headers={headers} rows={rows} /></>
}

export function AdminAnalytics() {
  const state = useApi(loadOverview), [bookingPayload, reviewPayload, complaintPayload] = state.data || []
  const bookings = getCollection(bookingPayload), reviews = getCollection(reviewPayload), complaints = getCollection(complaintPayload)
  const grossValue = bookings.reduce((sum, item) => sum + Number(item.total_price || 0), 0), completed = bookings.filter((item) => item.status === 'completed').length
  const completionRate = bookings.length ? Math.round((completed / bookings.length) * 100) : 0
  return <><Header title="Platform Analytics" text="Calculated from current booking, review, and complaint records." /><DataState state={state} empty={!bookings.length && !reviews.length && !complaints.length} noun="analytics data" />{!state.loading && !state.error && <section className="admin-grid"><article className="admin-kpi"><TrendingUp /><small>Gross booking value</small><strong>JOD {grossValue.toLocaleString()}</strong><span>{completionRate}% completed</span></article><article className="admin-kpi"><BookOpen /><small>Total bookings</small><strong>{bookings.length}</strong><span>{completed} completed</span></article><article className="admin-kpi"><Star /><small>Reviews</small><strong>{reviews.length}</strong><span>API records</span></article><article className="admin-kpi"><MessageSquareWarning /><small>Complaints</small><strong>{complaints.length}</strong><span>API records</span></article></section>}</>
}
