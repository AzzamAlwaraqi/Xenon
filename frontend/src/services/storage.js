export const TOKEN_KEY = 'xenon_token'
export const ROLE_KEY = 'xenon_role'
export const SESSION_KEY = 'xenon_session'
export const USER_KEY = 'xenon_user'
export const AUTH_CHANGE_EVENT = 'xenon:auth-change'

const AUTH_KEYS = [TOKEN_KEY, ROLE_KEY, SESSION_KEY, USER_KEY]
const authChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('xenon-auth') : null

function parseStoredValue(value) {
  if (value === null) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function notifyAuthChange(key) {
  if (AUTH_KEYS.includes(key)) window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
}

export const storage = {
  get(key) {
    const current = sessionStorage.getItem(key)
    if (current !== null) return parseStoredValue(current)

    // Migrate older Xenon sessions away from persistent localStorage.
    const legacy = localStorage.getItem(key)
    if (legacy !== null && AUTH_KEYS.includes(key)) {
      sessionStorage.setItem(key, legacy)
      localStorage.removeItem(key)
      return parseStoredValue(legacy)
    }
    return parseStoredValue(legacy)
  },
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value))
    if (AUTH_KEYS.includes(key)) localStorage.removeItem(key)
    notifyAuthChange(key)
  },
  remove(key) {
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
    notifyAuthChange(key)
  },
  clearAuth(broadcast = true) {
    AUTH_KEYS.forEach((key) => {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
    })
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT))
    if (broadcast) authChannel?.postMessage({ type: 'logout' })
  },
  clear() {
    this.clearAuth()
  },
}

authChannel?.addEventListener('message', (event) => {
  if (event.data?.type === 'logout') storage.clearAuth(false)
})
