import { refreshAccessToken, logout } from '../firebase/authService'
import { getAccessToken } from './tokenStore'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

/**
 * Make an authenticated API call with automatic token refresh.
 * Attaches the in-memory access token as a Bearer header. On 401 it tries to
 * refresh (rotating refresh token) once, then retries.
 *
 * Note: does not set Content-Type when the body is FormData, so the browser can
 * set the multipart boundary itself.
 */
export async function apiCall(endpoint, options = {}) {
  const makeRequest = () => {
    const token = getAccessToken()
    const isFormData = options.body instanceof FormData
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }
    return fetch(`${BACKEND_URL}${endpoint}`, { ...options, headers })
  }

  let response = await makeRequest()

  if (response.status === 401) {
    try {
      await refreshAccessToken()
      response = await makeRequest()
    } catch {
      await logout()
      window.location.href = '/'
      throw new Error('Session expired. Please login again.')
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }

  return response.json()
}
