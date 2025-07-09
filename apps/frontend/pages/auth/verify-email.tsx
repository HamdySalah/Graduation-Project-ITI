import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface VerificationResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
  };
}

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Email verified successfully!',
          user: data.user,
        });
      } else {
        setResult({
          success: false,
          message: data.message || 'Verification failed. The link may be invalid or expired.',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred during verification. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!result?.user?.email) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: result.user.email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        alert(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {result?.success ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{result.message}</p>
            {result.user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Account Details:</h3>
                <p className="text-sm text-gray-600"><strong>Name:</strong> {result.user.name}</p>
                <p className="text-sm text-gray-600"><strong>Email:</strong> {result.user.email}</p>
                <p className="text-sm text-gray-600"><strong>Role:</strong> {result.user.role}</p>
              </div>
            )}
            <div className="space-y-3">
              <Link href="/login" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 block">
                Sign In to Your Account
              </Link>
              <Link href="/" className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 block">
                Go to Homepage
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{result?.message}</p>
            <div className="space-y-3">
              {result?.user?.email && (
                <button
                  onClick={resendVerification}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Resend Verification Email
                </button>
              )}
              <Link href="/register" className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 block">
                Register Again
              </Link>
              <Link href="/" className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 transition duration-200 block">
                Go to Homepage
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
