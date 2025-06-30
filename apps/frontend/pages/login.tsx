import Link from 'next/link';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      localStorage.setItem('token', data.access_token); 
      window.location.href = '/'; 
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-blue-200 flex items-center justify-center">
        <img src="/imagenurse3.jpeg" alt="Login Background" className="max-w-full max-h-full" />
      </div>
      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Login</h2>
            <div className="text-2xl">logo</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-sm text-gray-600">Are you don’t have account? <Link href="/register" className="text-blue-500">Register</Link></p>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Login
            </button>
            <div className="flex justify-center space-x-4">
              <button className="text-blue-600">f</button>
              <button className="text-black">G</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}