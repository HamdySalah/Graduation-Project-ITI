import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { LoadingSpinner } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';

interface Request {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  budget: number;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    age?: number;
    condition?: string;
    image?: string;
  };
  nurse?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
}

interface Application {
  id: string;
  requestId: string;
  nurseId: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  request: Request;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/dashboard' },
  { id: 'requests', label: 'Requests', icon: '📋', href: '/requests', active: true },
  { id: 'patients', label: 'Patients', icon: '👥', href: '/patients' },
  { id: 'payments', label: 'Payments', icon: '💳', href: '/payments' },
  { id: 'profile', label: 'Profile', icon: '👤', href: '/profile' }
];

function RequestsList() {
  const { user } = useAuth();
  const [availableRequests, setAvailableRequests] = useState<Request[]>([]);
  const [activeApplications, setActiveApplications] = useState<Application[]>([]);
  const [pastApplications, setPastApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available requests (for nurses to apply to)
      const requestsData = await apiService.getRequests();
      const available = (requestsData as Request[]).filter(req =>
        req.status === 'pending' || req.status === 'open'
      );
      setAvailableRequests(available);

      // Mock data for applications (in real app, this would come from API)
      const mockActiveApplications: Application[] = [
        {
          id: '1',
          requestId: 'req1',
          nurseId: user.id,
          status: 'pending',
          appliedAt: '2024-07-15',
          request: {
            id: 'req1',
            title: 'Rehabilitation Care for Mr. Johnson',
            description: 'Seeking an experienced nurse to provide rehabilitation care for a patient after a stroke.',
            serviceType: 'Rehabilitation',
            status: 'pending',
            address: 'Toronto',
            scheduledDate: '2024-07-20',
            estimatedDuration: 8,
            urgencyLevel: 'medium',
            budget: 150,
            createdAt: '2024-07-15',
            patient: {
              id: 'p1',
              name: 'Mr. Johnson',
              phone: '+1234567890',
              age: 65,
              condition: 'Post-stroke rehabilitation',
              image: '/images/patient-male.jpg'
            }
          }
        }
      ];

      const mockPastApplications: Application[] = [
        {
          id: '2',
          requestId: 'req2',
          nurseId: user.id,
          status: 'accepted',
          appliedAt: '2024-05-10',
          request: {
            id: 'req2',
            title: 'Palliative Care for Mrs. White',
            description: 'Applied for a position providing palliative care for a patient with a chronic illness.',
            serviceType: 'Palliative Care',
            status: 'completed',
            address: 'Vancouver',
            scheduledDate: '2024-05-15',
            estimatedDuration: 12,
            urgencyLevel: 'high',
            budget: 200,
            createdAt: '2024-05-10',
            patient: {
              id: 'p2',
              name: 'Mrs. White',
              phone: '+1234567891',
              age: 78,
              condition: 'Chronic illness palliative care',
              image: '/images/patient-female.jpg'
            }
          }
        }
      ];

      setActiveApplications(mockActiveApplications);
      setPastApplications(mockPastApplications);

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToRequest = async (requestId: string) => {
    try {
      // In a real app, this would call an API to apply to the request
      console.log('Applying to request:', requestId);
      alert('Application submitted successfully!');
      loadData(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to apply to request');
    }
  };

  const getPatientImage = (patient?: Request['patient']) => {
    if (patient?.image) return patient.image;
    // Return placeholder based on patient info or random
    const placeholders = [
      '/images/patient-elderly-man.jpg',
      '/images/patient-woman.jpg',
      '/images/patient-baby.jpg',
      '/images/patient-man.jpg'
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please log in to view requests.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {user.name?.charAt(0) || 'N'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user.name || 'Nurse'}</h2>
              <p className="text-sm text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-8">
          <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Requests</h1>
              <p className="text-gray-600">Find patients that need your care</p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name, location or need"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex space-x-4">
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Specialty</option>
                  <option value="elderly">Elderly Care</option>
                  <option value="pediatric">Pediatric Care</option>
                  <option value="rehabilitation">Rehabilitation</option>
                  <option value="palliative">Palliative Care</option>
                </select>

                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Location</option>
                  <option value="toronto">Toronto</option>
                  <option value="vancouver">Vancouver</option>
                  <option value="montreal">Montreal</option>
                  <option value="calgary">Calgary</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Date</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Available Requests Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Requests</h2>
                  <div className="space-y-4">
                    {availableRequests.length > 0 ? (
                      availableRequests.map(request => (
                        <RequestCard
                          key={request.id}
                          request={request}
                          type="available"
                          onApply={handleApplyToRequest}
                          formatDate={formatDate}
                          getPatientImage={getPatientImage}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No available requests at the moment
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Applications Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Applications</h2>
                  <div className="space-y-4">
                    {activeApplications.length > 0 ? (
                      activeApplications.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          type="active"
                          formatDate={formatDate}
                          getPatientImage={getPatientImage}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No active applications
                      </div>
                    )}
                  </div>
                </div>

                {/* Past Applications Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Past Applications</h2>
                  <div className="space-y-4">
                    {pastApplications.length > 0 ? (
                      pastApplications.map(application => (
                        <ApplicationCard
                          key={application.id}
                          application={application}
                          type="past"
                          formatDate={formatDate}
                          getPatientImage={getPatientImage}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No past applications
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Card Component for Available Requests
function RequestCard({
  request,
  type,
  onApply,
  formatDate,
  getPatientImage
}: {
  request: Request;
  type: 'available';
  onApply: (id: string) => void;
  formatDate: (date: string) => string;
  getPatientImage: (patient?: Request['patient']) => string;
}) {

  return (
    <div className="bg-blue-600 rounded-lg p-6 text-white relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Application Deadline: {formatDate(request.scheduledDate)}</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">{request.title}</h3>
          <p className="text-blue-100 mb-4 line-clamp-2">{request.description}</p>
          <div className="text-sm text-blue-100">
            <p>Location: {request.address}</p>
          </div>
        </div>

        {/* Patient Image */}
        <div className="flex-shrink-0 ml-6">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/20">
            <img
              src={getPatientImage(request.patient)}
              alt={request.patient?.name || 'Patient'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgOC4zMyAxNSAxMiAxNUMxNS42NyAxNSAyMSAxNi4zMyAyMSAxOVoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Application Card Component for Active and Past Applications
function ApplicationCard({
  application,
  type,
  formatDate,
  getPatientImage
}: {
  application: Application;
  type: 'active' | 'past';
  formatDate: (date: string) => string;
  getPatientImage: (patient?: Request['patient']) => string;
}) {
  const request = application.request;

  return (
    <div className="bg-blue-600 rounded-lg p-6 text-white relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">
              Applied on {formatDate(application.appliedAt)}
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-2">{request.title}</h3>
          <p className="text-blue-100 mb-4 line-clamp-2">{request.description}</p>
          <div className="text-sm text-blue-100">
            <p>Location: {request.address}</p>
            {type === 'active' && (
              <p className="mt-1">Status: Pending review</p>
            )}
            {type === 'past' && (
              <p className="mt-1">Status: Completed</p>
            )}
          </div>
        </div>

        {/* Patient Image */}
        <div className="flex-shrink-0 ml-6">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-white/20">
            <img
              src={getPatientImage(request.patient)}
              alt={request.patient?.name || 'Patient'}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgOC4zMyAxNSAxMiAxNUMxNS42NyAxNSAyMSAxNi4zMyAyMSAxOVoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestsList;
