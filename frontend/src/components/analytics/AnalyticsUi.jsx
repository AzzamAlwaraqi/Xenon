// Libraries
import { ArrowUpRight } from 'lucide-react'

import { formatCurrency, formatNumber, labelize, toNumber } from '../../utils/analyticsData.js'

const PALETTE = ['#a95f44', '#d79675', '#6f8e78', '#d7b36b', '#7d6f9f', '#c87373']

export function AnalyticsMetric({ icon: Icon, label, value, note, tone = 'clay' }) {
  return (
    <article className={`analytics-metric tone-${tone}`}>
      <div className="analytics-metric-icon">{Icon && <Icon size={19} />}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

export function AnalyticsSection({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`analytics-panel ${className}`}>
      <header className="analytics-panel-header">
        <div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function AnalyticsTrend({ items = [], valueKey = 'revenue', valueLabel = 'Revenue' }) {
  const values = items.map((item) => toNumber(item?.[valueKey]))
  const max = Math.max(...values, 1)
  const coordinates = values.map((value, index) => {
    const x = values.length < 2 ? 300 : 24 + (index * 552) / (values.length - 1)
    const y = 174 - (value / max) * 132
    return { x, y, value }
  })
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
  const lastCoordinate = coordinates[coordinates.length - 1]
  const area = coordinates.length ? `24,176 ${line} ${lastCoordinate.x},176` : ''

  return (
    <div className="analytics-trend">
      <div className="analytics-trend-summary">
        <span>{valueLabel}</span>
        <strong>{formatCurrency(values.reduce((total, value) => total + value, 0))}</strong>
        <small><ArrowUpRight size={14} /> Current calendar year</small>
      </div>
      <svg viewBox="0 0 600 200" role="img" aria-label={`${valueLabel} trend by month`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b96f50" stopOpacity=".34" />
            <stop offset="1" stopColor="#b96f50" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[44, 88, 132, 176].map((y) => <line key={y} x1="24" x2="576" y1={y} y2={y} className="analytics-grid-line" />)}
        {area && <polygon points={area} fill="url(#analyticsArea)" />}
        {line && <polyline points={line} className="analytics-trend-line" />}
        {coordinates.map(({ x, y, value }, index) => <circle key={`${x}-${index}`} cx={x} cy={y} r="4" className="analytics-trend-point"><title>{`${items[index]?.month || index + 1}: ${formatCurrency(value)}`}</title></circle>)}
      </svg>
      <div className="analytics-axis">{items.map((item, index) => <span key={`${item?.month}-${index}`}>{item?.month || index + 1}</span>)}</div>
    </div>
  )
}

export function AnalyticsBreakdown({ items = [], labelKey = 'label', valueKey = 'value', formatValue = formatNumber, emptyText = 'No activity recorded for this period.' }) {
  const normalized = items.map((item) => ({ ...item, numericValue: toNumber(item?.[valueKey]) }))
  const max = Math.max(...normalized.map((item) => item.numericValue), 1)

  if (!normalized.length) return <AnalyticsEmpty>{emptyText}</AnalyticsEmpty>

  return (
    <div className="analytics-breakdown">
      {normalized.map((item, index) => (
        <div className="analytics-breakdown-row" key={`${item?.[labelKey]}-${index}`}>
          <div><span>{labelize(item?.[labelKey])}</span><strong>{formatValue(item.numericValue)}</strong></div>
          <div className="analytics-progress"><i style={{ width: `${Math.max(item.numericValue ? 7 : 0, (item.numericValue / max) * 100)}%`, background: item.color || PALETTE[index % PALETTE.length] }} /></div>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsDonut({ items = [], labelKey = 'label', valueKey = 'value', centerLabel = 'Total' }) {
  const normalized = items.map((item, index) => ({
    label: labelize(item?.[labelKey]),
    value: toNumber(item?.[valueKey]),
    color: item?.color || PALETTE[index % PALETTE.length],
  })).filter((item) => item.value > 0)
  const total = normalized.reduce((sum, item) => sum + item.value, 0)
  const stops = normalized.map((item, index) => {
    const start = normalized.slice(0, index).reduce((sum, previous) => sum + (previous.value / total) * 100, 0)
    const end = start + (item.value / total) * 100
    return `${item.color} ${start}% ${end}%`
  })
  const background = stops.length ? `conic-gradient(${stops.join(',')})` : 'conic-gradient(#eee4dd 0 100%)'

  return (
    <div className="analytics-donut-layout">
      <div className="analytics-donut" style={{ background }}><div><strong>{formatNumber(total)}</strong><span>{centerLabel}</span></div></div>
      <div className="analytics-legend">
        {normalized.length ? normalized.map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{Math.round((item.value / total) * 100)}%</strong></div>) : <AnalyticsEmpty>No distribution is available yet.</AnalyticsEmpty>}
      </div>
    </div>
  )
}

export function AnalyticsRanking({ items = [], nameKey, valueKey, valueFormat = formatNumber, emptyText = 'No ranking data is available yet.' }) {
  if (!items.length) return <AnalyticsEmpty>{emptyText}</AnalyticsEmpty>

  return (
    <div className="analytics-ranking">
      {items.map((item, index) => (
        <article key={`${item?.[nameKey]}-${index}`}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <div><strong>{item?.[nameKey] || 'Not named'}</strong><small>{item.note || 'Live API result'}</small></div>
          <b>{valueFormat(toNumber(item?.[valueKey]))}</b>
        </article>
      ))}
    </div>
  )
}

export function AnalyticsEmpty({ children }) {
  return <p className="analytics-empty">{children}</p>
}
