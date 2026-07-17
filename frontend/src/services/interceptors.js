// Axios request/response interceptors
// Attach after api instance is created in api.js

// import api from './api.js'
// import { storage, TOKEN_KEY } from './storage.js'

// ── Request: attach JWT token ─────────────────────────────────────────────
// api.interceptors.request.use((config) => {
//   const token = storage.get(TOKEN_KEY)
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

// ── Response: handle 401 globally ────────────────────────────────────────
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       storage.remove(TOKEN_KEY)
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )
