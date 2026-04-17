import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [programs, setPrograms] = useState([])
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    dateOfBirth: '',
    enrollmentYear: '',
    graduationYear: '',
    program: '',
    courses: [{ code: '', title: '', credits: '', grade: '', semester: '' }],
    waivedCourses: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [programsData, auditsData] = await Promise.all([
        api.getPrograms(),
        api.getUserAudits()
      ])
      setPrograms(programsData.data || programsData)
      setAudits(auditsData.data || auditsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...formData.courses]
    newCourses[index] = { ...newCourses[index], [field]: value }
    setFormData(prev => ({ ...prev, courses: newCourses }))
  }

  const addCourse = () => {
    setFormData(prev => ({
      ...prev,
      courses: [...prev.courses, { code: '', title: '', credits: '', grade: '', semester: '' }]
    }))
  }

  const removeCourse = (index) => {
    if (formData.courses.length > 1) {
      const newCourses = formData.courses.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, courses: newCourses }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const auditData = {
        studentId: formData.studentId,
        studentName: formData.studentName,
        dateOfBirth: formData.dateOfBirth,
        enrollmentYear: parseInt(formData.enrollmentYear),
        graduationYear: parseInt(formData.graduationYear),
        program: formData.program,
        courses: formData.courses
          .filter(c => c.code && c.grade && c.semester)
          .map(c => ({
            code: c.code,
            title: c.title,
            credits: parseInt(c.credits) || 0,
            grade: c.grade,
            semester: c.semester
          })),
        waivedCourses: formData.waivedCourses 
          ? formData.waivedCourses.split(',').map(c => c.trim()).filter(c => c)
          : []
      }

      const result = await api.createAudit(auditData)
      navigate(`/audit/${result.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'W']

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <div className="loading">Please log in...</div>
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h2>NSU Audit System</h2>
        <div className="navbar-right">
          <div className="user-info">
            {user?.picture && <img src={user.picture} alt="" className="user-avatar" />}
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <form className="audit-form-container" onSubmit={handleSubmit}>
          <h3>New Audit</h3>
          
          <div className="form-section">
            <h4>Student Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Student ID</label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="19420001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Student Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="text"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  placeholder="15/03/2001"
                />
              </div>
            </div>
            <div className="form-row" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label>Enrollment Year</label>
                <input
                  type="number"
                  name="enrollmentYear"
                  value={formData.enrollmentYear}
                  onChange={handleInputChange}
                  placeholder="2023"
                />
              </div>
              <div className="form-group">
                <label>Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleInputChange}
                  placeholder="2027"
                />
              </div>
              <div className="form-group">
                <label>Program</label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(p => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Courses</h4>
            {formData.courses.map((course, index) => (
              <div key={index} className="course-entry">
                <div className="course-row">
                  <input
                    type="text"
                    placeholder="Code (e.g., ENG102)"
                    value={course.code}
                    onChange={(e) => handleCourseChange(index, 'code', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={course.title}
                    onChange={(e) => handleCourseChange(index, 'title', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Credits"
                    value={course.credits}
                    onChange={(e) => handleCourseChange(index, 'credits', e.target.value)}
                  />
                  <select
                    value={course.grade}
                    onChange={(e) => handleCourseChange(index, 'grade', e.target.value)}
                  >
                    <option value="">Grade</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Semester (e.g., Spring 2023)"
                    value={course.semester}
                    onChange={(e) => handleCourseChange(index, 'semester', e.target.value)}
                  />
                  <button
                    type="button"
                    className="remove-course-btn"
                    onClick={() => removeCourse(index)}
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
            <button type="button" className="add-course-btn" onClick={addCourse}>
              + Add Course
            </button>
          </div>

          <div className="form-section">
            <h4>Waivers (Optional)</h4>
            <div className="form-group">
              <label>Waived Courses (comma-separated)</label>
              <input
                type="text"
                name="waivedCourses"
                value={formData.waivedCourses}
                onChange={handleInputChange}
                placeholder="CSE115, CSE215"
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Processing...' : 'Run Audit'}
          </button>
        </form>

        {audits.length > 0 && (
          <div className="audit-history">
            <h3>Audit History</h3>
            <div className="audit-list">
              {audits.map(audit => (
                <div 
                  key={audit._id} 
                  className={`audit-item ${audit.result.level3.eligible ? 'eligible' : 'not-eligible'}`}
                >
                  <div className="audit-info">
                    <h4>{audit.studentName || 'Student'} - {audit.studentId}</h4>
                    <p>{audit.program}</p>
                    <p style={{ fontSize: 12, color: '#999' }}>
                      {new Date(audit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="audit-status">
                    <span className={`status-badge ${audit.result.level3.eligible ? 'eligible' : 'not-eligible'}`}>
                      {audit.result.level3.eligible ? 'Eligible' : 'Not Eligible'}
                    </span>
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/audit/${audit._id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
