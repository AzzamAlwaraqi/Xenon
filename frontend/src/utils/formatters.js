/** Format a date to a readable string: "Jul 17, 2026" */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

/** Format a number as currency: 1500 → "$1,500.00" */
export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

/** Truncate long text with ellipsis */
export const truncate = (str = '', maxLen = 80) =>
  str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
