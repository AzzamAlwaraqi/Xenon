// Libraries
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, BookOpen, Landmark, MessageSquareWarning, Search, Star, TrendingUp } from 'lucide-react'

// Hooks and services
import useApi from '../hooks/useApi.js'
import { adminApi, analyticsApi, packageApi } from '../services/api.js'
import { getCollection, getPackageId } from '../utils/vendorData.js'
import {
  AnalyticsBreakdown,
  AnalyticsDonut,
  AnalyticsMetric,
  AnalyticsRanking,
  AnalyticsSection,
  AnalyticsTrend,
} from '../components/analytics/AnalyticsUi.jsx'
import { formatCurrency, toNumber } from '../utils/analyticsData.js'
import { adminAnalyticsPreview } from '../utils/analyticsPreviewData.js'
import { localToday } from '../utils/formValidation.js'

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
export function AdminDashboard() {
  const state = useApi(adminApi.analytics)
  const analytics = state.data?.data || {}
  const financials = analytics.financials || {}
  const netProfit = financials.net_profit_summary || {}
  const performance = analytics.platform_performance || {}
  const moderation = analytics.moderation_efficiency || {}
  const demographics = Array.isArray(analytics.demographics_overview) ? analytics.demographics_overview : []
  const leaderboard = Array.isArray(performance.vendors_leaderboard) ? performance.vendors_leaderboard : []
  const destinations = Array.isArray(performance.top_destinations) ? performance.top_destinations : []
  const totalBookings = toNumber(analytics.platform_traffic?.total_bookings)
  const totalAccounts = demographics.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalReports = toNumber(moderation.total_reports)
  const cards = [
    [BookOpen, 'Total bookings', totalBookings.toLocaleString(), 'Platform booking traffic'],
    [TrendingUp, 'Gross booking value', formatCurrency(financials.gross_revenue), `${toNumber(netProfit.totalSuccessfulBookings)} successful bookings`],
    [Landmark, 'Platform earnings', formatCurrency(netProfit.adminActualRevenue), 'Commission revenue'],
    [MessageSquareWarning, 'Moderation reports', totalReports.toLocaleString(), 'Trust and safety workload'],
  ]
  const hasData = Object.keys(analytics).length > 0

  return <><Header title="Command Center" text="Live operational information from the Admin analytics API." action={<Link className="admin-icon" aria-label="Notifications" to="/admin/notifications"><Bell size={19} /></Link>} /><DataState state={state} empty={!hasData} noun="platform activity" />{!state.loading && !state.error && hasData && <><section className="admin-grid">{cards.map(([Icon, label, value, note]) => <article className="admin-kpi" key={label}><Icon /><small>{label}</small><strong>{value}</strong><span>{note}</span></article>)}</section><section className="admin-panel"><h2>Operational overview</h2><div className="admin-modules"><article><BookOpen /><b>Registered accounts</b><p>{totalAccounts} accounts across {demographics.length} roles</p></article><article><Star /><b>Active marketplace</b><p>{leaderboard.length} vendors currently ranked</p></article><article><MessageSquareWarning /><b>Popular experiences</b><p>{destinations.length} destinations currently ranked</p></article></div></section></>}</>
}

export function AdminBookings() {
  const [query, setQuery] = useState(''), state = useApi(adminApi.bookings)
  const rows = getCollection(state.data).map((item) => {
    const id = item.id || item._id
    return [id, item.user_id?.name || 'Traveller', item.package_id?.package_name || 'Package', `JOD ${item.total_price ?? '-'}`, <Link className="text-link" to={`/admin/bookings/${id}`}>View</Link>, item.status || 'Pending']
  })
  const filtered = rows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase()))
  return <><Header title="Master Ledger" text="Complete oversight of curated experiences and client itineraries." action={<SearchBox value={query} onChange={setQuery} placeholder="Search client or ref..." />} /><DataState state={state} empty={!rows.length} noun="bookings" /><Table headers={['Reference', 'Client', 'Experience', 'Value', 'Action', 'Status']} rows={filtered} /></>
}

