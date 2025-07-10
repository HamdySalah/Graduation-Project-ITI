import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner, StatusBadge } from '../../components/Layout';
import { apiService } from '../../lib/api';

interface Nurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  createdAt: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: string[];
  education: string;
  rating?: number;
  totalReviews?: number;
  completedJobs?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  documents?: string[];
}

export default function AdminNurses() {
  const { user } = useAuth();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadNurses();
    }
  }, [user]);

  const loadNurses = async () => {
    try {
      setLoading(true);
      // For now, we'll load pending nurses. In a real app, you'd have an endpoint for all nurses
      const pendingNurses = await apiService.getPendingNurses();
      setNurses(pendingNurses as Nurse[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load nurses');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNurse = async (nurseId: string) => {
    try {
      await apiService.verifyNurse(nurseId);
      await loadNurses(); // Reload data
    } catch (err: any) {
      setError(err.message || 'Failed to verify nurse');
    }
  };

  const handleDeclineNurse = async (nurseId: string) => {
    try {
      await apiService.rejectNurse(nurseId);
      await loadNurses();
    } catch (err: any) {
      setError(err.message || 'Failed to decline nurse');
    }
  };

  const getFilteredNurses = () => {
    if (!Array.isArray(nurses)) return [];
    if (filter === 'all') return nurses;
    return nurses.filter(nurse => nurse.status === filter);
  };

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Nurses">
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Nurses' },
              { value: 'pending', label: 'Pending Verification' },
              { value: 'verified', label: 'Verified' },
              { value: 'suspended', label: 'Suspended' },
            ].map(filterOption => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === filterOption.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Nurses List */}
        {loading ? (
          <LoadingSpinner />
        ) : getFilteredNurses().length > 0 ? (
          <div className="space-y-4">
            {getFilteredNurses().map(nurse => (
              <NurseCard
                key={nurse.id}
                nurse={nurse}
                onVerify={handleVerifyNurse}
                onDecline={handleDeclineNurse}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {filter === 'all' ? 'No nurses found' : `No ${filter} nurses found`}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Nurse Card Component
function NurseCard({ 
  nurse, 
  onVerify, 
  onDecline 
}: { 
  nurse: Nurse; 
  onVerify: (id: string) => void; 
  onDecline: (id: string) => void; 
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{nurse.name}</h3>
            <StatusBadge status={nurse.status} />
            {nurse.isAvailable !== undefined && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                nurse.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {nurse.isAvailable ? 'Available' : 'Busy'}
              </span>
            )}
          </div>
          <p className="text-gray-600">{nurse.email}</p>
          <p className="text-gray-600">{nurse.phone}</p>
          <p className="text-sm text-gray-500">{nurse.address}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            Registered: {new Date(nurse.createdAt).toLocaleDateString()}
          </p>
          {nurse.rating && (
            <p className="text-sm">
              ⭐ {nurse.rating.toFixed(1)} ({nurse.totalReviews} reviews)
            </p>
          )}
          {nurse.hourlyRate && (
            <p className="text-sm font-medium text-green-600">
              {nurse.hourlyRate} EGP/hour
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <span className="font-medium text-gray-500">License:</span>
          <p className="text-gray-900">{nurse.licenseNumber}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Experience:</span>
          <p className="text-gray-900">{nurse.yearsOfExperience} years</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Education:</span>
          <p className="text-gray-900">{nurse.education}</p>
        </div>
      </div>

      <div className="mb-4">
        <span className="font-medium text-gray-500">Specializations:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {nurse.specializations.map(spec => (
            <span
              key={spec}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {spec.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-500">Location Coordinates:</span>
              <p className="text-gray-900">
                {nurse.location.coordinates[1]}, {nurse.location.coordinates[0]}
              </p>
            </div>
            {nurse.completedJobs !== undefined && (
              <div>
                <span className="font-medium text-gray-500">Completed Jobs:</span>
                <p className="text-gray-900">{nurse.completedJobs}</p>
              </div>
            )}
          </div>
          
          {nurse.documents && nurse.documents.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-gray-500">Documents:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {nurse.documents.map((doc, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
        <div className="flex space-x-2">
          {nurse.status === 'pending' && (
            <>
              <button
                onClick={() => onVerify(nurse.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Verify Nurse
              </button>
              <button
                onClick={() => onDecline(nurse.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Decline
              </button>
            </>
          )}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
            View Details
          </button>
          {nurse.status === 'verified' && (
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
              Suspend
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
