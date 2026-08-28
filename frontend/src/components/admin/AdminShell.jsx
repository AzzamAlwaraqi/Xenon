// Libraries
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, BookOpen, CircleDollarSign, CircleUserRound, LayoutDashboard, LogOut, MessageSquareWarning, Settings, Store, UserCog } from 'lucide-react'

// Services
import { authApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'

const links = [
  ['/admin', 'Dashboard', LayoutDashboard],
  ['/admin/bookings', 'Bookings', BookOpen],
  ['/admin/vendors', 'Vendors', Store],
  ['/admin/reviews', 'Reviews', MessageSquareWarning],
  ['/admin/staff', 'Staff', UserCog],
  ['/admin/reports', 'Reports', MessageSquareWarning],
  ['/admin/complaints', 'Complaints', MessageSquareWarning],
  ['/admin/analytics', 'Analytics', BarChart3],
  ['/admin/notifications', 'Notifications', Bell],
  ['/admin/payments', 'Payments', CircleDollarSign],
  ['/admin/profile', 'Profile', CircleUserRound],
  ['/admin/settings', 'Settings', Settings],
]

// Shared admin portal layout
export default function AdminShell() {
  const navigate = useNavigate()

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Local logout must still succeed when the API is unavailable.
    }
    storage.clearAuth()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>Xenon</span><small>PREMIUM TRAVEL</small></div>
        <nav>{links.map(([to, label, Icon]) => <NavLink key={to} end={to === '/admin'} to={to}><Icon size={18} />{label}</NavLink>)}</nav>
        <button className="admin-logout" onClick={logout}><LogOut size={18} />Logout</button>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}
