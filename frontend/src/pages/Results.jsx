import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Results() {
  const { logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [studentData, setStudentData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedData = localStorage.getItem('studentData')
    if (storedData) {
      setStudentData(JSON.parse(storedData))
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('studentData')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    logout()
    navigate('/login')
  }

  const downloadTranscript = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/pdf/direct/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentData })
      })
      
      if (!res.ok) {
        throw new Error('Failed to download')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcript_${studentData?.studentId || 'student'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download transcript: ' + err.message)
    }
  }

  const downloadCertificate = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:3000/api/pdf/direct/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentData })
      })
      
      if (!res.ok) {
        throw new Error('Failed to download')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate_${studentData?.studentId || 'student'}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download certificate: ' + err.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!studentData) {
    return (
      <div className="results-page">
        <div className="results-card" style={{ padding: 40, textAlign: 'center' }}>
          <h2>No Results Found</h2>
          <p>Please log in with a valid test email (e.g., test001@northsouth.edu)</p>
          <Link to="/login" className="back-link">Back to Login</Link>
        </div>
      </div>
    )
  }

  const semesters = [...new Set(studentData.courses.map(c => c.semester))].sort()

  return (
    <div className="results-page">
      <nav className="navbar">
        <h2>NSU Audit System</h2>
        <div className="navbar-right">
          <div className="user-info">
            <span className="user-name">{studentData.studentName}</span>
          </div>
          <Link to="/dashboard" className="nav-link">New Audit</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="results-content">
        <div className="results-card">
          <div className="results-header">
            <div className="student-info">
              <h1>{studentData.studentName}</h1>
              <p>ID: {studentData.studentId} | {studentData.program}</p>
            </div>
            <div className="summary-stats">
              <div className="stat-box cgpa">
                <span className="stat-label">CGPA</span>
                <span className="stat-value">{studentData.cgpa}</span>
              </div>
              <div className="stat-box credits">
                <span className="stat-label">Credits Completed</span>
                <span className="stat-value">{studentData.totalCredits}</span>
              </div>
            </div>
          </div>

          <div className="download-buttons">
            <button className="download-btn transcript" onClick={downloadTranscript}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Download Transcript
            </button>
            <button className="download-btn certificate" onClick={downloadCertificate}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
              </svg>
              Download Certificate
            </button>
          </div>

          <div className="courses-section">
            <h3>Course List</h3>
            {semesters.map(semester => (
              <div key={semester} className="semester-group">
                <h4 className="semester-title">{semester}</h4>
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Title</th>
                      <th>Credits</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentData.courses
                      .filter(c => c.semester === semester)
                      .map((course, idx) => (
                        <tr key={idx}>
                          <td>{course.code}</td>
                          <td>{course.title}</td>
                          <td>{course.credits}</td>
                          <td>
                            <span className={`grade-badge grade-${course.grade.replace('+', '-plus').replace('-', '-minus')}`}>
                              {course.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results
