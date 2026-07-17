/** Capitalize the first letter of a string */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

/** Check if a value is empty (null, undefined, '', [], {}) */
export const isEmpty = (val) => {
  if (val === null || val === undefined) return true
  if (typeof val === 'string') return val.trim() === ''
  if (Array.isArray(val)) return val.length === 0
  if (typeof val === 'object') return Object.keys(val).length === 0
  return false
}

/** Safely access nested object property */
export const get = (obj, path, fallback = undefined) => {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return fallback
  }
  return result
}
