import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, googleProvider } from './config'

const BACKEND_URL = 'http://localhost:8080'

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
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
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
 * Sign in with email and password
 * - Checks email verified
 * - Sends Firebase token to backend
 * - Backend sets HttpOnly cookies with access + refresh tokens
 */
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)

  if (!userCredential.user.emailVerified) {
    throw new Error('Please verify your email before signing in. Check your inbox for the verification link.')
  }

  const idToken = await userCredential.user.getIdToken()
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Login failed')
  }

  const data = await response.json()
  return { user: userCredential.user, ...data }
}

/**
 * Sign in/up with Google OAuth
 * - No email verification needed
 * - Backend checks if user exists: sets cookies if yes, or profileComplete=false if new
 */
export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider)
  const idToken = await userCredential.user.getIdToken()

  const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Google login failed')
  }

  const data = await response.json()
  return { user: userCredential.user, ...data }
}

/**
 * Complete profile for Google sign-up users
 */
export async function completeProfile(profileDetails) {
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')

  const idToken = await user.getIdToken()
  const response = await fetch(`${BACKEND_URL}/api/auth/complete-profile`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
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

  return response.json()
}

/**
 * Refresh the access token using the HttpOnly refresh cookie
 * The browser sends the cookie automatically with credentials: 'include'
 */
export async function refreshAccessToken() {
  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Session expired. Please login again.')
  }

  return response.json()
}

/**
 * Logout — tells backend to clear cookies and invalidate refresh token
 */
export async function logout() {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Best effort — even if this fails, user navigates away
  }
}
