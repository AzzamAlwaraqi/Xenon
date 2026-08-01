// Libraries
import { ArrowRight, Sparkles, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

// Images
const assets = {
  hero: 'https://images.unsplash.com/photo-1666689468289-bd7ae53d5ba9?auto=format&fit=crop&w=1800&q=86',
  destination: 'https://images.unsplash.com/photo-1500120194857-62b493650979?auto=format&fit=crop&w=1800&q=86',
  journal: 'https://images.unsplash.com/photo-1724739541524-dd6ee3fc7ff9?auto=format&fit=crop&w=1800&q=86',
}

// Landing page
export default function Landing() {
  return (
    <div className="landing">
      <nav className="nav">
        <Link className="brand" to="/">Xenon</Link>
        <div className="nav-links">
          <a href="#journey">Destinations</a>
          <a href="#journey">Experiences</a>
          <span className="nav-divider" />
          <Link to="/login">Login / Register</Link>
        </div>
      </nav>
      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">THE ARTISANAL JOURNEY</span>
            <h1>Travel with<br />Soul &amp; Substance.</h1>
            <p>Curated, slow-luxury experiences for the discerning traveler. Discover destinations that resonate with authenticity and quiet sophistication.</p>
            <Link className="primary-button pill-button" to="/login">Explore Collections <ArrowRight size={15} /></Link>
          </div>
          <div className="hero-image" style={{ backgroundImage: `url(${assets.hero})` }} role="img" aria-label="Wadi Rum desert landscape in Jordan" />
        </section>
        <section className="journey" id="journey">
          <h2>Begin Your Journey</h2>
          <div className="bento">
            <article className="bento-card large photo-card" style={{ backgroundImage: `url(${assets.destination})` }}>
              <div className="photo-content"><span className="card-kicker">PETRA · JORDAN</span><h3>Curated Destinations</h3><p>Walk through ancient rose-red cities and timeless desert passages.</p></div>
            </article>
            <article className="bento-card package-card">
              <span className="package-icon"><Sparkles size={22} /></span>
              <div><h3>Signature Jordan</h3><p>Petra, Wadi Rum and the Dead Sea, shaped into one unhurried journey.</p></div>
            </article>
            <article className="bento-card profile-card">
              <span className="avatar"><UserRound size={22} /></span>
              <strong>TRAVELER PROFILE</strong>
              <p>Log in to view your upcoming bookings and saved itineraries.</p>
              <Link className="text-link" to="/login">Sign In</Link>
            </article>
            <article className="bento-card large photo-card" style={{ backgroundImage: `url(${assets.journal})` }}>
              <div className="photo-content"><span className="card-kicker">WADI RUM · JORDAN</span><h3>The Xenon Journal</h3><p>Stories from local hosts, desert guides and Jordanian artisans.</p></div>
            </article>
          </div>
        </section>
      </main>
      <footer className="footer">
        <span className="serif" style={{ fontSize: 20 }}>Xenon</span>
        <div className="footer-links"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Contact Support</a></div>
        <span>© 2026 Xenon Artisanal Travel. All rights reserved.</span>
      </footer>
    </div>
  )
}
