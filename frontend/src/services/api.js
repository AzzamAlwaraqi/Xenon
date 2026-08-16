// Storage
import { storage, TOKEN_KEY } from './storage.js'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Shared API request handler
async function request(path, options = {}) {
  const token = storage.get(TOKEN_KEY)
  const isFormData = options.body instanceof FormData
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Cannot reach the Xenon API. Start the backend on port 3000 or update VITE_API_URL to its actual address.')
  }

  const payload = await response.json().catch(() => ({}))
  if (response.status === 401) storage.remove(TOKEN_KEY)
  if (!response.ok) {
    const proxyUnavailable = response.status >= 500 && !payload.message && !payload.error
    throw new Error(proxyUnavailable
      ? 'The frontend proxy could not reach the Xenon backend on port 3000.'
      : payload.message || payload.error || 'Something went wrong. Please try again.')
  }
  return payload
}

// Unified authentication routes
export const authApi = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
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
  getRequests: () => request('/bookings/vendor/booking-requests'),
  getPendingCount: () => request('/bookings/vendor/pending-requests-count'),
  getById: (bookingId) => request(`/bookings/get-booking/${bookingId}`),
  updateStatus: (bookingId, status) => request(`/bookings/update-status/${bookingId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export { BASE_URL, request }
