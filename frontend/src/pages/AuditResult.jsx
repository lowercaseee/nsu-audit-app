import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'

function AuditResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState('')

  useEffect(() => {
    loadAudit()
  }, [id])

  const loadAudit = async () => {
    try {
      const data = await api.getAudit(id)
      setAudit(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async (type) => {
    setDownloading(type)
    try {
      const blob = await api.getAuditPdf(id, type)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${audit.studentId || id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err.message)
    } finally {
      setDownloading('')
    }
  }

  const getMissingCourses = () => {
    const missing = []
    const mc = audit.result.level3.missingCourses
    if (mc.mandatoryGed?.length) missing.push(...mc.mandatoryGed.map(c => `GED: ${c}`))
    if (mc.coreMath?.length) missing.push(...mc.coreMath.map(c => `Math: ${c}`))
    if (mc.coreBusiness?.length) missing.push(...mc.coreBusiness.map(c => `Business: ${c}`))
    if (mc.majorCore?.length) missing.push(...mc.majorCore.map(c => `Major: ${c}`))
    return missing
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (error) {
    return (
      <div className="audit-result">
        <div className="error-message">{error}</div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const { result } = audit

  return (
    <div className="audit-result">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="result-card">
        <div className="result-header">
          <div className="student-info">
            <h2>{audit.studentName || 'Student Audit'}</h2>
            <p>ID: {audit.studentId || 'N/A'} | {audit.program}</p>
            <p>Created: {new Date(audit.createdAt).toLocaleString()}</p>
          </div>
          <div className={`eligibility-badge ${result.level3.eligible ? 'eligible' : 'not-eligible'}`}>
            {result.level3.eligible ? 'ELIGIBLE FOR GRADUATION' : 'NOT ELIGIBLE'}
          </div>
        </div>

        <div className="result-section">
          <h4>Academic Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">CGPA</div>
              <div className="value">{result.level2.cgpa}</div>
            </div>
            <div className="summary-item">
              <div className="label">Credits Earned</div>
              <div className="value">{result.level1.totalCredits}</div>
            </div>
            <div className="summary-item">
              <div className="label">Status</div>
              <div className="value" style={{ fontSize: 14 }}>
                {result.level3.on_probation ? 'On Probation' : 'Good Standing'}
              </div>
            </div>
          </div>
        </div>

        <div className="result-section">
          <h4>Course Statistics</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="label">Valid Courses</div>
              <div className="value">{result.level1.validCourses}</div>
            </div>
            <div className="summary-item">
              <div className="label">Failed</div>
              <div className="value">{result.level1.failedCourses}</div>
            </div>
            <div className="summary-item">
              <div className="label">Withdrawn</div>
              <div className="value">{result.level1.withdrawnCourses}</div>
            </div>
          </div>
        </div>

        {result.level3.creditDeficit > 0 && (
          <div className="result-section">
            <h4>Credit Deficit</h4>
            <div className="missing-courses">
              Missing {result.level3.creditDeficit} credits for graduation
            </div>
          </div>
        )}

        {getMissingCourses().length > 0 && (
          <div className="result-section">
            <h4>Missing Required Courses</h4>
            <div className="missing-courses">
              <ul>
                {getMissingCourses().map((course, i) => (
                  <li key={i}>{course}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result.level3.eligible && (
          <div className="pdf-buttons">
            <button 
              className="pdf-btn" 
              onClick={() => downloadPdf('transcript')}
              disabled={downloading === 'transcript'}
            >
              {downloading === 'transcript' ? 'Generating...' : '📄 Download Transcript'}
            </button>
            <button 
              className="pdf-btn" 
              onClick={() => downloadPdf('certificate')}
              disabled={downloading === 'certificate'}
            >
              {downloading === 'certificate' ? 'Generating...' : '🎓 Download Certificate'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditResult
