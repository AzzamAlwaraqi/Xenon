export const storage = {
  get:    (key)        => JSON.parse(localStorage.getItem(key)),
  set:    (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key)        => localStorage.removeItem(key),
  clear:  ()           => localStorage.clear(),
}

export const TOKEN_KEY = 'xenon_token'
