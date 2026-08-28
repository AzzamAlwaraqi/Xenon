// Libraries
import { Navigate, Outlet, useLocation } from 'react-router-dom'

// Hooks and utilities
import useAuthSession from '../hooks/useAuthSession.js'
import { isExpiredToken } from '../utils/authToken.js'

// Admin-only route guard
export default function AdminRoute() {
  const location = useLocation()
  const { token, role } = useAuthSession()
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'

  if (isDevelopmentPreview) return <Outlet />
  if (!token || isExpiredToken(token)) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role !== 'admin') return <Navigate to="/vendor" replace />
  return <Outlet />
}
