import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #003366 0%, #0066cc 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16px',
  },
  navBrand: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  navLinks: {
    display: 'flex',
    gap: '4px',
    marginLeft: '32px',
  },
  navLink: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    background: '#003366',
    color: '#ffffff',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    background: '#e2e8f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  userName: {
    fontSize: '14px',
    color: '#475569',
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: '#64748b',
    marginBottom: '24px',
  },
  uploadZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
  },
  uploadIcon: {
    width: '56px',
    height: '56px',
    background: '#f1f5f9',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  uploadTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#334155',
    marginBottom: '4px',
  },
  uploadSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #003366 0%, #0066cc 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0, 51, 102, 0.25)',
  },
  greenBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  statusBadge: {
    padding: '8px 20px',
    borderRadius: '9999px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  successBadge: {
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#ffffff',
  },
  failBadge: {
    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    color: '#ffffff',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  infoCard: {
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  infoLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  infoValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryCard: {
    background: 'linear-gradient(135deg, #003366 0%, #0066cc 100%)',
    borderRadius: '16px',
    padding: '28px',
    marginBottom: '24px',
  },
  summaryTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '20px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  summaryValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  errorBox: {
    padding: '14px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '14px',
    borderLeft: '3px solid #dc2626',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: '#ffffff',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    background: '#f8fafc',
    borderRadius: '12px',
  },
  emptyIcon: {
    width: '56px',
    height: '56px',
    background: '#e2e8f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '4px',
  },
}

function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigated = useRef(false)

  useEffect(() => {
    if (navigated.current) return
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      navigated.current = true
      navigate('/upload', { replace: true })
    }
  }, [navigate])

  const handleGoogleLogin = useCallback(() => {
    setError('')
    setLoading(true)

    const clientId = '871051854278-tgov2na9jbu53n5680n9e3qpdlvh338b.apps.googleusercontent.com'
    
    if (window.google?.accounts?.oauth2) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            setError('Google login failed')
            setLoading(false)
            return
          }
          
          try {
            const res = await fetch('/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ access_token: response.access_token })
            })
            
            const data = await res.json()
            
            if (res.ok && data.token) {
              localStorage.setItem('token', data.token)
              localStorage.setItem('user', JSON.stringify(data.user))
              navigate('/upload')
            } else {
              setError(data.error || 'Login failed')
            }
          } catch (err) {
            setError('Connection error')
          }
          setLoading(false)
        }
      })
      client.requestAccessToken()
    } else {
      setError('Google not loaded. Refresh and try again.')
      setLoading(false)
    }
  }, [navigate])

  return (
    <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ ...styles.logo, width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px' }}>
            <span style={{ ...styles.logoText, fontSize: '24px' }}>N</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#003366', marginBottom: '4px' }}>NSU Audit</h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Student Transcript Verification System</p>
        </div>

        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>Welcome Back</h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Sign in with your university email</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ 
            ...styles.primaryBtn, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        {error && (
          <div style={{ ...styles.errorBox, marginTop: '20px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            <span style={{ fontWeight: '600', color: '#003366' }}>Restricted Access:</span> Only @northsouth.edu emails allowed
          </p>
        </div>

        <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          © 2024 NSU Audit System
        </p>
      </div>
    </div>
  )
}

export default Login
