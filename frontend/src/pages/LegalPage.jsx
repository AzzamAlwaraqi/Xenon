// Libraries
import { Link } from 'react-router-dom'

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    paragraphs: [
      'Xenon uses account, booking, and business information to provide and secure its travel services.',
      'Authentication credentials must be transmitted only over HTTPS in production. Access to personal data must remain limited to authorized roles and protected backend endpoints.',
      'A complete legally reviewed policy must replace this development notice before public launch.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    paragraphs: [
      'Vendor and administrator access is intended only for authorized Xenon partners and staff.',
      'Test accounts, sample records, and local credentials must not be used as real customer or production information.',
      'A complete legally reviewed agreement must replace this development notice before public launch.',
    ],
  },
}

// Simple legal placeholder with honest pre-launch status
export default function LegalPage({ type }) {
  const page = CONTENT[type]
  return (
    <main className="simple-page">
      <Link className="brand" to="/">Xenon</Link>
      <article className="login-card legal-card">
        <h1 className="auth-title">{page.title}</h1>
        {page.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <Link className="text-link" to="/">Return home</Link>
      </article>
    </main>
  )
}
