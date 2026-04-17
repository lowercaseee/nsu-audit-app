import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const styles = {
  container: { minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#e2e8f0' },
  navbar: { position: 'sticky', top: 0, zIndex: 50, background: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBrand: { fontSize: '18px', fontWeight: '600', color: '#fff' },
  navRight: { display: 'flex', gap: '12px' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  card: { background: '#1e293b', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid #334155' },
  title: { fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '16px' },
  jobInput: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '14px', marginBottom: '12px' },
  btn: { padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  logContainer: { background: '#0f172a', borderRadius: '8px', padding: '16px', maxHeight: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' },
  logLine: { padding: '4px 0', display: 'flex', gap: '12px' },
  timestamp: { color: '#64748b', minWidth: '80px' },
  infoLog: { color: '#3b82f6' },
  successLog: { color: '#22c55e' },
  errorLog: { color: '#ef4444' },
  warnLog: { color: '#f59e0b' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginRight: '8px' },
  connected: { background: '#22c55e' },
  disconnected: { background: '#ef4444' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' },
  statCard: { background: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center' },
  statValue: { fontSize: '24px', fontWeight: '600', color: '#fff' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px' }
}

function LiveDashboard() {
  const navigate = useNavigate()
  const [jobId, setJobId] = useState('')
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0 })
  const socketRef = useRef(null)
  const logsEndRef = useRef(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) navigate('/login')
  }, [navigate])

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const connectToJob = () => {
    if (!jobId.trim()) return
    
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    
    setLogs([])
    setStats({ total: 0, success: 0, errors: 0 })
    
    // Connect to Socket.io
    socketRef.current = io('http://localhost:5000')
    
    socketRef.current.on('connect', () => {
      setConnected(true)
      socketRef.current.emit('subscribe', jobId)
      addLog({ level: 'info', message: `Connected to job: ${jobId}` })
    })
    
    socketRef.current.on('disconnect', () => {
      setConnected(false)
      addLog({ level: 'warn', message: 'Disconnected from server' })
    })
    
    socketRef.current.on('jobLog', (data) => {
      addLog(data.log)
    })
  }

  const addLog = (log) => {
    setLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }])
    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      success: log.level === 'success' ? prev.success + 1 : prev.success,
      errors: log.level === 'error' ? prev.errors + 1 : prev.errors
    }))
  }

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogColor = (level) => {
    switch (level) {
      case 'success': return styles.successLog
      case 'error': return styles.errorLog
      case 'warn': return styles.warnLog
      default: return styles.infoLog
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #003366, #0066cc)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>N</div>
          <span style={styles.navBrand}>NSU Audit - Live Dashboard</span>
        </div>
        <div style={styles.navRight}>
          <button onClick={() => navigate('/upload')} style={{ ...styles.btn, background: '#475569' }}>Upload</button>
          <button onClick={() => navigate('/history')} style={{ ...styles.btn, background: '#475569' }}>History</button>
          <button onClick={handleLogout} style={{ ...styles.btn, background: '#dc2626' }}>Logout</button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.title}>Live Job Monitor</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Enter Job ID to monitor..."
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connectToJob()}
              style={styles.jobInput}
            />
            <button onClick={connectToJob} style={styles.btn}>Connect</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <span style={{ ...styles.statusDot, ...(connected ? styles.connected : styles.disconnected) }}></span>
            <span style={{ color: connected ? '#22c55e' : '#ef4444', fontSize: '14px' }}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Logs</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#22c55e' }}>{stats.success}</div>
            <div style={styles.statLabel}>Success</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#ef4444' }}>{stats.errors}</div>
            <div style={styles.statLabel}>Errors</div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ color: '#fff', marginBottom: '12px' }}>Execution Logs</h3>
          <div style={styles.logContainer}>
            {logs.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
                Enter a Job ID and click Connect to start monitoring
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={styles.logLine}>
                  <span style={styles.timestamp}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={getLogColor(log.level)}>
                    [{log.level.toUpperCase()}] {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default LiveDashboard