export function AdminAnalytics() {
  const location = useLocation()
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'
  const state = useApi(() => isDevelopmentPreview ? Promise.resolve(adminAnalyticsPreview) : adminApi.analytics(dates), [dates.startDate, dates.endDate, isDevelopmentPreview])
  const packagesState = useApi(packageApi.getAll, [])
  const packages = getCollection(packagesState.data)
  const activePackageId = selectedPackageId || getPackageId(packages[0]) || ''
  const packageState = useApi(() => activePackageId ? analyticsApi.package(activePackageId, dates) : Promise.resolve(null), [activePackageId, dates.startDate, dates.endDate])
  const packageAnalytics = packageState.data?.data || {}
  const analytics = state.data?.data || {}
  const financials = analytics.financials || {}
  const performance = analytics.platform_performance || {}
  const moderation = analytics.moderation_efficiency || {}
  const destinations = Array.isArray(performance.top_destinations) ? performance.top_destinations : []
  const leaderboard = Array.isArray(performance.vendors_leaderboard) ? performance.vendors_leaderboard : []
  const trends = Array.isArray(performance.revenue_trends_this_year) ? performance.revenue_trends_this_year : []
  const paymentMethods = Array.isArray(financials.payment_methods) ? financials.payment_methods : []
  const demographics = Array.isArray(analytics.demographics_overview) ? analytics.demographics_overview : []
  const moderationItems = Array.isArray(moderation.breakdown) ? moderation.breakdown : []
  const totalReports = toNumber(moderation.total_reports)
  const resolvedReports = moderationItems.filter((item) => ['resolved', 'dismissed', 'closed'].includes(item.status)).reduce((sum, item) => sum + toNumber(item.count), 0)
  const resolutionRate = totalReports ? Math.round((resolvedReports / totalReports) * 100) : 0
  const platformEarnings = financials.net_profit_summary?.adminActualRevenue
  const totalBookings = toNumber(analytics.platform_traffic?.total_bookings)
  const hasData = Object.keys(analytics).length > 0
  const dateControls = <AnalyticsDateControls dates={dates} setDates={setDates} />

  return (
    <>
      <Header title="Platform Intelligence" text="Financial performance, marketplace health, audience growth, and moderation outcomes." action={dateControls} />
      <DataState state={state} empty={!hasData} noun="analytics data" />

      {!state.loading && !state.error && hasData && (
        <div className="analytics-dashboard admin-analytics-dashboard">
          <section className="analytics-metrics">
            <AnalyticsMetric icon={TrendingUp} label="Gross booking value" value={formatCurrency(financials.gross_revenue)} note="Accepted and completed sales" />
            <AnalyticsMetric icon={Landmark} label="Platform earnings" value={formatCurrency(platformEarnings)} note="Current commission revenue" tone="sage" />
            <AnalyticsMetric icon={BookOpen} label="Total bookings" value={totalBookings.toLocaleString()} note="Requests in selected period" tone="gold" />
            <AnalyticsMetric icon={MessageSquareWarning} label="Resolution rate" value={`${resolutionRate}%`} note={`${resolvedReports} of ${totalReports} reports closed`} tone="violet" />
          </section>

          <div className="analytics-grid-wide">
            <AnalyticsSection title="Marketplace revenue" eyebrow="Yearly movement" className="analytics-span-two">
              <AnalyticsTrend items={trends} />
            </AnalyticsSection>
            <AnalyticsSection title="Payment mix" eyebrow="Transaction channels">
              <AnalyticsDonut items={paymentMethods} labelKey="method" valueKey="usageCount" centerLabel="Payments" />
            </AnalyticsSection>
          </div>

          <div className="analytics-grid-even">
            <AnalyticsSection title="Top experiences" eyebrow="Destination demand">
              <AnalyticsRanking items={destinations} nameKey="package_name" valueKey="total_bookings" valueFormat={(value) => `${value} bookings`} />
            </AnalyticsSection>
            <AnalyticsSection title="Vendor leaderboard" eyebrow="Partner performance">
              <AnalyticsRanking items={leaderboard.slice(0, 6)} nameKey="vendor_company" valueKey="totalRevenue" valueFormat={formatCurrency} />
            </AnalyticsSection>
            <AnalyticsSection title="Audience mix" eyebrow="Registered accounts">
              <AnalyticsDonut items={demographics} labelKey="role" valueKey="count" centerLabel="Accounts" />
            </AnalyticsSection>
          </div>

          <div className="analytics-grid-even analytics-grid-bottom">
            <AnalyticsSection title="Moderation outcomes" eyebrow="Trust and safety">
              <div className="analytics-highlight"><strong>{resolutionRate}%</strong><span>resolution rate</span></div>
              <AnalyticsBreakdown items={moderationItems} labelKey="status" valueKey="count" />
            </AnalyticsSection>
            <AnalyticsSection title="Financial snapshot" eyebrow="Platform economics">
              <div className="analytics-financial-list">
                <div><span>Gross marketplace value</span><strong>{formatCurrency(financials.gross_revenue)}</strong></div>
                <div><span>Successful bookings</span><strong>{toNumber(financials.net_profit_summary?.totalSuccessfulBookings)}</strong></div>
                <div><span>Total platform sales</span><strong>{formatCurrency(financials.net_profit_summary?.totalPlatformSales)}</strong></div>
                <div><span>Platform earnings</span><strong>{formatCurrency(platformEarnings)}</strong></div>
              </div>
            </AnalyticsSection>
          </div>

          <AnalyticsSection
            title="Package performance"
            eyebrow="Package analytics"
            action={<select aria-label="Choose package for analytics" value={activePackageId} onChange={(event) => setSelectedPackageId(event.target.value)}><option value="">Choose a package</option>{packages.map((item) => <option key={getPackageId(item)} value={getPackageId(item)}>{item.package_name || item.title || 'Package'}</option>)}</select>}
          >
            <DataState state={activePackageId ? packageState : packagesState} empty={!activePackageId} noun="package analytics" />
            {activePackageId && !packageState.loading && !packageState.error && <section className="analytics-metrics">
              <AnalyticsMetric icon={BookOpen} label="Total requests" value={toNumber(packageAnalytics.total_requests).toLocaleString()} note="All booking requests" tone="sage" />
              <AnalyticsMetric icon={TrendingUp} label="Success rate" value={`${toNumber(packageAnalytics.success_rate)}%`} note="Accepted and completed" tone="gold" />
              <AnalyticsMetric icon={Landmark} label="Total earned" value={formatCurrency(packageAnalytics.total_earned)} note="Accepted and completed value" />
              <AnalyticsMetric icon={BookOpen} label="Active pending" value={formatCurrency(packageAnalytics.active_pending)} note="Value awaiting a decision" tone="violet" />
              <AnalyticsMetric icon={MessageSquareWarning} label="Lost to cancellations" value={formatCurrency(packageAnalytics.total_lost_to_cancellations)} note="Cancelled and rejected value" />
            </section>}
          </AnalyticsSection>
        </div>
      )}
    </>
  )
}

function AnalyticsDateControls({ dates, setDates }) {
  const updateDate = (name) => (event) => setDates((current) => ({ ...current, [name]: event.target.value }))

  return (
    <div className="analytics-filter-controls admin-analytics-filters">
      <label>From<input type="date" value={dates.startDate} max={dates.endDate || localToday()} onChange={updateDate('startDate')} /></label>
      <label>To<input type="date" min={dates.startDate || undefined} max={localToday()} value={dates.endDate} onChange={updateDate('endDate')} /></label>
      {(dates.startDate || dates.endDate) && <button className="vendor-button secondary" type="button" onClick={() => setDates({ startDate: '', endDate: '' })}>Clear</button>}
    </div>
  )
}
