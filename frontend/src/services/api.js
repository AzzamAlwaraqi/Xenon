// Storage
import { REFRESH_TOKEN_KEY, storage, TOKEN_KEY } from './storage.js'
import { retrySimultaneousLogin } from '../utils/retryLogin.js'
import { shouldInvalidateSession } from '../utils/sessionPolicy.js'

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

function withQuery(path, query = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  const search = params.toString()
  return search ? `${path}?${search}` : path
}

function toFormData(data) {
  if (data instanceof FormData) return data
  const body = new FormData()
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') body.append(key, value)
  })
  return body
}

function collectionFrom(payload) {
  const value = payload?.data ?? payload
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.packages)) return value.packages
  if (Array.isArray(value?.reviews)) return value.reviews
  return []
}

const BASE_URL = resolveBaseUrl(import.meta.env.VITE_API_URL)
let refreshPromise = null

async function refreshAuthSession() {
  const refreshToken = storage.get(REFRESH_TOKEN_KEY)
  if (!refreshToken) throw new Error('No refresh token is available.')

  if (!refreshPromise) {
    refreshPromise = request('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false).then((payload) => {
      const accessToken = payload.data?.accessToken
      const nextRefreshToken = payload.data?.refreshToken
      if (!accessToken || !nextRefreshToken) throw new Error('The API returned an incomplete refreshed session.')
      storage.updateAuthTokens({ token: accessToken, refreshToken: nextRefreshToken })
    }).finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

// Shared API request handler
async function request(path, options = {}, allowRefresh = true) {
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
  const serverMessage = payload.message || payload.error || ''
  const canRefresh = allowRefresh
    && response.status === 401
    && !path.startsWith('/auth/')
    && Boolean(token)
    && Boolean(storage.get(REFRESH_TOKEN_KEY))

  if (canRefresh) {
    try {
      await refreshAuthSession()
      return request(path, options, false)
    } catch {
      storage.clearAuth(false)
    }
  }

  if (shouldInvalidateSession({ status: response.status, message: serverMessage, token, path })) {
    // API failures in one tab must not erase a newer valid login in another tab.
    storage.clearAuth(false)
  }
  if (!response.ok) {
    const isLoginRequest = path === '/auth/login'
    const messages = {
      400: serverMessage || 'The submitted information is invalid. Review the highlighted fields.',
      401: isLoginRequest
        ? 'The email or password is incorrect.'
        : 'Your login session is missing or has expired. Please sign in again.',
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
    error.serverMessage = serverMessage
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
  sendOtp: (data) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  refreshToken: (refreshToken) => request('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
}

// Authenticated profile routes
export const profileApi = {
  getMe: () => request('/profile/me'),
  update: (data) => request('/profile/update', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/profile/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  requestVendor: (formData) => request('/profile/vendor-request', { method: 'POST', body: formData }),
  delete: (data = '') => request('/profile/delete', {
    method: 'PUT',
    body: JSON.stringify(typeof data === 'string' ? { reason: data } : data),
  }),
}

// Vendor package routes
export const packageApi = {
  getAll: (query) => request(withQuery('/packages/', query)),
  getMine: async () => {
    const profile = await profileApi.getMe()
    const vendor = profile?.data?.profile || profile?.data
    const vendorId = vendor?._id || vendor?.id
    if (!vendorId) throw new Error('The vendor profile did not provide an ID for filtering packages.')
    return request(withQuery('/packages/', { vendor_id: vendorId }))
  },
  getById: (packageId) => request(`/packages/package/${packageId}`),
  create: (formData) => request('/packages/create-package', { method: 'POST', body: formData }),
  update: (packageId, formData) => request(`/packages/package/${packageId}`, { method: 'PUT', body: formData }),
  remove: (packageId) => request(`/packages/delete-package/${packageId}`, { method: 'PUT' }),
}

// Vendor booking routes
export const vendorBookingApi = {
  getAll: () => request('/bookings/all-bookings'),
  getRequests: (packageId) => request(`/bookings/vendor/booking-requests/${packageId}`),
  getPendingCount: () => request('/bookings/vendor/pending-requests-count'),
  getById: (bookingId) => request(`/bookings/get-booking/${bookingId}`),
  updateStatus: (bookingId, status) => request(`/bookings/update-status/${bookingId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

// Traveller booking routes kept ready for the existing client pages.
export const bookingApi = {
  create: (data) => request('/bookings/create-booking', { method: 'POST', body: JSON.stringify(data) }),
  getMine: () => request('/bookings/my-bookings'),
  getHistory: () => request('/bookings/my-history'),
  getById: (bookingId) => request(`/bookings/get-booking/${bookingId}`),
  update: (bookingId, data) => request(`/bookings/update-booking/${bookingId}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancel: (bookingId) => request(`/bookings/delete-booking/${bookingId}`, { method: 'PUT' }),
  getPending: () => request('/bookings/user/pending-requests'),
}

// Review moderation routes
export const reviewApi = {
  create: (data) => request('/reviews/createReview', { method: 'POST', body: JSON.stringify(data) }),
  getMine: (query) => request(withQuery('/reviews/getMyReviews', query)),
  getById: (reviewId) => request(`/reviews/getReviewById/${reviewId}`),
  getForPackage: (packageId, query) => request(withQuery(`/reviews/package/${packageId}`, query)),
  update: (reviewId, data) => request(`/reviews/updateReview/${reviewId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (reviewId) => request(`/reviews/deleteReview/${reviewId}`, { method: 'PATCH' }),
  getAll: (query) => request(withQuery('/reviews/getAllReviews', query)),
  updateStatus: (reviewId, status) => request(`/reviews/updateReviewStatus/${reviewId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reply: (reviewId, replyComment) => request(`/reviews/reply/${reviewId}`, { method: 'POST', body: JSON.stringify({ reply_comment: replyComment }) }),
  getVendorReviews: async () => {
    const packages = collectionFrom(await packageApi.getMine())
    const responses = await Promise.all(packages.map((item) => {
      const packageId = item._id || item.id
      return packageId ? request(withQuery(`/reviews/package/${packageId}`, { limit: 100 })) : null
    }))
    const reviews = responses.flatMap(collectionFrom)
    return { status: 'success', results: reviews.length, data: reviews }
  },
}

// Analytics routes
export const analyticsApi = {
  vendor: (query) => request(withQuery('/analysis/vendor/dashboard', query)),
  admin: (query) => request(withQuery('/analysis/admin/dashboard', query)),
  package: (packageId, query) => request(withQuery(`/analysis/packages/${packageId}`, query)),
}

// Staff routes shared by vendors and administrators
export const staffApi = {
  getAll: (query) => request(withQuery('/staff', query)),
  getById: (staffId) => request(`/staff/${staffId}`),
  create: (data) => request('/staff/add', { method: 'POST', body: JSON.stringify(data) }),
  update: (staffId, data) => request(`/staff/update/${staffId}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (staffId) => request(`/staff/delete/${staffId}`, { method: 'PUT' }),
}

// Notification routes shared by authenticated roles
export const notificationApi = {
  getMine: (query) => request(withQuery('/notifications', query)),
  getSent: (query) => request(withQuery('/notifications/sent', query)),
  markRead: (notificationId) => request(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  remove: (notificationId) => request(`/notifications/${notificationId}`, { method: 'PATCH' }),
  removeAll: () => request('/notifications/delete-all', { method: 'PATCH' }),
  sendUpdate: (data) => request('/notifications/send-update', { method: 'POST', body: JSON.stringify(data) }),
  broadcast: (data) => request('/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),
}

// Vendor and admin financial routes
export const paymentApi = {
  getBookingPayments: (query) => request(withQuery('/payments/booking', query)),
  createBookingPayment: (data) => request('/payments/booking', { method: 'POST', body: toFormData(data) }),
  updateBookingPayment: (paymentId, data) => request(`/payments/booking/${paymentId}`, { method: 'PUT', body: toFormData(data) }),
  cancelBookingPayment: (paymentId) => request(`/payments/booking/${paymentId}/delete`, { method: 'PATCH' }),
  getSubscriptions: (query) => request(withQuery('/payments/subscription', query)),
  createSubscription: (data) => request('/payments/subscription', { method: 'POST', body: toFormData(data) }),
  updateSubscription: (paymentId, data) => request(`/payments/subscription/${paymentId}`, { method: 'PUT', body: toFormData(data) }),
  cancelSubscription: (paymentId) => request(`/payments/subscription/${paymentId}/delete`, { method: 'PATCH' }),
  getVendorStatement: (vendorId) => request(withQuery('/payments/statement/vendor', vendorId ? { vendor_id: vendorId } : {})),
  getCustomerStatement: (phone) => request(`/payments/statement/customer/${phone}`),
}

// Complaint routes available to vendors and administrators
export const complaintApi = {
  create: (data) => request('/complaints/createComplaint', { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  getMine: (query) => request(withQuery('/complaints/getMyComplaints', query)),
  cancel: (complaintId) => request(`/complaints/cancelComplaint/${complaintId}`, { method: 'PUT' }),
  againstVendor: (query) => request(withQuery('/complaints/getComplaintsAgainstMe', query)),
  getAll: (query) => request(withQuery('/complaints/getAllComplaints', query)),
  getById: (complaintId) => request(`/complaints/getComplaintById/${complaintId}`),
  reply: (complaintId, reply) => request(`/complaints/respondToComplaint/${complaintId}`, { method: 'POST', body: JSON.stringify({ reply }) }),
  respond: (complaintId, data) => request(`/complaints/respondToComplaint/${complaintId}`, { method: 'POST', body: JSON.stringify(data) }),
}

export const aiApi = {
  chat: (query) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ query }) }),
}

export const reportApi = {
  submit: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
}

// Administrator approval and moderation routes
export const adminApi = {
  analytics: (query) => analyticsApi.admin(query),
  vendors: (query) => request(withQuery('/admin/vendor-approvals', query)),
  getVendor: (vendorId) => request(`/admin/vendor-approvals/${vendorId}`),
  updateVendorStatus: (vendorId, status, rejectionReason) => request(`/admin/vendor-approvals/${vendorId}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason }) }),
  staff: (query) => staffApi.getAll(query),
  reports: (query) => request(withQuery('/admin/reports', query)),
  resolveReport: (reportId, action, adminNotes) => request(`/admin/reports/${reportId}/resolve`, { method: 'POST', body: JSON.stringify({ action, adminNotes }) }),
  escalateReport: (reportId, escalationNotes) => request(`/admin/reports/${reportId}/escalate`, { method: 'POST', body: JSON.stringify({ escalationNotes }) }),
  moderationHistory: (userId) => request(`/admin/users/${userId}/moderation-history`),
  notifications: (query) => notificationApi.getMine(query),
  bookings: () => request('/bookings/all-bookings'),
  reviews: (query) => reviewApi.getAll(query),
  complaints: (query) => complaintApi.getAll(query),
  updateReviewStatus: (reviewId, status) => reviewApi.updateStatus(reviewId, status),
}

export { BASE_URL, request }
