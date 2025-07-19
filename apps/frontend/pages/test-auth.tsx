import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
// import { apiService } from '../lib/api';

export default function TestAuth() {
  const { user, loading } = useAuth();
  const [authTest, setAuthTest] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!loading) {
      testAuthentication();
    }
  }, [loading]);

  const testAuthentication = async () => {
    try {
      console.log('🧪 Testing authentication...');
      console.log('User:', user);
      console.log('User role:', user?.role);
      console.log('User status:', user?.status);

      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

      // Test a simple API call
      const response = await fetch('http://localhost:3001/api/admin/pending-nurses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        setAuthTest({ success: true, data });
      } else {
        const errorText = await response.text();
        console.log('API Error response:', errorText);
        setAuthTest({ success: false, error: errorText, status: response.status });
      }

    } catch (err: any) {
      console.error('Auth test error:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Authentication Test</h1>

      <h2>User Info:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h2>Auth Test Result:</h2>
      <pre>{JSON.stringify(authTest, null, 2)}</pre>

      {error && (
        <div style={{ color: 'red' }}>
          <h2>Error:</h2>
          <pre>{error}</pre>
        </div>
      )}

      <button onClick={testAuthentication}>
        Re-test Authentication
      </button>
    </div>
  );
}