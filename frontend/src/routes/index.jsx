import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config.js'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound  from '../pages/NotFound.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import TravellerRegistration from '../pages/TravellerRegistration.jsx'
import VendorRegistration from '../pages/VendorRegistration.jsx'
import VendorRoute from '../components/VendorRoute.jsx'
import RequireAuth from '../components/RequireAuth.jsx'
import AdminRoute from '../components/AdminRoute.jsx'
import { VendorAnalytics, VendorBookingDetails, VendorBookings, VendorDashboard, VendorPackageDetails, VendorPackageForm, VendorPackages, VendorProfile, VendorSettings } from '../pages/VendorPortal.jsx'
import Profile from '../pages/client/Profile.jsx'
import Settings from '../pages/client/Settings.jsx'
import MyReviews from '../pages/client/MyReviews.jsx'
import Packages from '../pages/client/Packages.jsx'
import PackageDetail from '../pages/client/PackageDetail.jsx'
import Bookings from '../pages/client/Bookings.jsx'
import BookingDetail from '../pages/client/BookingDetail.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import AdminVendors from '../pages/admin/AdminVendors.jsx'
import AdminReports from '../pages/admin/AdminReports.jsx'
import AdminReviews from '../pages/admin/AdminReviews.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path={ROUTES.HOME} element={<Navigate to="/" replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.TRAVELLER_REGISTER} element={<TravellerRegistration />} />
      <Route path={ROUTES.VENDOR_REGISTER} element={<VendorRegistration />} />
      <Route path={ROUTES.PACKAGES} element={<Packages />} />
      <Route path="/packages/:packageId" element={<PackageDetail />} />

      <Route element={<RequireAuth />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
        <Route path={ROUTES.MY_REVIEWS} element={<MyReviews />} />
        <Route path={ROUTES.BOOKINGS} element={<Bookings />} />
        <Route path="/bookings/:bookingId" element={<BookingDetail />} />
      </Route>

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

      <Route element={<AdminRoute />}>
        <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
        <Route path={ROUTES.ADMIN_VENDORS} element={<AdminVendors />} />
        <Route path={ROUTES.ADMIN_REPORTS} element={<AdminReports />} />
        <Route path={ROUTES.ADMIN_REVIEWS} element={<AdminReviews />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
