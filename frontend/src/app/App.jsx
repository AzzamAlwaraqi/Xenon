import RouterProvider from './providers/RouterProvider.jsx'
import ThemeProvider from './providers/ThemeProvider.jsx'
import StoreProvider from './providers/StoreProvider.jsx'

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <RouterProvider />
      </ThemeProvider>
    </StoreProvider>
  )
}
