import { useNavigate } from 'react-router-dom'

function VerificationPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffdf7] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="bg-white shadow-lg rounded-xl p-8 space-y-6 border border-amber-100">
          {/* Email Icon */}
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-700">Check your email</h1>

          <p className="text-gray-600">
            A verification email has been sent to your email address. Please check your inbox and click the verification link to activate your account.
          </p>

          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-amber-400 hover:bg-amber-500 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-300 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationPage
