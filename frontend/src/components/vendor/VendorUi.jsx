// Shared vendor interface components
export function VendorNotice({ state, empty }) {
  if (state.loading) return <div className="vendor-notice">Loading…</div>
  if (state.error) return <div className="vendor-notice error">{state.error}</div>
  if (empty) return <div className="vendor-notice">Nothing to show yet.</div>
  return null
}

export function VendorMetric({ label, value, note = 'Live API data' }) {
  return (
    <article className="vendor-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

export function VendorStatus({ value = 'Pending' }) {
  const className = String(value).toLowerCase().replace(/\s+/g, '-')
  return <span className={`vendor-status ${className}`}>{value}</span>
}

export function VendorField({ label, ...props }) {
  return (
    <label>
      {label}
      <input {...props} />
    </label>
  )
}

export function VendorInfo({ label, value }) {
  return (
    <p className="vendor-info">
      <span>{label}</span>
      <strong>{value || '—'}</strong>
    </p>
  )
}
