export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
}

export const TOKEN_KEY = 'xenon_token'
export const ROLE_KEY = 'xenon_role'
