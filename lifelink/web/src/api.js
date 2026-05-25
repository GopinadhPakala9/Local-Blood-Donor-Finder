import axios from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  async err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const auth = {
  sendOtp:     (identifier)           => api.post('/auth/send-otp',      { identifier }),
  verifyOtp:   (identifier, otp)      => api.post('/auth/verify-otp',    { identifier, otp }),
  login:       (identifier, password) => api.post('/auth/login',         { identifier, password }),
  setPassword: (password)             => api.post('/auth/set-password',  { password }),
  googleLogin: (idToken)              => api.post('/auth/google',        { idToken }),
  refresh:     (token)                => api.post('/auth/refresh',       { refreshToken: token }),
}

export const donors = {
  search: (params) => api.get('/donors/search', { params }),
  getById: (id, params) => api.get(`/donors/${id}`, { params }),
  register: (data) => api.post('/donors/register', data),
}

export const requests = {
  list:    (params) => api.get('/blood-requests',         { params }),
  create:  (data)   => api.post('/blood-requests',        data),
  nearby:  (params) => api.get('/blood-requests/nearby',  { params }),
  cancel:  (id)     => api.patch(`/blood-requests/${id}/cancel`),
}

export const notifications = {
  list:    () => api.get('/notifications'),
  markRead:(id) => api.put(`/notifications/${id}/read`),
  markAll: () => api.put('/notifications/read-all'),
}

export const rewards = {
  mine: () => api.get('/rewards/my'),
}

export default api
