const API_URL = '/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const handleResponse = async (res) => {
  const text = await res.text()
  
  if (!text) {
    throw new Error('Empty response')
  }
  
  const data = JSON.parse(text)
  
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error(data.message || 'Session expired')
  }
  
  if (res.status === 403) {
    throw new Error(data.message || 'Access denied')
  }
  
  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }
  
  return data
}

export const api = {
  async googleLogin(googleToken) {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken })
    })
    return handleResponse(res)
  },

  async getMe() {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    })
    return handleResponse(res)
  },

  async getPrograms() {
    const res = await fetch(`${API_URL}/audit`)
    return handleResponse(res)
  },

  async createAudit(auditData) {
    const res = await fetch(`${API_URL}/audit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(auditData)
    })
    return handleResponse(res)
  },

  async getAudit(id) {
    const res = await fetch(`${API_URL}/audit/${id}`, {
      headers: getAuthHeaders()
    })
    return handleResponse(res)
  },

  async getUserAudits() {
    const res = await fetch(`${API_URL}/audit/my/audits`, {
      headers: getAuthHeaders()
    })
    return handleResponse(res)
  },

  async getAuditPdf(id, type) {
    const res = await fetch(`${API_URL}/audit/${id}/pdf?type=${type}`, {
      headers: getAuthHeaders()
    })
    
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    
    if (!res.ok) {
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      throw new Error(data.message || 'Failed to generate PDF')
    }
    
    return res.blob()
  },

  async getCertificates() {
    const res = await fetch(`${API_URL}/certificates`, {
      headers: getAuthHeaders()
    })
    return handleResponse(res)
  },

  async downloadCertificate(filename) {
    const res = await fetch(`${API_URL}/certificates/${filename}`, {
      headers: getAuthHeaders()
    })
    
    if (!res.ok) {
      throw new Error('Failed to download certificate')
    }
    
    return res.blob()
  }
}
