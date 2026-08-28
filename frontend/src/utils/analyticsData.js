export function formatCurrency(value) {
  return `JOD ${toNumber(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export function formatNumber(value) {
  return toNumber(value).toLocaleString()
}

export function labelize(value) {
  return String(value || 'Other')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_').join(' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}
