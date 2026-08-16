import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config.js'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound  from '../pages/NotFound.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import TravellerRegistration from '../pages/TravellerRegistration.jsx'
import VendorRegistration from '../pages/VendorRegistration.jsx'
import VendorRoute from '../components/VendorRoute.jsx'
import { VendorAnalytics, VendorBookingDetails, VendorBookings, VendorDashboard, VendorPackageDetails, VendorPackageForm, VendorPackages, VendorProfile, VendorSettings } from '../pages/VendorPortal.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path={ROUTES.HOME} element={<Navigate to="/" replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.TRAVELLER_REGISTER} element={<TravellerRegistration />} />
      <Route path={ROUTES.VENDOR_REGISTER} element={<VendorRegistration />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route element={<VendorRoute />}>
        <Route path={ROUTES.VENDOR} element={<VendorDashboard />} />
        <Route path={ROUTES.VENDOR_PACKAGES} element={<VendorPackages />} />
        <Route path={ROUTES.VENDOR_PACKAGE_CREATE} element={<VendorPackageForm />} />
        <Route path="/vendor/packages/:packageId" element={<VendorPackageDetails />} />
        <Route path="/vendor/packages/:packageId/edit" element={<VendorPackageForm edit />} />
        <Route path={ROUTES.VENDOR_BOOKINGS} element={<VendorBookings />} />
        <Route path="/vendor/bookings/:bookingId" element={<VendorBookingDetails />} />
        <Route path={ROUTES.VENDOR_ANALYTICS} element={<VendorAnalytics />} />
        <Route path={ROUTES.VENDOR_PROFILE} element={<VendorProfile />} />
        <Route path={ROUTES.VENDOR_SETTINGS} element={<VendorSettings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
