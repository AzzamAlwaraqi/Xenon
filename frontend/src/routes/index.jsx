import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes.config.js'
import NotFound  from '../pages/NotFound.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import ResetPassword from '../pages/ResetPassword.jsx'
import LegalPage from '../pages/LegalPage.jsx'
import VendorRegistration from '../pages/VendorRegistration.jsx'
import VendorRoute from '../components/VendorRoute.jsx'
import AdminRoute from '../components/AdminRoute.jsx'
import AdminShell from '../components/admin/AdminShell.jsx'
import { AdminAnalytics, AdminBookings, AdminDashboard } from '../pages/AdminPortal.jsx'
import { VendorAnalytics, VendorBookingDetails, VendorBookings, VendorDashboard, VendorPackageDetails, VendorPackageForm, VendorPackages, VendorProfile, VendorSettings } from '../pages/VendorPortal.jsx'
import AdminVendors from '../pages/admin/AdminVendors.jsx'
import AdminReports from '../pages/admin/AdminReports.jsx'
import AdminReviews from '../pages/admin/AdminReviews.jsx'
import StaffManagement from '../pages/StaffManagement.jsx'
import NotificationsPage from '../pages/NotificationsPage.jsx'
import VendorStaff from '../pages/vendor/VendorStaff.jsx'
import VendorComplaints from '../pages/vendor/VendorComplaints.jsx'
import VendorReviews from '../pages/vendor/VendorReviews.jsx'
import VendorNotifications from '../pages/vendor/VendorNotifications.jsx'
import VendorPayments from '../pages/vendor/VendorPayments.jsx'
import PaymentsPage from '../pages/PaymentsPage.jsx'
import AdminComplaints from '../pages/admin/AdminComplaints.jsx'
import AdminBookingDetails from '../pages/admin/AdminBookingDetails.jsx'
import AdminProfile from '../pages/admin/AdminProfile.jsx'
import AdminSettings from '../pages/admin/AdminSettings.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path={ROUTES.HOME} element={<Navigate to="/" replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={ROUTES.VENDOR_REGISTER} element={<VendorRegistration />} />
      <Route path={ROUTES.PRIVACY} element={<LegalPage type="privacy" />} />
      <Route path={ROUTES.TERMS} element={<LegalPage type="terms" />} />
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
        <Route path={ROUTES.VENDOR_STAFF} element={<VendorStaff />} />
        <Route path={ROUTES.VENDOR_COMPLAINTS} element={<VendorComplaints />} />
        <Route path={ROUTES.VENDOR_REVIEWS} element={<VendorReviews />} />
        <Route path={ROUTES.VENDOR_NOTIFICATIONS} element={<VendorNotifications />} />
        <Route path={ROUTES.VENDOR_PAYMENTS} element={<VendorPayments />} />
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/bookings/:bookingId" element={<AdminBookingDetails />} />
          <Route path="/admin/vendors" element={<AdminVendors />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/staff" element={<StaffManagement role="admin" />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/complaints" element={<AdminComplaints />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/notifications" element={<NotificationsPage role="admin" />} />
          <Route path="/admin/payments" element={<PaymentsPage role="admin" />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
