import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1' })

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
  check:       (identifier)           => api.post('/auth/check',         { identifier }),
  sendOtp:     (identifier)           => api.post('/auth/send-otp',      { identifier }),
  verifyOtp:   (identifier, otp, name) => api.post('/auth/verify-otp',    { identifier, otp, ...(name && { name }) }),
  login:       (identifier, password) => api.post('/auth/login',         { identifier, password }),
  setPassword: (password)             => api.post('/auth/set-password',  { password }),
  googleLogin: (accessToken)          => api.post('/auth/google',        { accessToken }),
  refresh:     (token)                => api.post('/auth/refresh',       { refreshToken: token }),
}

export const donors = {
  search:          (params)       => api.get('/donors/search', { params }),
  getById:         (id, params)   => api.get(`/donors/${id}`, { params }),
  register:        (data)         => api.post('/donors/register', data),
  setAvailability: (is_available) => api.patch('/donors/availability', { is_available }),
}

export const hospitals = {
  list:    (params) => api.get('/hospitals', { params }),
  getById: (id)     => api.get(`/hospitals/${id}`),
}

export const bloodBanks = {
  list:    (params) => api.get('/blood-banks', { params }),
  nearby:  (params) => api.get('/blood-banks/nearby', { params }),
  getById: (id)     => api.get(`/blood-banks/${id}`),
}

export const requests = {
  list:    (params) => api.get('/blood-requests',               { params }),
  mine:    (params) => api.get('/blood-requests/mine',          { params }),
  create:  (data)   => api.post('/blood-requests',              data),
  nearby:  (params) => api.get('/blood-requests/nearby',        { params }),
  cancel:  (id)     => api.patch(`/blood-requests/${id}/cancel`),
  fulfill: (id)     => api.post(`/blood-requests/${id}/fulfill`),
}

export const donations = {
  log:  (data) => api.post('/donations', data),
  mine: ()     => api.get('/donations/my'),
}

export const notifications = {
  list:    () => api.get('/notifications'),
  markRead:(id) => api.put(`/notifications/${id}/read`),
  markAll: () => api.put('/notifications/read-all'),
}

export const rewards = {
  mine: () => api.get('/rewards/my'),
}

export const users = {
  me:             ()     => api.get('/users/me'),
  update:         (data) => api.put('/users/me', data),
  stats:          ()     => api.get('/users/me/stats'),
  dashboardStats: ()     => api.get('/users/dashboard/stats'),
}

export default api
