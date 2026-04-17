import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Upload from './pages/Upload'
import History from './pages/History'
import Certificates from './pages/Certificates'

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
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/upload" replace />} />
      </Routes>
    </div>
  )
}

export default App
