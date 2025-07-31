import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // توجيه جميع المستخدمين إلى الصفحة الرئيسية
      window.location.href = '/';
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // التوجيه يتم الآن في دالة login نفسها
    } catch (err: any) {
      // Don't log error to console
      // Just set the error message directly from the error object
      let errorMessage = 'Email or password are wrong.';
      
      if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-400 via-white-500 to-white-500">
      <div className="w-full flex items-center justify-center">
        <div className="container mx-auto p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col md:flex-row items-center relative" id="__next">
          <div className="w-full md:w-1/2 p-4">
            <img src="/imagenurse3.jpeg" alt="Register Background" className="w-full h-auto rounded-lg transform hover:scale-105 transition duration-300" />
          </div>
          <div className="w-full md:w-1/2 p-8">
            <div className="flex justify-between items-start mb-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-br from-blue-400 via-purple-400 to-blue-600 rounded-full p-3 shadow-2xl animate-pulse">
                  <img src="/logo.png" alt="Nurse Platform Logo" className="h-20 w-20 object-contain drop-shadow-2xl animate-bounce" />
                </div>
                <span className="ml-4 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 tracking-wide">عناية</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-purple-700 text-center mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear error when user starts typing
                    if (error) setError('');
                  }}
                  className="mt-1 block w-full border-b border-purple-300 focus:border-purple-500 focus:outline-none text-lg text-gray-800 placeholder-gray-400"
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear error when user starts typing
                    if (error) setError('');
                  }}
                  className="mt-1 block w-full border-b border-purple-300 focus:border-purple-500 focus:outline-none text-lg text-gray-800 placeholder-gray-400"
                  required
                  placeholder="Enter your password"
                />
              </div>
              {/* Error Message Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}
              <p className="text-sm text-gray-600 text-center">Don’t have an account? <Link href="/register" className="text-purple-600 hover:text-purple-800">Register</Link></p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 px-4 rounded-full hover:bg-purple-800 text-lg font-semibold disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>

              <div className="text-center space-y-2 mt-4">
                <p className="text-sm text-gray-600">Don't have an account? <Link href="/register" className="text-purple-600 hover:text-purple-800 font-medium">Register</Link></p>
                <p className="text-sm text-gray-600">Forgot your password? <Link href="/forgot-password" className="text-purple-600 hover:text-purple-800 font-medium">Reset Password</Link></p>
              </div>

              <div className="flex justify-center space-x-4 mt-4">
                <button className="text-blue-600 text-xl hover:text-blue-800">f</button>
                <button className="text-black text-xl hover:text-gray-800">G</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}