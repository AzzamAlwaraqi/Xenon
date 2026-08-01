const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Something went wrong. Please try again.')
  }
  return payload
}

export const authApi = {
  registerTraveller: (data) =>
    request('/clients/create-client', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    request(`/${data.role === 'user' ? 'clients' : data.role === 'vendor' ? 'vendors' : 'admin'}/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export { BASE_URL, request }
