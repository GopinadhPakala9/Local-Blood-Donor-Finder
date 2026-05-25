import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage      from './pages/LoginPage'
import Dashboard      from './pages/Dashboard'
import DonorSearch    from './pages/DonorSearch'
import BloodRequests  from './pages/BloodRequests'
import CreateRequest  from './pages/CreateRequest'
import DonorProfile   from './pages/DonorProfile'
import Navbar         from './components/Navbar'

function PrivateLayout({ children }) {
  const token = localStorage.getItem('accessToken')
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 70, minHeight: '100vh', background: 'var(--bg)' }}>
        {children}
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/donors" element={<PrivateLayout><DonorSearch /></PrivateLayout>} />
        <Route path="/donors/:id" element={<PrivateLayout><DonorProfile /></PrivateLayout>} />
        <Route path="/requests" element={<PrivateLayout><BloodRequests /></PrivateLayout>} />
        <Route path="/requests/new" element={<PrivateLayout><CreateRequest /></PrivateLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
