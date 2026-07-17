// import api from '../../services/api.js'

export const authApi = {
  login:    (credentials) => Promise.resolve(credentials), // api.post('/clients/login', credentials)
  register: (data)        => Promise.resolve(data),        // api.post('/clients/register', data)
  logout:   ()            => Promise.resolve(),             // api.post('/clients/logout')
  getMe:    ()            => Promise.resolve(),             // api.get('/clients/me')
}
