// Storage
import { storage, TOKEN_KEY } from './storage.js'
import { retrySimultaneousLogin } from '../utils/retryLogin.js'

function resolveBaseUrl(value) {
  const configured = value || '/api/v1'
  if (!/^https?:\/\//i.test(configured)) return configured.replace(/\/$/, '')

  try {
    const url = new URL(configured)
    const browserIsRemote = !['localhost', '127.0.0.1'].includes(window.location.hostname)
    if (browserIsRemote && ['localhost', '127.0.0.1'].includes(url.hostname)) {
      url.hostname = window.location.hostname
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    return configured.replace(/\/$/, '')
  }
}

const BASE_URL = resolveBaseUrl(import.meta.env.VITE_API_URL)

// Shared API request handler
async function request(path, options = {}) {
  const token = storage.get(TOKEN_KEY)
  const isFormData = options.body instanceof FormData
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 12000)
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: 'same-origin',
      ...options,
      signal: controller.signal,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The Xenon API took too long to respond. Check the backend and try again.', { cause: error })
    throw new Error('Cannot connect to the Xenon API. Start the backend on the host computer and use the frontend LAN address so requests can pass through the Vite proxy.', { cause: error })
  } finally {
    window.clearTimeout(timeout)
  }

  const payload = await response.json().catch(() => ({}))
  if (response.status === 401) storage.clearAuth()
  if (!response.ok) {
    const serverMessage = payload.message || payload.error
    const messages = {
      400: serverMessage || 'The submitted information is invalid. Review the highlighted fields.',
      401: 'Your login session is missing or has expired. Please sign in again.',
      403: serverMessage || 'Your account does not have permission to perform this action.',
      404: `This feature is not available from the current backend (${path}).`,
      409: serverMessage || 'This record conflicts with information that already exists.',
      413: 'The uploaded file is too large.',
      422: serverMessage || 'The server could not process the submitted information.',
      429: 'Too many requests were sent. Wait a moment and try again.',
    }
    const error = new Error(messages[response.status] || (response.status >= 500
      ? 'The backend could not complete this request. A server component or database service may be unavailable.'
      : serverMessage || `The request failed with status ${response.status}.`))
    error.status = response.status
    error.serverMessage = serverMessage || ''
    throw error
  }
  return payload
}

// Unified authentication routes
export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => retrySimultaneousLogin(() => request('/auth/login', { method: 'POST', body: JSON.stringify(data) })),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
}

// Authenticated profile routes
export const profileApi = {
  getMe: () => request('/profile/me'),
  update: (data) => request('/profile/update', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/profile/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (reason = '') => request('/profile/delete', { method: 'PUT', body: JSON.stringify({ reason }) }),
}

// Vendor package routes
export const packageApi = {
  getAll: () => request('/packages/'),
  getById: (packageId) => request(`/packages/package/${packageId}`),
  create: (formData) => request('/packages/create-package', { method: 'POST', body: formData }),
  update: (packageId, formData) => request(`/packages/package/${packageId}`, { method: 'PUT', body: formData }),
  remove: (packageId) => request(`/packages/delete-package/${packageId}`, { method: 'PUT' }),
}

// Vendor booking routes
export const vendorBookingApi = {
  getAll: () => request('/bookings/all-bookings'),
  getRequests: () => request('/bookings/vendor/booking-requests'),
  getPendingCount: () => request('/bookings/vendor/pending-requests-count'),
  getById: (bookingId) => request(`/bookings/get-booking/${bookingId}`),
  updateStatus: (bookingId, status) => request(`/bookings/update-status/${bookingId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// Admin routes follow the backend contract. Several are currently not mounted by the backend.
export const adminApi = {
  analytics: () => request('/admin/analytics'),
  users: () => request('/admin/users'),
  vendors: () => request('/admin/vendors'),
  staff: () => request('/admin/staff'),
  reports: () => request('/admin/reports'),
  notifications: () => request('/notifications'),
  bookings: () => request('/bookings/all-bookings'),
  reviews: () => request('/reviews/getAllReviews'),
  complaints: () => request('/complaints/getAllComplaints'),
  updateReviewStatus: (reviewId, status) => request(`/reviews/updateReviewStatus/${reviewId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export { BASE_URL, request }
