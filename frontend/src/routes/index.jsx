import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config.js'
// import ProtectedRoute from './ProtectedRoute.jsx'
// import Login     from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound  from '../pages/NotFound.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
