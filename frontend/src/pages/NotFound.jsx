import { Link } from 'react-router-dom'

export default function NotFound() {
  return <main className="simple-page"><h1 className="auth-title">Page not found</h1><Link className="text-link" to="/">Return to Xenon</Link></main>
}
