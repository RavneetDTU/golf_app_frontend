// Simple helpers for token and user profile storage in localStorage
// TODO(security): Storing JWT/Session tokens in localStorage is vulnerable to XSS token theft.
// In a production environment, session tokens should be managed via secure HttpOnly, SameSite cookies.

export const saveToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('golf_token', token)
  }
}

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('golf_token')
  }
  return null
}

export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('golf_token')
  }
}

export const saveUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('golf_user', JSON.stringify(user))
  }
}

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('golf_user')
    return user ? JSON.parse(user) : null
  }
  return null
}

export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('golf_user')
  }
}
