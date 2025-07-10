import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout from '../components/Layout';

export default function AdminFullTest() {
  const { user, loading } = useAuth();
  const [pendingNurses, setPendingNurses] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

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

  const loadPendingNurses = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Loading pending nurses...');
      const nurses = await apiService.getPendingNurses();
      console.log('Pending nurses result:', nurses);
      setPendingNurses(Array.isArray(nurses) ? nurses : []);
    } catch (err: any) {
      setError(`Failed to load pending nurses: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      setError('');
      setLoadingData(true);
      
      console.log('Loading admin stats...');
      const stats = await apiService.getAdminStats();
      console.log('Admin stats result:', stats);
      setAdminStats(stats);
    } catch (err: any) {
      setError(`Failed to load admin stats: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const verifyNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setLoadingData(true);
      
      console.log('Verifying nurse:', nurseId);
      const result = await apiService.verifyNurse(nurseId);
      console.log('Verify nurse result:', result);
      
      setSuccessMessage(`Successfully verified nurse: ${nurseName}`);
      
      // Reload pending nurses
      await loadPendingNurses();
    } catch (err: any) {
      setError(`Failed to verify nurse: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const rejectNurse = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setLoadingData(true);
      
      console.log('Rejecting nurse:', nurseId);
      const result = await apiService.rejectNurse(nurseId);
      console.log('Reject nurse result:', result);
      
      setSuccessMessage(`Successfully rejected nurse: ${nurseName}`);
      
      // Reload pending nurses
      await loadPendingNurses();
    } catch (err: any) {
      setError(`Failed to reject nurse: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingNurses();
      loadAdminStats();
    }
  }, [user]);

  return (
    <Layout title="Admin Full Test Page">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Admin Full Test Page</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-600">{successMessage}</p>
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
                onClick={loadPendingNurses}
                disabled={loadingData}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Reload Pending Nurses'}
              </button>
              
              <button
                onClick={loadAdminStats}
                disabled={loadingData}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {loadingData ? 'Loading...' : 'Reload Admin Stats'}
              </button>
              
              <a
                href="/admin/nurses"
                className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded hover:bg-blue-700"
              >
                Go to Nurses Management
              </a>
              
              <a
                href="/dashboard"
                className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded hover:bg-gray-700"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        {adminStats && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{adminStats.totalUsers || 0}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{adminStats.verifiedNurses || 0}</div>
                <div className="text-sm text-gray-600">Verified Nurses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{adminStats.pendingNurses || 0}</div>
                <div className="text-sm text-gray-600">Pending Nurses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{adminStats.totalRequests || 0}</div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Nurses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Nurses ({pendingNurses.length})</h2>
          {pendingNurses.length === 0 ? (
            <p className="text-gray-600">No pending nurses to verify.</p>
          ) : (
            <div className="space-y-4">
              {pendingNurses.map((nurse) => (
                <div key={nurse.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{nurse.name}</h3>
                      <p className="text-gray-600">{nurse.email}</p>
                      <p className="text-gray-600">{nurse.phone}</p>
                      <p className="text-sm text-gray-500">License: {nurse.licenseNumber}</p>
                      <p className="text-sm text-gray-500">Experience: {nurse.yearsOfExperience} years</p>
                      <p className="text-sm text-gray-500">Specializations: {nurse.specializations?.join(', ')}</p>
                      <p className="text-sm text-gray-500">Rate: ${nurse.hourlyRate}/hour</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => verifyNurse(nurse.id, nurse.name)}
                        disabled={loadingData}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => rejectNurse(nurse.id, nurse.name)}
                        disabled={loadingData}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
