import { useState, useEffect, useRef } from 'react'
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
  uploadZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
    marginBottom: '20px',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  greenBtn: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
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
    padding: '10px 24px',
    borderRadius: '9999px',
    fontSize: '15px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '24px',
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
  errorBox: {
    padding: '14px 16px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: '10px',
    fontSize: '14px',
    borderLeft: '3px solid #dc2626',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
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

const getGradeColor = (grade) => {
  if (grade?.startsWith('A')) return { bg: '#dcfce7', color: '#16a34a' }
  if (grade?.startsWith('B')) return { bg: '#dbeafe', color: '#2563eb' }
  if (grade?.startsWith('C')) return { bg: '#fef3c7', color: '#d97706' }
  return { bg: '#fee2e2', color: '#dc2626' }
}

function Upload() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const fileInputRef = useRef(null)
  const [hoverUpload, setHoverUpload] = useState(false)
  const [hoverBtn, setHoverBtn] = useState(false)
  const [hoverDownload, setHoverDownload] = useState(false)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (!savedUser) navigate('/login')
    else setUser(JSON.parse(savedUser))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setSelectedImage(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const processTranscript = async () => {
    setIsProcessing(true)
    setError('')
    setResult(null)
    
    try {
      const token = localStorage.getItem('token')
      const body = selectedImage 
        ? JSON.stringify({ image: selectedImage })
        : JSON.stringify({})
      
      const res = await fetch('/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process')
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to process transcript')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadPdf = () => {
    if (result?.pdf) {
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${result.pdf}`
      link.download = 'certificate.pdf'
      link.click()
    } else {
      window.open('/certificate-image', '_blank')
    }
  }

  const isGraduated = result?.result === 'GRADUATED'

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
            <button style={{ ...styles.navLink, ...styles.navLinkActive }}>Upload</button>
            <button 
              onClick={() => navigate('/history')}
              onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
              style={styles.navLink}
            >
              History
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
              style={styles.navLink}
            >
              Live Dashboard
            </button>
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
          <h2 style={styles.pageTitle}>Transcript Verification</h2>
          <p style={styles.pageSubtitle}>Upload your official transcript for automated verification and audit</p>
          
          {/* Upload Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setHoverUpload(true)}
            onMouseLeave={() => setHoverUpload(false)}
            style={{ 
              ...styles.uploadZone, 
              borderColor: hoverUpload ? '#94a3b8' : '#cbd5e1',
              background: selectedImage ? '#f1f5f9' : '#f8fafc',
            }}
          >
            {selectedImage ? (
              <div>
                <img src={selectedImage} alt="Selected" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                <p style={{ ...styles.uploadSubtitle, marginTop: '12px' }}>Click to change image</p>
              </div>
            ) : (
              <div>
                <div style={styles.uploadIcon}>
                  <svg width="24" height="24" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p style={styles.uploadTitle}>Drop transcript image or click to browse</p>
                <p style={styles.uploadSubtitle}>Supports JPG, PNG (max 10MB)</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />

          <button 
            onClick={processTranscript} 
            disabled={isProcessing}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            style={{ 
              ...styles.primaryBtn, 
              transform: hoverBtn && !isProcessing ? 'translateY(-1px)' : 'none',
              opacity: isProcessing ? 0.7 : 1,
            }}
          >
            {isProcessing ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Processing...
              </>
            ) : 'Scan Transcript'}
          </button>

          {error && <div style={{ ...styles.errorBox, marginTop: '16px' }}>{error}</div>}
        </div>

        {/* Results */}
        {result && (
          <div style={{ marginTop: '24px' }}>
            {/* Status Badge */}
            <div style={{ 
              ...styles.statusBadge, 
              ...(isGraduated ? styles.successBadge : styles.failBadge),
              marginBottom: '24px',
              padding: '12px 28px',
            }}>
              {isGraduated ? (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              ) : (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              )}
              {result.result} — {result.courses?.length || 0} courses verified
            </div>

            {/* Student Info */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Student Information</h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Name</div>
                  <div style={styles.infoValue}>{result.student?.name}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Student ID</div>
                  <div style={styles.infoValue}>{result.student?.id}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Degree</div>
                  <div style={{ ...styles.infoValue, fontSize: '15px' }}>{result.student?.degree}</div>
                </div>
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Date of Birth</div>
                  <div style={styles.infoValue}>{result.student?.dob}</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={styles.summaryCard}>
                <div style={styles.summaryTitle}>Academic Summary</div>
                <div style={styles.summaryGrid}>
                  <div>
                    <div style={styles.summaryValue}>{result.summary?.totalCredits}</div>
                    <div style={styles.summaryLabel}>Total Credits</div>
                  </div>
                  <div>
                    <div style={styles.summaryValue}>{result.summary?.cgpa}</div>
                    <div style={styles.summaryLabel}>CGPA</div>
                  </div>
                  <div>
                    <div style={styles.summaryValue}>{result.summary?.degreeCompleted}</div>
                    <div style={styles.summaryLabel}>Degree Completed</div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Table */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Course Details ({result.courses?.length || 0})</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Course Code</th>
                      <th style={styles.th}>Grade</th>
                      <th style={styles.th}>Credits</th>
                      <th style={styles.th}>Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.courses?.map((c, i) => {
                      const gradeColors = getGradeColor(c.grade)
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ ...styles.td, fontWeight: '500' }}>{c.code}</td>
                          <td style={styles.td}>
                            <span style={{ 
                              ...styles.gradeBadge, 
                              background: gradeColors.bg, 
                              color: gradeColors.color 
                            }}>
                              {c.grade}
                            </span>
                          </td>
                          <td style={styles.td}>{c.credits}</td>
                          <td style={styles.td}>{c.semester}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Download Button */}
            <button 
              onClick={downloadPdf}
              onMouseEnter={() => setHoverDownload(true)}
              onMouseLeave={() => setHoverDownload(false)}
              style={{ 
                ...styles.greenBtn, 
                marginTop: '24px',
                transform: hoverDownload ? 'translateY(-2px)' : 'none',
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download Certificate
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default Upload
