import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

export default function AdminTest() {
  const { user, loading } = useAuth();
  const [adminStats, setAdminStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);

  const testAdminLogin = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing admin login...');
      const result = await apiService.login({
        email: 'admin@test.com',
        password: 'AdminPassword123'
      });
      console.log('Admin login result:', result);
      
      // Reload the page to update auth context
      window.location.reload();
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const testAdminStats = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing admin stats...');
      const stats = await apiService.getAdminStats();
      console.log('Admin stats result:', stats);
      setAdminStats(stats);
    } catch (err: any) {
      setError(`Stats failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const testAnalytics = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing analytics...');
      const analyticsData = await apiService.getAnalytics();
      console.log('Analytics result:', analyticsData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(`Analytics failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <Layout title="Admin Test Page">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Admin Test Page</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not authenticated'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            </div>
            
            {!user && (
              <button
                onClick={testAdminLogin}
                disabled={loadingData}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingData ? 'Logging in...' : 'Login as Admin'}
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={testAdminStats}
                disabled={loadingData}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Test Admin Stats'}
              </button>
              
              <button
                onClick={testAnalytics}
                disabled={loadingData}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Test Analytics'}
              </button>
              
              <a
                href="/dashboard"
                className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Dashboard
              </a>
              
              <a
                href="/admin/analytics"
                className="block w-full bg-indigo-600 text-white text-center px-4 py-2 rounded hover:bg-indigo-700"
              >
                Go to Analytics
              </a>
            </div>
          </div>
        </div>

        {/* Admin Stats Results */}
        {adminStats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Stats Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(adminStats, null, 2)}
            </pre>
          </div>
        )}

        {/* Analytics Results */}
        {analytics && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibent mb-4">Analytics Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(analytics, null, 2)}
            </pre>
          </div>
        )}

        {/* Backend Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
            <div>
              <p><strong>Admin Stats Endpoint:</strong> /api/admin/stats</p>
              <p><strong>Analytics Endpoint:</strong> /api/admin/analytics</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
