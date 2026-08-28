// Libraries
import { useState } from 'react'
import { CalendarCheck2, CircleDollarSign, Clock3, Repeat2, Star, TrendingDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'

// Components and services
import VendorShell from '../../components/vendor/VendorShell.jsx'
import { VendorNotice } from '../../components/vendor/VendorUi.jsx'
import {
  AnalyticsBreakdown,
  AnalyticsDonut,
  AnalyticsMetric,
  AnalyticsSection,
  AnalyticsTrend,
} from '../../components/analytics/AnalyticsUi.jsx'
import useApi from '../../hooks/useApi.js'
import { analyticsApi, packageApi } from '../../services/api.js'
import { formatCurrency, toNumber } from '../../utils/analyticsData.js'
import { vendorAnalyticsPreview } from '../../utils/analyticsPreviewData.js'
import { localToday } from '../../utils/formValidation.js'
import { getCollection, getPackageId } from '../../utils/vendorData.js'

// Vendor performance dashboard
export default function VendorAnalytics() {
  const location = useLocation()
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [selectedPackageId, setSelectedPackageId] = useState('')
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'
  const state = useApi(() => isDevelopmentPreview ? Promise.resolve(vendorAnalyticsPreview) : analyticsApi.vendor(dates), [dates.startDate, dates.endDate, isDevelopmentPreview])
  const packagesState = useApi(packageApi.getMine, [])
  const packages = getCollection(packagesState.data)
  const activePackageId = selectedPackageId || getPackageId(packages[0]) || ''
  const packageState = useApi(() => activePackageId ? analyticsApi.package(activePackageId, dates) : Promise.resolve(null), [activePackageId, dates.startDate, dates.endDate])
  const packageAnalytics = packageState.data?.data || {}
  const analytics = state.data?.data || {}
  const financials = analytics.financials || {}
  const bookingStatuses = Array.isArray(analytics.bookings_overview) ? analytics.bookings_overview : []
  const capacity = Array.isArray(analytics.capacity_management) ? analytics.capacity_management : []
  const quality = analytics.quality_score || {}
  const retention = analytics.customer_insights?.retention_metrics || {}
  const paymentMethods = Array.isArray(financials.payment_methods) ? financials.payment_methods : []
  const trends = Array.isArray(financials.revenue_trends_this_year) ? financials.revenue_trends_this_year : []
  const totalBookings = bookingStatuses.reduce((sum, item) => sum + toNumber(item.count), 0)
  const successfulBookings = bookingStatuses.filter((item) => ['accepted', 'completed'].includes(item.status)).reduce((sum, item) => sum + toNumber(item.count), 0)
  const successRate = totalBookings ? Math.round((successfulBookings / totalBookings) * 100) : 0
  const hasData = Object.keys(analytics).length > 0

  return (
    <VendorShell title="Performance Studio" subtitle="Revenue, traveller behaviour, capacity, and service quality in one view.">
      <AnalyticsFilters dates={dates} setDates={setDates} />
      <VendorNotice state={state} empty={!hasData} />

      {!state.loading && !state.error && hasData && (
        <div className="analytics-dashboard">
          <section className="analytics-metrics">
            <AnalyticsMetric icon={CircleDollarSign} label="Total revenue" value={formatCurrency(financials.total_revenue)} note="Accepted and completed bookings" />
            <AnalyticsMetric icon={CalendarCheck2} label="Booking requests" value={totalBookings.toLocaleString()} note={`${successfulBookings} successfully converted`} tone="sage" />
            <AnalyticsMetric icon={Repeat2} label="Retention rate" value={`${toNumber(retention.retention_rate)}%`} note={`${toNumber(retention.repeat_customers)} repeat travellers`} tone="gold" />
            <AnalyticsMetric icon={Star} label="Average rating" value={`${toNumber(quality.average_rating).toFixed(1)} / 5`} note={`${toNumber(quality.total_complaints_received)} complaints received`} tone="violet" />
          </section>

          <div className="analytics-grid-wide">
            <AnalyticsSection title="Revenue momentum" eyebrow="Financial performance" className="analytics-span-two">
              <AnalyticsTrend items={trends} />
            </AnalyticsSection>
            <AnalyticsSection title="Booking conversion" eyebrow="Traveller demand">
              <div className="analytics-highlight"><strong>{successRate}%</strong><span>accepted or completed</span></div>
              <AnalyticsBreakdown items={bookingStatuses} labelKey="status" valueKey="count" />
            </AnalyticsSection>
          </div>

          <div className="analytics-grid-even">
            <AnalyticsSection title="Capacity utilisation" eyebrow="Package operations">
              <AnalyticsBreakdown items={capacity.slice(0, 6)} labelKey="package_name" valueKey="occupancy_percentage" formatValue={(value) => `${value}%`} emptyText="Create packages and accept bookings to measure occupancy." />
            </AnalyticsSection>
            <AnalyticsSection title="Payment mix" eyebrow="Transaction behaviour">
              <AnalyticsDonut items={paymentMethods} labelKey="method" valueKey="usageCount" centerLabel="Payments" />
            </AnalyticsSection>
            <AnalyticsSection title="Customer loyalty" eyebrow="Retention">
              <div className="analytics-loyalty">
                <div><span>Unique customers</span><strong>{toNumber(retention.total_unique_customers)}</strong></div>
                <div><span>Repeat customers</span><strong>{toNumber(retention.repeat_customers)}</strong></div>
                <div><span>One-time customers</span><strong>{toNumber(retention.one_time_customers)}</strong></div>
              </div>
            </AnalyticsSection>
          </div>

          <AnalyticsSection
            title="Package performance"
            eyebrow="Package analytics"
            action={<select aria-label="Choose package for analytics" value={activePackageId} onChange={(event) => setSelectedPackageId(event.target.value)}><option value="">Choose a package</option>{packages.map((item) => <option key={getPackageId(item)} value={getPackageId(item)}>{item.package_name || item.title || 'Package'}</option>)}</select>}
          >
            <VendorNotice state={activePackageId ? packageState : packagesState} empty={!activePackageId} />
            {activePackageId && !packageState.loading && !packageState.error && <section className="analytics-metrics">
              <AnalyticsMetric icon={CalendarCheck2} label="Total requests" value={toNumber(packageAnalytics.total_requests).toLocaleString()} note="All booking requests" tone="sage" />
              <AnalyticsMetric icon={Star} label="Success rate" value={`${toNumber(packageAnalytics.success_rate)}%`} note="Accepted and completed" tone="gold" />
              <AnalyticsMetric icon={CircleDollarSign} label="Total earned" value={formatCurrency(packageAnalytics.total_earned)} note="Accepted and completed value" />
              <AnalyticsMetric icon={Clock3} label="Active pending" value={formatCurrency(packageAnalytics.active_pending)} note="Value awaiting a decision" tone="violet" />
              <AnalyticsMetric icon={TrendingDown} label="Lost to cancellations" value={formatCurrency(packageAnalytics.total_lost_to_cancellations)} note="Cancelled and rejected value" />
            </section>}
          </AnalyticsSection>
        </div>
      )}
    </VendorShell>
  )
}

function AnalyticsFilters({ dates, setDates }) {
  const updateDate = (name) => (event) => setDates((current) => ({ ...current, [name]: event.target.value }))
  const clearDates = () => setDates({ startDate: '', endDate: '' })

  return (
    <div className="analytics-filter-bar">
      <div><span>Reporting window</span><strong>{dates.startDate || dates.endDate ? 'Custom period' : 'All available data'}</strong></div>
      <div className="analytics-filter-controls">
        <label>From<input type="date" value={dates.startDate} max={dates.endDate || localToday()} onChange={updateDate('startDate')} /></label>
        <label>To<input type="date" min={dates.startDate || undefined} max={localToday()} value={dates.endDate} onChange={updateDate('endDate')} /></label>
        {(dates.startDate || dates.endDate) && <button className="vendor-button secondary" type="button" onClick={clearDates}>Clear</button>}
      </div>
    </div>
  )
}
