import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';
import CommonLayout from '../components/CommonLayout';

export default function TestOffers() {
  const { user } = useAuth();
  const [applicationId, setApplicationId] = useState('');
  const [price, setPrice] = useState(100);
  const [estimatedTime, setEstimatedTime] = useState(2);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCancelApplication = async () => {
    if (!applicationId) {
      setResult('❌ Please enter an application ID');
      return;
    }

    setLoading(true);
    setResult('🔄 Testing cancel application...');
    
    try {
      const response = await apiService.cancelApplication(applicationId);
      setResult(`✅ Cancel successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Cancel failed: ${error.message}`);
      console.error('Cancel test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testUpdateApplication = async () => {
    if (!applicationId) {
      setResult('❌ Please enter an application ID');
      return;
    }

    setLoading(true);
    setResult('🔄 Testing update application...');
    
    try {
      const response = await apiService.updateApplication(applicationId, { price, estimatedTime });
      setResult(`✅ Update successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Update failed: ${error.message}`);
      console.error('Update test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGetApplications = async () => {
    setLoading(true);
    setResult('🔄 Testing get applications...');
    
    try {
      const response = await apiService.getApplicationsByNurse();
      setResult(`✅ Get applications successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Get applications failed: ${error.message}`);
      console.error('Get applications test error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'nurse') {
    return (
      <CommonLayout activeItem="test" allowedRoles={['nurse']}>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">This test page is only available for nurses.</p>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout activeItem="test" allowedRoles={['nurse']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Offers API</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application ID
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="Enter application ID to test"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Time (hours)
              </label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                min="0.5"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={testGetApplications}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Get My Applications
            </button>
            
            <button
              onClick={testUpdateApplication}
              disabled={loading || !applicationId}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Test Update
            </button>
            
            <button
              onClick={testCancelApplication}
              disabled={loading || !applicationId}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Test Cancel
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-4 rounded border max-h-96 overflow-y-auto">
            {result || 'No tests run yet. Click a button above to test the API.'}
          </pre>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>First click "Get My Applications" to see your current applications</li>
            <li>Copy an application ID from the results</li>
            <li>Paste it in the "Application ID" field above</li>
            <li>Test "Update" or "Cancel" with that ID</li>
          </ol>
        </div>
      </div>
    </CommonLayout>
  );
}
