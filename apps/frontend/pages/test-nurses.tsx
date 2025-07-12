import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import apiService from '../lib/api';
import Layout, { StatusBadge } from '../components/Layout';

export default function TestNurses() {
  const { user, loading } = useAuth();
  const [pendingNurses, setPendingNurses] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);
  const [success, setSuccess] = useState<string>('');

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

  const testStatusBadge = () => {
    const testStatuses = ['pending', 'verified', 'suspended', undefined, null, ''];
    return testStatuses.map((status, index) => (
      <div key={index} className="flex items-center space-x-2 mb-2">
        <span className="w-20 text-sm">'{status}':</span>
        <StatusBadge status={status as any} />
      </div>
    ));
  };

  useEffect(() => {
    loadPendingNurses();
  }, []);

  return (
    <Layout title="Test Nurses Management">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test Nurses Management</h1>
        
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
          {/* Status Badge Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status Badge Test</h2>
            <div className="space-y-2">
              {testStatusBadge()}
            </div>
          </div>

          {/* Auth Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not authenticated'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            </div>
            
            <button
              onClick={loadPendingNurses}
              disabled={loadingData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingData ? 'Loading...' : 'Reload Pending Nurses'}
            </button>
          </div>
        </div>

        {/* Pending Nurses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Nurses ({pendingNurses.length})</h2>
          {loadingData ? (
            <p className="text-gray-600">Loading...</p>
          ) : pendingNurses.length === 0 ? (
            <p className="text-gray-600">No pending nurses found.</p>
          ) : (
            <div className="space-y-4">
              {pendingNurses.map((nurse, index) => (
                <div key={nurse.id || index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{nurse.name || 'Unknown Name'}</h3>
                        <StatusBadge status={nurse.status} />
                      </div>
                      <p className="text-gray-600">{nurse.email || 'No email'}</p>
                      <p className="text-gray-600">{nurse.phone || 'No phone'}</p>
                      <p className="text-sm text-gray-500">License: {nurse.licenseNumber || 'Not provided'}</p>
                      <p className="text-sm text-gray-500">Experience: {nurse.yearsOfExperience || 0} years</p>
                      <p className="text-sm text-gray-500">
                        Specializations: {
                          nurse.specializations && nurse.specializations.length > 0 
                            ? nurse.specializations.join(', ') 
                            : 'None listed'
                        }
                      </p>
                      <p className="text-sm text-gray-500">Rate: ${nurse.hourlyRate || 'Not set'}/hour</p>
                      <p className="text-sm text-gray-500">
                        Location: {
                          nurse.location && nurse.location.coordinates && nurse.location.coordinates.length >= 2
                            ? `${nurse.location.coordinates[1]}, ${nurse.location.coordinates[0]}`
                            : 'Not available'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Navigation</h2>
          <div className="space-y-3">
            <a
              href="/admin/nurses"
              className="block w-full bg-blue-600 text-white text-center px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Admin Nurses Page
            </a>
            
            <a
              href="/dev-auth"
              className="block w-full bg-green-600 text-white text-center px-4 py-2 rounded hover:bg-green-700"
            >
              Development Auth Helper
            </a>
            
            <a
              href="/dashboard"
              className="block w-full bg-gray-600 text-white text-center px-4 py-2 rounded hover:bg-gray-700"
            >
              Go to Dashboard
            </a>
          </div>
        </div>

        {/* Raw Data Display */}
        {pendingNurses.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Raw Data (for debugging)</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(pendingNurses, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
}
