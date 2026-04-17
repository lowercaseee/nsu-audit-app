import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Upload from './pages/Upload'
import History from './pages/History'
import LiveDashboard from './pages/LiveDashboard'
import './index.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [navigated, setNavigated] = React.useState(false)
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }
  
  if (!user && !navigated) {
    setNavigated(true)
    return <Navigate to="/login" replace />
  }
  
  return user ? children : null
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><LiveDashboard /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/upload" replace />} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)
