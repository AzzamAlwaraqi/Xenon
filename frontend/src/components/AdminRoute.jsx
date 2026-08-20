// Libraries
import { Navigate, Outlet, useLocation } from 'react-router-dom'

// Services
import { storage, ROLE_KEY, TOKEN_KEY } from '../services/storage.js'

// Admin-only route guard
export default function AdminRoute() {
  const location = useLocation()
  const token = storage.get(TOKEN_KEY)
  const role = storage.get(ROLE_KEY)
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'

  if (isDevelopmentPreview) return <Outlet />
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
