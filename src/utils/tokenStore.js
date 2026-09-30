/**
 * Token storage for the header-based auth flow.
 *
 * - Access token: kept in memory only (not persisted). Smallest XSS exposure
 *   window; cleared on tab close/refresh, then re-derived from the refresh token.
 * - Refresh token: persisted in localStorage so sessions survive reloads and new
 *   tabs. Sent in the request body to /api/auth/refresh (no cookies involved,
 *   so it works cross-site and on mobile).
 */

const REFRESH_KEY = 'om_refresh_token'

let accessToken = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || null
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* ignore storage errors */
  }
}

/** Store both tokens after a login/refresh response. */
export function setTokens({ accessToken: access, refreshToken: refresh } = {}) {
  if (access !== undefined) setAccessToken(access)
  if (refresh !== undefined) setRefreshToken(refresh)
}

/** Clear all tokens (logout / session end). */
export function clearTokens() {
  accessToken = null
  setRefreshToken(null)
}
