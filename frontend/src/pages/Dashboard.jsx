import { Link } from 'react-router-dom'
import { storage, ROLE_KEY } from '../services/storage.js'

export default function Dashboard() {
  const role = storage.get(ROLE_KEY) || 'user'

  return (
    <main className="simple-page">
      <Link className="brand" to="/">Xenon</Link>
      <h1 className="auth-title">{role === 'vendor' ? 'Vendor workspace' : 'Your journey'}</h1>
      <p>The account is connected. The dedicated dashboard design will be added from its Figma frame.</p>
    </main>
  )
}
