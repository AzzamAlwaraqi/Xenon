// Libraries
import { Navigate, Outlet, useLocation } from 'react-router-dom'

// Services
import { storage, TOKEN_KEY } from '../services/storage.js'

// Any-role authenticated route guard
export default function RequireAuth() {
  const location = useLocation()
  const token = storage.get(TOKEN_KEY)
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'

  if (isDevelopmentPreview) return <Outlet />
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
