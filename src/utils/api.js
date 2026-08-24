import { refreshAccessToken, logout } from '../firebase/authService'

const BACKEND_URL = 'http://localhost:8080'

/**
 * Make an authenticated API call with automatic token refresh.
 * The access_token cookie is sent automatically by the browser.
 */
export async function apiCall(endpoint, options = {}) {
  const makeRequest = async () => {
    return fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }

  let response = await makeRequest()

  // If 401, try refreshing the token (refresh cookie is sent automatically)
  if (response.status === 401) {
    try {
      await refreshAccessToken()
      response = await makeRequest()
    } catch {
      // Refresh failed — session expired
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
