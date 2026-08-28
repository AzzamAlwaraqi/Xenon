// Libraries
import { Component } from 'react'

// Last-resort recovery UI for unexpected render failures
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, details) {
    if (import.meta.env.DEV) console.error('Xenon render failure', error, details)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="error-fallback" role="alert">
        <div className="legal-card">
          <span className="brand">Xenon</span>
          <h1 className="auth-title">This page could not be displayed</h1>
          <p>Your account data is safe. Refresh this page or return to the home screen and try again.</p>
          <div className="row-actions">
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>Refresh page</button>
            <a className="vendor-button secondary" href="/">Return home</a>
          </div>
        </div>
      </main>
    )
  }
}
