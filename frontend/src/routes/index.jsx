import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config.js'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound  from '../pages/NotFound.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import TravellerRegistration from '../pages/TravellerRegistration.jsx'
import VendorRegistration from '../pages/VendorRegistration.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path={ROUTES.HOME} element={<Navigate to="/" replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.TRAVELLER_REGISTER} element={<TravellerRegistration />} />
      <Route path={ROUTES.VENDOR_REGISTER} element={<VendorRegistration />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
