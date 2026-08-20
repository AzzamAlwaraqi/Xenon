// Libraries
import { CircleUserRound, CompassIcon, LayoutDashboard, LogOut, Settings, Star, Ticket } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

// Services
import { authApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/packages', label: 'Explore Packages', icon: CompassIcon },
  { to: '/bookings', label: 'My Bookings', icon: Ticket },
  { to: '/reviews', label: 'My Reviews', icon: Star },
  { to: '/profile', label: 'Profile', icon: CircleUserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// Shared traveller portal layout
export default function ClientShell({ title, subtitle, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'
  const previewSuffix = isPreview ? '?preview=1' : ''

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Local logout must still succeed when the API is unavailable.
    }

    storage.clear()
    navigate('/login')
  }

  return (
    <div className="vendor-app">
      <aside className="vendor-sidebar">
        <Link className="vendor-logo" to={`/dashboard${previewSuffix}`}>Xenon</Link>
        <span className="vendor-kicker">TRAVELLER PORTAL</span>

        <nav className="vendor-nav">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} end={end} to={`${to}${previewSuffix}`}>
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
