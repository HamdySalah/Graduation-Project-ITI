import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

export default function PatientTest() {
  const { user, loading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [requests, setRequests] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);

  const testPatientLogin = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing patient login...');
      const result = await apiService.login({
        email: 'patient.dashboard@test.com',
        password: 'TestPassword123'
      });
      console.log('Patient login result:', result);
      
      // Reload the page to update auth context
      window.location.reload();
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const testDashboardStats = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing dashboard stats...');
      const stats = await apiService.getDashboardStats();
      console.log('Dashboard stats result:', stats);
      setDashboardStats(stats);
    } catch (err: any) {
      setError(`Dashboard stats failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const testRequests = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Testing requests...');
      const requestsData = await apiService.getRequests();
      console.log('Requests result:', requestsData);
      setRequests(requestsData);
    } catch (err: any) {
      setError(`Requests failed: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <Layout title="Patient Test Page">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Patient Test Page</h1>
        
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
                onClick={testPatientLogin}
                disabled={loadingData}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingData ? 'Logging in...' : 'Login as Patient'}
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={testDashboardStats}
                disabled={loadingData}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Test Dashboard Stats'}
              </button>
              
              <button
                onClick={testRequests}
                disabled={loadingData}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Test Requests'}
              </button>
              
              <a
                href="/dashboard"
                className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Results */}
        {dashboardStats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Dashboard Stats Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(dashboardStats, null, 2)}
            </pre>
          </div>
        )}

        {/* Requests Results */}
        {requests && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Requests Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(requests, null, 2)}
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
              <p><strong>Dashboard Stats Endpoint:</strong> /api/requests/dashboard/stats</p>
              <p><strong>Requests Endpoint:</strong> /api/requests</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
