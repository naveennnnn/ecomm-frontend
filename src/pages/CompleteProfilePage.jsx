import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeProfile } from '../firebase/authService'

function CompleteProfilePage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await completeProfile({ phone, address })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-700">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-gray-500">
            We need a few more details to get you started
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-xl p-8 space-y-6 border border-amber-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-amber-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-colors"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-4 py-3 border border-amber-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-colors resize-none"
                placeholder="123 Main St, City, State, PIN"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-amber-400 hover:bg-amber-500 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfilePage
