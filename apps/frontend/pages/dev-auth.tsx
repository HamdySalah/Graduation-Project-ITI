import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

export default function DevAuth() {
  const { user, loading } = useAuth();
  const [bypassAuth, setBypassAuth] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const bypass = localStorage.getItem('bypass_auth') === 'true';
    setBypassAuth(bypass);
  }, []);

  const toggleBypassAuth = () => {
    const newBypass = !bypassAuth;
    setBypassAuth(newBypass);
    localStorage.setItem('bypass_auth', newBypass.toString());
    
    if (newBypass) {
      setSuccess('Authentication bypass enabled. Refresh the page to see changes.');
    } else {
      setSuccess('Authentication bypass disabled. Refresh the page to see changes.');
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const testAdminLogin = async () => {
    try {
      setError('');
      setSuccess('');
      
      console.log('Testing admin login...');
      const result = await apiService.login({
        email: 'admin@test.com',
        password: 'AdminPassword123'
      });
      console.log('Admin login result:', result);
      setSuccess('Admin login successful! Refreshing page...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    }
  };

  const testPatientLogin = async () => {
    try {
      setError('');
      setSuccess('');
      
      console.log('Testing patient login...');
      const result = await apiService.login({
        email: 'patient.dashboard@test.com',
        password: 'TestPassword123'
      });
      console.log('Patient login result:', result);
      setSuccess('Patient login successful! Refreshing page...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('bypass_auth');
    setSuccess('Authentication cleared. Refreshing page...');
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Layout title="Development Authentication Helper">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Development Authentication Helper</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not authenticated'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Bypass Enabled:</strong> {bypassAuth ? 'Yes' : 'No'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </div>

          {/* Development Controls */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Development Controls</h2>
            <div className="space-y-3">
              <button
                onClick={toggleBypassAuth}
                className={`w-full px-4 py-2 rounded text-white ${
                  bypassAuth 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {bypassAuth ? 'Disable Auth Bypass' : 'Enable Auth Bypass'}
              </button>
              
              <button
                onClick={clearAuth}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Clear All Authentication
              </button>
            </div>
          </div>

          {/* Quick Login */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Login</h2>
            <div className="space-y-3">
              <button
                onClick={testAdminLogin}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Login as Admin
              </button>
              
              <button
                onClick={testPatientLogin}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Login as Patient
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
            <div className="space-y-3">
              <a
                href="/dashboard"
                className="block w-full bg-indigo-600 text-white text-center px-4 py-2 rounded hover:bg-indigo-700"
              >
                Go to Dashboard
              </a>
              
              <a
                href="/admin/nurses"
                className="block w-full bg-green-600 text-white text-center px-4 py-2 rounded hover:bg-green-700"
              >
                Manage Nurses (Admin)
              </a>
              
              <a
                href="/admin/analytics"
                className="block w-full bg-purple-600 text-white text-center px-4 py-2 rounded hover:bg-purple-700"
              >
                Analytics (Admin)
              </a>
              
              <a
                href="/debug-auth"
                className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded hover:bg-gray-700"
              >
                Debug Authentication
              </a>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Use:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• <strong>Enable Auth Bypass:</strong> Skip authentication entirely (development mode)</li>
            <li>• <strong>Quick Login:</strong> Login with test credentials</li>
            <li>• <strong>Clear Auth:</strong> Remove all authentication data</li>
            <li>• <strong>Dashboard:</strong> Access the main dashboard</li>
            <li>• <strong>Admin Features:</strong> Manage nurses and view analytics</li>
          </ul>
        </div>

        {/* Backend Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
            <div>
              <p><strong>Auth Endpoint:</strong> /api/auth/profile</p>
              <p><strong>Admin Endpoints:</strong> /api/admin/*</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
