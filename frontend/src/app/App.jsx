// Libraries
import { useEffect, useState } from 'react'

// Providers and components
import RouterProvider from './providers/RouterProvider.jsx'
import LoadingScreen from '../components/LoadingScreen.jsx'

// Application root
export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  if (isLoading) return <LoadingScreen />

  return (
    <RouterProvider />
  )
}
