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
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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
              <div className="text-2xl text-gray-800 font-bold">logo</div>
            </div>
            <h2 className="text-3xl font-bold text-purple-700 text-center mb-6">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border-b border-purple-300 focus:border-purple-500 focus:outline-none text-lg text-gray-800 placeholder-gray-400"
                  required
                  placeholder="Enter your password"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-sm text-gray-600 text-center">Don’t have an account? <Link href="/register" className="text-purple-600 hover:text-purple-800">Register</Link></p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 px-4 rounded-full hover:bg-purple-800 text-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
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