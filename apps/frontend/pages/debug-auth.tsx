import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

export default function DebugAuth() {
  const { user, loading } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [profileTest, setProfileTest] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token (just the payload, not verifying signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo(payload);
      } catch (e) {
        setError('Invalid token format');
      }
    }
  }, []);

  const testProfile = async () => {
    try {
      setError('');
      const profile = await apiService.getProfile();
      setProfileTest(profile);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const testLogin = async () => {
    try {
      setError('');
      const result = await apiService.login({
        email: 'patient.dashboard@test.com',
        password: 'TestPassword123'
      });
      console.log('Login result:', result);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Layout title="Authentication Debug">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Authentication Debug</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Context Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Auth Context</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</p>
              {user && (
                <div className="mt-4">
                  <h3 className="font-medium">User Info:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Token Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Token Info</h2>
            <div className="space-y-2">
              <p><strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
              {tokenInfo && (
                <div className="mt-4">
                  <h3 className="font-medium">Token Payload:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(tokenInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* API Tests */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">API Tests</h2>
            <div className="space-y-4">
              <button
                onClick={testProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test Profile API
              </button>
              <button
                onClick={testLogin}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
              >
                Test Login API
              </button>
              {profileTest && (
                <div className="mt-4">
                  <h3 className="font-medium">Profile Response:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(profileTest, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Backend Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Backend Status</h2>
            <div className="space-y-2">
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
