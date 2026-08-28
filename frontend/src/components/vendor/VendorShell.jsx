// Libraries
import { BarChart3, Bell, Box, CalendarDays, CircleDollarSign, CircleUserRound, LayoutDashboard, LogOut, MessageSquareWarning, Settings, Star, UserCog } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

// Services
import { authApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'

const navigation = [
  { to: '/vendor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/vendor/packages', label: 'Packages', icon: Box },
  { to: '/vendor/bookings', label: 'Booking Requests', icon: CalendarDays },
  { to: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/vendor/staff', label: 'Staff', icon: UserCog },
  { to: '/vendor/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/vendor/reviews', label: 'Reviews', icon: Star },
  { to: '/vendor/notifications', label: 'Notifications', icon: Bell },
  { to: '/vendor/payments', label: 'Payments', icon: CircleDollarSign },
  { to: '/vendor/profile', label: 'Profile', icon: CircleUserRound },
  { to: '/vendor/settings', label: 'Settings', icon: Settings },
]

// Shared vendor portal layout
export default function VendorShell({ title, subtitle, children }) {
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
    <div className="vendor-app">
      <aside className="vendor-sidebar">
        <Link className="vendor-logo" to="/vendor">Xenon</Link>
        <span className="vendor-kicker">VENDOR PORTAL</span>

        <nav className="vendor-nav">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} end={end} to={to}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="vendor-logout" type="button" onClick={logout}>
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      <main className="vendor-main">
        <header className="vendor-header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        {children}
      </main>
    </div>
  )
}
