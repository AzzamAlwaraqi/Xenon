// Libraries
import { useEffect, useState } from 'react'

// Services
import { AUTH_CHANGE_EVENT, ROLE_KEY, TOKEN_KEY, storage } from '../services/storage.js'
import { isExpiredToken } from '../utils/authToken.js'

function readAuthSession() {
  return {
    token: storage.get(TOKEN_KEY),
    role: storage.get(ROLE_KEY),
  }
}

// Keep route guards synchronized with login/logout changes in this tab.
export default function useAuthSession() {
  const [session, setSession] = useState(readAuthSession)

  useEffect(() => {
    const refresh = () => setSession(readAuthSession())
    window.addEventListener(AUTH_CHANGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (session.token && isExpiredToken(session.token)) storage.clearAuth()
  }, [session.token])

  return session
}
