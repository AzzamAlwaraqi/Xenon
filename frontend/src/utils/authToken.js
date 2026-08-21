const ALLOWED_PORTAL_ROLES = new Set(['admin', 'vendor'])

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return decodeURIComponent(Array.from(atob(padded), (character) => (
    `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`
  )).join(''))
}

export function getTokenClaims(token) {
  if (typeof token !== 'string') return null
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    return JSON.parse(decodeBase64Url(payload))
  } catch {
    return null
  }
}

export function getPortalRole(token, fallbackRole = '') {
  const tokenRole = getTokenClaims(token)?.role
  if (ALLOWED_PORTAL_ROLES.has(tokenRole)) return tokenRole
  return ALLOWED_PORTAL_ROLES.has(fallbackRole) ? fallbackRole : ''
}

export function isExpiredToken(token) {
  const expiration = Number(getTokenClaims(token)?.exp)
  return Number.isFinite(expiration) && expiration * 1000 <= Date.now()
}
