import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, googleProvider } from './config'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../utils/tokenStore'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

/**
 * Sign up with email and password
 * - Creates Firebase account
 * - Sends verification email
 * - Sends user details to backend to store in DB
 */
export async function signUpWithEmail(email, password, userDetails) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  await sendEmailVerification(userCredential.user)

  const idToken = await userCredential.user.getIdToken()
  const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      name: userDetails.name,
      phone: userDetails.phone,
      address: userDetails.address,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Failed to register user')
  }

  return { user: userCredential.user }
}

/**
 * Sign in with email and password.
 * Backend returns { accessToken, refreshToken, profileComplete } which we store
 * (access token in memory, refresh token in localStorage).
 */
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)

  if (!userCredential.user.emailVerified) {
    throw new Error('Please verify your email before signing in. Check your inbox for the verification link.')
  }

  const idToken = await userCredential.user.getIdToken()
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Login failed')
  }

  const data = await response.json()
  setTokens(data)
  return { user: userCredential.user, ...data }
}

/**
 * Sign in/up with Google OAuth.
 * Existing users get tokens; new users get profileComplete=false (no tokens yet).
 */
export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider)
  const idToken = await userCredential.user.getIdToken()

  const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Google login failed')
  }

  const data = await response.json()
  if (data.accessToken) setTokens(data)
  return { user: userCredential.user, ...data }
}

/**
 * Complete profile for Google sign-up users. Returns tokens on success.
 */
export async function completeProfile(profileDetails) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const idToken = await user.getIdToken()
  const response = await fetch(`${BACKEND_URL}/api/auth/complete-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      phone: profileDetails.phone,
      address: profileDetails.address,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Failed to complete profile')
  }

  const data = await response.json()
  setTokens(data)
  return data
}

/**
 * Exchange the stored refresh token for a fresh access token.
 * Refresh tokens are rotated: the response contains a NEW refresh token which
 * replaces the old one. Sends the token in the request body (no cookies).
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('Session expired. Please login again.')
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    // Refresh failed (expired, reuse detected, or revoked) — clear local state.
    clearTokens()
    throw new Error('Session expired. Please login again.')
  }

  const data = await response.json()
  setTokens(data)
  return data
}

/**
 * Get the current authenticated user's profile (including role).
 *
 * Sends the in-memory access token as a Bearer header. If it is missing/expired
 * (401), attempt a silent refresh using the stored refresh token, then retry once.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const fetchMe = () => {
    const token = getAccessToken()
    return fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }

  let response = await fetchMe()

  if (response.status === 401) {
    try {
      await refreshAccessToken()
      response = await fetchMe()
    } catch {
      return null
    }
  }

  if (!response.ok) {
    return null
  }

  return response.json()
}

/**
 * Logout — tells the backend to revoke the refresh token chain, then clears
 * local tokens.
 */
export async function logout() {
  const refreshToken = getRefreshToken()
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    // Best effort — even if this fails, user navigates away.
  } finally {
    clearTokens()
  }
}
