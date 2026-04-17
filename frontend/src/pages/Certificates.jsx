import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const styles = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  navbar: { position: 'sticky', top: 0, zIndex: 50, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { width: '36px', height: '36px', background: 'linear-gradient(135deg, #003366 0%, #0066cc 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#ffffff', fontWeight: '700', fontSize: '16px' },
  navBrand: { fontSize: '18px', fontWeight: '600', color: '#1e293b' },
  navLinks: { display: 'flex', gap: '4px', marginLeft: '32px' },
  navLink: { padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#64748b', cursor: 'pointer', border: 'none', background: 'transparent' },
  main: { maxWidth: '800px', margin: '0 auto', padding: '32px 24px' },
  card: { background: '#ffffff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
  pageSubtitle: { fontSize: '15px', color: '#64748b', marginBottom: '24px' },
  certItem: { display: 'flex', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '12px', cursor: 'pointer' },
  certIcon: { width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', fontSize: '24px' },
  certInfo: { flex: 1 },
  certName: { fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' },
  certDate: { fontSize: '12px', color: '#94a3b8' },
  loading: { textAlign: 'center', padding: '48px', color: '#64748b' },
}

function Certificates() {
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) navigate('/login')
    else setUser(JSON.parse(savedUser))
  }, [navigate])

  useEffect(() => {
    if (user) fetchCertificates()
  }, [user])

  const fetchCertificates = async () => {
    try {
      const data = await api.getCertificates()
      setCertificates(data.certificates || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadCert = async (filename) => {
    try {
      const blob = await api.downloadCertificate(filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download: ' + err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatDate = (ts) => {
    if (!ts) return 'N/A'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logo}><span style={styles.logoText}>N</span></div>
          <span style={styles.navBrand}>NSU Audit</span>
          <div style={styles.navLinks}>
            <button onClick={() => navigate('/upload')} style={styles.navLink}>Upload</button>
            <button onClick={() => navigate('/history')} style={styles.navLink}>History</button>
            <button style={{ ...styles.navLink, background: '#003366', color: '#fff' }}>Certificates</button>
          </div>
        </div>
        <div>
          <span style={{ marginRight: '16px', color: '#475569' }}>{user?.name || user?.email}</span>
          <button onClick={handleLogout} style={{ ...styles.navLink, color: '#dc2626' }}>Logout</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.pageTitle}>Your Certificates</h2>
          <p style={styles.pageSubtitle}>Download previous graduation certificates</p>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : certificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              No certificates yet. Run an audit to generate one.
            </div>
          ) : (
            certificates.map((cert, i) => (
              <div key={i} style={styles.certItem} onClick={() => downloadCert(cert.filename)}>
                <div style={styles.certIcon}>📜</div>
                <div style={styles.certInfo}>
                  <div style={styles.certName}>{cert.filename}</div>
                  <div style={styles.certDate}>{formatDate(cert.timestamp)}</div>
                </div>
                <span style={{ color: '#003366', fontWeight: '600' }}>Download</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default Certificates