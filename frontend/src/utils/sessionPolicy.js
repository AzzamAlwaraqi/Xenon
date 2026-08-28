const TOKEN_FAILURE_PATTERN = /(?:invalid|expired|missing)\s+(?:access\s+)?token|token\s+(?:is\s+)?(?:invalid|expired)|not logged in|login session.*expired|belonging to this token no longer exists/i

// A 401 can also mean incorrect credentials or an incorrect current password.
// Only token-specific failures should destroy an authenticated browser session.
export function shouldInvalidateSession({ status, message = '', token, path = '' }) {
  if (status !== 401 || !token || path.startsWith('/auth/')) return false
  return TOKEN_FAILURE_PATTERN.test(message)
}
