import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({});
  const { login, isLoading, error, clearError } = useAuth();

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      clearError();
      await login(email, password);
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
                  className={`mt-1 block w-full border-b ${formErrors.email ? 'border-red-500' : 'border-purple-300'} focus:border-purple-500 focus:outline-none text-lg text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your email"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`mt-1 block w-full border-b ${formErrors.password ? 'border-red-500' : 'border-purple-300'} focus:border-purple-500 focus:outline-none text-lg text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your password"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <p className="text-sm text-gray-600 text-center">Don’t have an account? <Link href="/register" className="text-purple-600 hover:text-purple-800">Register</Link></p>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-2 px-4 rounded-full text-lg font-semibold ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-purple-800'
                }`}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
              <div className="flex justify-center space-x-4 mt-4">
                <button type="button" className="text-blue-600 text-xl hover:text-blue-800">f</button>
                <button type="button" className="text-black text-xl hover:text-gray-800">G</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}