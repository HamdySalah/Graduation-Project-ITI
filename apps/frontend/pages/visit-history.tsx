import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import Layout, { LoadingSpinner } from '../components/Layout';
import { apiService } from '../lib/api';
import Link from 'next/link';

interface CompletedVisit {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  budget: number;
  completedAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  nurse?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

function VisitHistory() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<CompletedVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadCompletedVisits();
    }
  }, [user]);

  const loadCompletedVisits = async () => {
    try {
      setLoading(true);
      // Get completed requests only
      const data = await apiService.getRequests('completed');
      setVisits(data as CompletedVisit[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVisits = () => {
    if (!searchTerm) return visits;
    
    return visits.filter(visit => 
      visit.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (hours: number) => {
    if (hours === 1) return '1 hour';
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    return `${hours} hours`;
  };

  const getServiceDisplayName = (serviceType: string) => {
    return serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if user is logged in
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Please log in to view visit history.</p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
          </div>
        </div>
      </Layout>
    );
  }

  // Only nurses should access this page
  if (user.role !== 'nurse') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Only nurses can view visit history.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Visit History">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">Visit History</h1>
              <p className="text-gray-600 mt-2">Review your past visits and earnings.</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by patient name or visit details"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Completed Visits Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-blue-600">Completed Visits</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : getFilteredVisits().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredVisits().map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {visit.patient?.name || 'Unknown Patient'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getServiceDisplayName(visit.serviceType)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(visit.completedAt || visit.scheduledDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDuration(visit.estimatedDuration)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/requests/${visit.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No visits match your search criteria' : 'No completed visits found'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Complete some visits to see them here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default VisitHistory;
