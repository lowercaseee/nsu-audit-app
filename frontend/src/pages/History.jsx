import { useState, useEffect } from 'react'
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
    maxWidth: '1100px',
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
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #f1f5f9',
    background: '#f8fafc',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b',
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

function History() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) navigate('/login')
    else setUser(JSON.parse(savedUser))
  }, [navigate])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api-history', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch history')
        const data = await res.json()
        setHistory(data.history || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatTimestamp = (ts) => {
    const date = new Date(ts)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}>
            <span style={styles.logoText}>N</span>
          </div>
          <span style={styles.navBrand}>NSU Audit</span>
          <div style={styles.navLinks}>
            <button 
              onClick={() => navigate('/upload')}
              style={styles.navLink}
              onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              Upload
            </button>
            <button style={{ ...styles.navLink, ...styles.navLinkActive }}>History</button>
          </div>
        </div>
        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <span style={styles.userName}>{user?.name || user?.email?.split('@')[0]}</span>
          </div>
          <button 
            onClick={handleLogout}
            style={styles.logoutBtn}
            onMouseOver={(e) => e.target.style.background = '#fecaca'}
            onMouseOut={(e) => e.target.style.background = '#fef2f2'}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.pageTitle}>API History</h2>
          <p style={styles.pageSubtitle}>View recent API activity and usage</p>
          
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : error ? (
            <div style={{ padding: '16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px' }}>{error}</div>
          ) : history.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <svg width="24" height="24" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p style={styles.emptyTitle}>No API history yet</p>
              <p style={styles.emptySubtitle}>Your API calls will appear here</p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Endpoint</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const isSuccess = h.status === 'success'
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px' }}>{h.endpoint}</td>
                        <td style={styles.td}>
                          <span style={{ 
                            ...styles.statusBadge,
                            background: isSuccess ? '#dcfce7' : '#fee2e2',
                            color: isSuccess ? '#16a34a' : '#dc2626',
                          }}>
                            {h.status}
                          </span>
                        </td>
                        <td style={styles.td}>{formatTimestamp(h.timestamp)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default History
