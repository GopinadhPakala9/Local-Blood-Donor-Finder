// Small helpers for reading the logged-in user + role from localStorage.
// NOTE: role gating here is UX only — the real enforcement is the backend
// AdminGuard. Never trust these checks for security.

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
}

export const isAdmin = () => getUser().role === 'admin'
