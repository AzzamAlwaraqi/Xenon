// Libraries
import { Flag, LayoutDashboard, LogOut, ShieldCheck, Star } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

// Services
import { authApi } from '../../services/api.js'
import { storage } from '../../services/storage.js'

const navigation = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/vendors', label: 'Vendor Approvals', icon: ShieldCheck },
  { to: '/admin/reports', label: 'Moderation Reports', icon: Flag },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
]

// Shared admin console layout
export default function AdminShell({ title, subtitle, children }) {
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
        <Link className="vendor-logo" to={`/admin${previewSuffix}`}>Xenon</Link>
        <span className="vendor-kicker">ADMIN CONSOLE</span>

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
