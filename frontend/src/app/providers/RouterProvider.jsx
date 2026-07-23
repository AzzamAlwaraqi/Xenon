import { BrowserRouter } from 'react-router-dom'
import AppRoutes from '../../routes/index.jsx'

export default function RouterProvider() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
