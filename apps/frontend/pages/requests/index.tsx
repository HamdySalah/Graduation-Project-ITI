import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../lib/auth';
import { LoadingSpinner } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  images?: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
    uploadedAt: string;
  }>;
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
  price: number;
  estimatedTime: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  request?: Request;
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
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      console.log('No user available yet, waiting for auth to complete');
      setLoading(true);
    }
  }, [user]);

  const loadData = async (showLoadingUI = true) => {
    try {
      if (showLoadingUI) {
        setLoading(true);
      }
      setError('');
      
      console.log('Loading requests data for user role:', user?.role);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (user?.role === 'patient') {
        try {
          // Load patient's own requests
          console.log('Fetching patient requests...');
          const requestsData = await apiService.getRequests();
          console.log('Received patient requests:', requestsData);
          setMyRequests(Array.isArray(requestsData) ? requestsData : []);
        } catch (requestErr) {
          console.error('Failed to load patient requests:', requestErr);
          setError('Could not load your requests. Please try again.');
        }
      } else if (user?.role === 'nurse') {
        try {
          // Load available requests (for nurses to apply to)
          console.log('Fetching nurse requests...');
          const requestsData = await apiService.getRequests();
          console.log('Received nurse requests:', requestsData);
          const available = Array.isArray(requestsData)
            ? requestsData.filter(req => req.status === 'pending' || req.status === 'open')
            : [];
          setAvailableRequests(available);

          // Load nurse's applications, but preserve any locally stored ones
          try {
            // Get applications from API
            const applicationsData = await apiService.getApplicationsByNurse();
            console.log('Received nurse applications from API:', applicationsData);
            
            // Get any locally stored applications (includes those just submitted)
            let localApps = [];
            try {
              const storedApps = localStorage.getItem('nurse_applications');
              if (storedApps) {
                localApps = JSON.parse(storedApps);
                console.log('Loaded locally stored applications:', localApps);
              }
            } catch (e) {
              console.error('Failed to load local applications:', e);
            }
            
            // Merge applications from API and local storage, preferring API data
            // but keeping local ones that might not be synced yet
            let mergedApps = Array.isArray(applicationsData) ? [...applicationsData] : [];
            
            // Add local applications that don't exist in API data
            if (localApps.length > 0) {
              localApps.forEach(localApp => {
                // If this application doesn't exist in API data, add it
                if (!mergedApps.some(apiApp => 
                  apiApp.requestId === localApp.requestId || 
                  (apiApp.id && apiApp.id === localApp.id)
                )) {
                  mergedApps.push(localApp);
                }
              });
            }
            
            console.log('Merged applications data:', mergedApps);
            setMyApplications(mergedApps);
          } catch (appErr) {
            console.error('Failed to load applications:', appErr);
            
            // Even if API fails, try to load from localStorage
            try {
              const storedApps = localStorage.getItem('nurse_applications');
              if (storedApps) {
                const localApps = JSON.parse(storedApps);
                console.log('Using locally stored applications after API failure:', localApps);
                setMyApplications(localApps);
                return;
              }
            } catch (e) {
              console.error('Failed to load local applications after API failure:', e);
            }
            
            // If all else fails, set empty array
            setMyApplications([]);
          }
        } catch (requestErr) {
          console.error('Failed to load available requests:', requestErr);
          setError('Could not load available requests. Please try again.');
        }
      }

    } catch (err: any) {
      console.error('Error in loadData:', err);
      setError(err.message || 'Failed to load data. Please verify that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToRequest = async (requestId: string, price: number, estimatedTime: number, tempApp?: any) => {
    try {
      // Check if user has already applied to this request
      const existingApplication = myApplications.find(app => 
        app.requestId === requestId || 
        (app.request && app.request.id === requestId)
      );
      
      if (existingApplication) {
        console.log('User has already applied to this request:', existingApplication);
        // Show a more helpful error message
        alert('You have already applied to this request');
        return;
      }
      
      // Validate inputs
      if (!price || !estimatedTime) {
        throw new Error('Please specify the price and estimated time');
      }

      console.log('Applying to request:', requestId, 'Price:', price, 'Estimated Time:', estimatedTime);
      
      // Check if the currently logged in user is gevara@gmail.com
      const currentUser = user?.email;
      if (currentUser === 'gevara@gmail.com') {
        console.log('Special case: Gevara is applying to request', requestId);
      }

      // Call the API to submit the application
      const response = await apiService.applyToRequest({
        requestId,
        price,
        estimatedTime
      });
      
      console.log('Application submission response:', response);

      // Extract application ID from response
      let applicationId = '';
      
      // Parse response to get application ID
      if (response && typeof response === 'object') {
        if ('id' in response) {
          applicationId = response.id;
        } else if ('_id' in response) {
          applicationId = response._id;
        } else if ('data' in response && response.data && typeof response.data === 'object') {
          if ('id' in response.data) {
            applicationId = response.data.id;
          } else if ('_id' in response.data) {
            applicationId = response.data._id;
          }
        }
      }
      
      console.log('Extracted application ID:', applicationId || 'Could not extract ID');
      
      // Don't show alert messages - they disrupt UI flow and may cause state issues
      // Just log success to console
      console.log('🎉 Application submitted successfully! The patient will be notified.');
      
      // Special message for Gevara (console only, no alerts)
      if (currentUser === 'gevara@gmail.com') {
        console.log('Application submitted successfully. The patient can now view your offer and make a decision.');
      }
      
      // Create new application object with ALL necessary fields
      const newApplication = {
        id: applicationId || 'temp-' + Date.now(),
        requestId: requestId,
        nurseId: user?.id || 'unknown',
        nurseName: user?.name || 'Unknown Nurse',
        nurseEmail: user?.email || 'unknown@example.com',
        nursePhone: user?.phone || 'Unknown Phone',
        price: price,
        estimatedTime: estimatedTime,
        status: 'pending' as 'pending' | 'accepted' | 'rejected', // Properly typed
        createdAt: new Date().toISOString()
      };
      
      console.log('📋 Adding new application to state:', newApplication);
      
      // If we received a temp application from the child component, use it
      if (tempApp) {
        newApplication.id = tempApp.id || newApplication.id;
      }
      
      // IMPORTANT: Update application state IMMEDIATELY for UI changes
      // Make sure to properly type the status to satisfy TypeScript
      const typedNewApplication = {
        ...newApplication,
        status: 'pending' as 'pending' | 'accepted' | 'rejected'
      };
      
      // Create a PERSISTENT version of the applications array with our new application
      const updatedApplications = [
        ...myApplications.filter(app => app.requestId !== requestId), 
        typedNewApplication
      ];
      
      console.log('📋 Setting myApplications directly to:', updatedApplications);
      
      // CRITICALLY IMPORTANT: Store applications in state and persist in localStorage
      // This prevents the application state from being lost on refresh or UI updates
      setMyApplications(updatedApplications);
      localStorage.setItem('nurse_applications', JSON.stringify(updatedApplications));
      
      // No automatic refreshes - they erase our local state
      // The user can manually refresh if needed
      console.log('📋 Application submitted successfully - UI updated and persisted');
    } catch (err: any) {
      console.error('Application error details:', err);
      setError(err.message || 'Failed to apply to request');
      
      // Handle specific error cases in English
      if (err.message && err.message.includes('already applied')) {
        // This is the case when the API detects a duplicate application
        alert('You have already applied to this request');
      } else if (err.message && err.message.includes('You have already')) {
        // This is our custom message from our client-side check
        alert(err.message);
      } else if (err.message && (err.message.includes('validation') || err.message.includes('connect'))) {
        // Other validation errors or connection issues
        alert(`Error: ${err.message}\n\nNote: Make sure you're logged in as a nurse and the server is running properly.`);
      } else {
        // Generic error
        alert(`Error occurred while submitting application: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancelApplication = async (applicationId: string) => {
    try {
      if (confirm('Are you sure you want to cancel this application? The patient will be notified.')) {
        console.log('Cancelling application with ID:', applicationId);
        
        // First update UI optimistically
        const updatedApplications = myApplications.filter(app => app.id !== applicationId);
        setMyApplications(updatedApplications);
        
        // Update localStorage to maintain consistent state
        try {
          localStorage.setItem('nurse_applications', JSON.stringify(updatedApplications));
          console.log('Updated localStorage after cancellation');
        } catch (storageErr) {
          console.error('Failed to update localStorage:', storageErr);
        }
        
        // Then make API call
        await apiService.cancelApplication(applicationId);
        console.log('✅ Application cancelled successfully on server');
        
        // Don't reload data as it may override our local state
        // Just show a confirmation to the user
        alert('✅ Application cancelled successfully! You can apply again if needed.');
      }
    } catch (err: any) {
      console.error('Error cancelling application:', err);
      setError(err.message || 'Failed to cancel application');
      
      // Handle specific error cases
      if (err.message && err.message.includes('cannot be canceled')) {
        alert('This application cannot be cancelled because it has already been accepted');
      } else if (err.message && err.message.includes('permission')) {
        alert(err.message);
      } else {
        alert(`Failed to cancel application: ${err.message || 'Unknown error occurred'}`);
      }
      
      // Only reload data if we encountered an API error
      try {
        const storedApps = localStorage.getItem('nurse_applications');
        if (storedApps) {
          setMyApplications(JSON.parse(storedApps));
        } else {
          // If no local storage, then reload from server
          loadData(false);
        }
      } catch (e) {
        console.error('Failed to restore applications state:', e);
        loadData(false);
      }
    }
  };

  const handleUpdateApplication = async (applicationId: string, price: number, estimatedTime: number) => {
    try {
      await apiService.updateApplication(applicationId, { price, estimatedTime });
      alert('✅ Offer updated successfully! The patient has been notified.');
      setEditingApplication(null);
      loadData(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const reason = prompt('Please provide a cancellation reason:');
    if (!reason) return;

    try {
      setCancelling(requestId);
      await apiService.updateRequestStatus(requestId, 'cancelled', reason);
      await loadData(); // Reload to get updated data
      alert('Request cancelled successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request');
    } finally {
      setCancelling(null);
    }
  };

  const handleCompleteByNurse = async (requestId: string) => {
    try {
      if (confirm('Are you sure you want to mark this request as completed? This action cannot be undone.')) {
        await apiService.markRequestCompletedByNurse(requestId);
        await loadData(); // Reload to get updated data
        alert('Request marked as completed by nurse. Waiting for patient confirmation.');
      }
    } catch (err: any) {
      console.error('Complete request error:', err);
      setError(err.message || 'فشل في إكمال الطلب');
    }
  };

  const handleCompleteByPatient = async (requestId: string) => {
    try {
      if (confirm('Are you sure you want to mark this request as completed? This action cannot be undone.')) {
        await apiService.markRequestCompletedByPatient(requestId);
        await loadData(); // Reload to get updated data
        alert('Request marked as completed by patient. Thank you for using our service!');
      }
    } catch (err: any) {
      console.error('Complete request error:', err);
      setError(err.message || 'فشل في إكمال الطلب');
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user?.role === 'patient' ? 'My Requests' : 'Requests'}
              </h1>
              <p className="text-gray-600">
                {user?.role === 'patient'
                  ? 'Manage your nursing service requests'
                  : 'Find patients that need your care'
                }
              </p>
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
                {/* Patient View - My Requests */}
                {user?.role === 'patient' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Requests</h2>
                    <div className="space-y-4">
                      {myRequests.length > 0 ? (
                        myRequests.map(request => (
                          <PatientRequestCard
                            key={request.id}
                            request={request}
                            onCancel={handleCancelRequest}
                            onComplete={handleCompleteByPatient}
                            formatDate={formatDate}
                            cancelling={cancelling === request.id}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-4">You haven't created any requests yet</p>
                          <Link
                            href="/requests/create"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Create Your First Request
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nurse View - Available Requests */}
                {user?.role === 'nurse' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Requests</h2>
                    <div className="space-y-4">
                      {availableRequests.length > 0 ? (
                        availableRequests.map(request => (
                          <RequestCard
                            key={request.id}
                            request={request}
                            onApply={handleApplyToRequest}
                            onCancel={handleCancelApplication}
                            formatDate={formatDate}
                            getPatientImage={getPatientImage}
                            myApplications={myApplications}
                            setEditingApplication={setEditingApplication}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No available requests at the moment
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* My Applications Section - Only for nurses */}
                {user?.role === 'nurse' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">My Applications</h2>
                    <div className="space-y-4">
                      {myApplications.length > 0 ? (
                        myApplications.map(application => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            formatDate={formatDate}
                            onCancel={handleCancelApplication}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No applications yet. Start applying to requests above!
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
  onApply,
  onCancel,
  formatDate,
  getPatientImage,
  myApplications,
  setEditingApplication
}: {
  request: Request;
  onApply: (requestId: string, price: number, estimatedTime: number, tempApp?: any) => Promise<void>;
  onCancel: (applicationId: string) => Promise<void>;
  formatDate: (date: string) => string;
  getPatientImage: (patient?: Request['patient']) => string;
  myApplications: Application[];
  setEditingApplication: (app: Application | null) => void;
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [price, setPrice] = useState(request.budget || 100);
  const [estimatedTime, setEstimatedTime] = useState(request.estimatedDuration || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has already applied to this request
  // Enhanced check that works both with in-memory state and API state
  // Force reevaluation of hasApplied and currentApplication on every render
  const hasApplied = useMemo(() => {
    // Check if any application exists for this request ID in our applications list
    const result = myApplications.some(app => 
      app.requestId === request.id || 
      app.requestId === String(request.id) ||
      (app.request && app.request.id === request.id)
    );
    
    // Always check localStorage as well in case the state wasn't loaded yet
    try {
      const storedApps = localStorage.getItem('nurse_applications');
      if (storedApps) {
        const localApps = JSON.parse(storedApps);
        if (localApps.some(app => 
          app.requestId === request.id || 
          app.requestId === String(request.id) ||
          (app.request && app.request.id === request.id)
        )) {
          return true; // Found in localStorage
        }
      }
    } catch (e) {
      console.error('Error checking localStorage:', e);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 hasApplied check for request', request.id, ':', result);
      console.log('📋 Applications data:', myApplications.map(a => ({id: a.id, requestId: a.requestId})));
    }
    
    return result;
  }, [myApplications, request.id]);
  
  // Improved lookup with fallbacks and localStorage check
  const currentApplication = useMemo(() => {
    // First try to find in the current applications state
    const appFromState = myApplications.find(app => 
      app.requestId === request.id || 
      app.requestId === String(request.id) ||
      (app.request && app.request.id === request.id)
    );
    
    if (appFromState) {
      console.log('Found application in state:', appFromState.id);
      return appFromState;
    }
    
    // If not found in state, check localStorage
    try {
      const storedApps = localStorage.getItem('nurse_applications');
      if (storedApps) {
        const localApps = JSON.parse(storedApps);
        const appFromStorage = localApps.find(app => 
          app.requestId === request.id || 
          app.requestId === String(request.id) ||
          (app.request && app.request.id === request.id)
        );
        
        if (appFromStorage) {
          console.log('Found application in localStorage:', appFromStorage.id);
          return appFromStorage;
        }
      }
    } catch (e) {
      console.error('Error checking localStorage for application:', e);
    }
    
    // Not found anywhere
    return undefined;
  }, [myApplications, request.id]);

  const handleApplyClick = () => {
    setIsApplying(true);
  };

  const handleCancelApply = () => {
    setIsApplying(false);
  };

  const handleSubmitApplication = async () => {
    // First, check if we've already applied
    if (hasApplied) {
      alert('You have already applied to this request. Please check the Applications section for status.');
      setIsApplying(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log('Submitting application for request:', request.id, 'with price:', price, 'and time:', estimatedTime);
      
      // Create a complete application object to ensure UI consistency
      const tempApplication = {
        id: 'temp-' + Date.now(),
        requestId: request.id,
        nurseId: 'temp',
        nurseName: 'Current User',
        nurseEmail: 'user@example.com',
        nursePhone: '123-456-7890',
        price: price,
        estimatedTime: estimatedTime,
        status: 'pending' as 'pending' | 'accepted' | 'rejected',
        createdAt: new Date().toISOString()
      };
      
      // Pass the price, estimated time, and temp application to the onApply function
      // This will ensure we have a complete application object in the state
      await onApply(request.id, price, estimatedTime, tempApplication);
      
      console.log('Application submitted successfully');
      
      // Close the application form
      setIsApplying(false);
    } catch (error: any) {
      console.error('Failed to apply:', error);
      
      // Handle specific error cases in English
      if (error.message && error.message.includes('already applied')) {
        alert('You have already applied to this request');
      } else if (error.message && error.message.includes('You have already')) {
        alert(error.message);
      } else {
        alert(`Failed to submit application: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="mt-1">Duration: {request.estimatedDuration} hour(s)</p>
            <p className="mt-1">Budget: ${request.budget}</p>
            <div className="mt-3">
                      {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-2 text-xs text-white/70">
                  hasApplied: {hasApplied ? 'true' : 'false'}, 
                  apps count: {myApplications.length},
                  requestId: {request.id},
                  applicationId: {currentApplication?.id || 'none'}
                </div>
              )}              {/* Application Status Display */}
              {hasApplied ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Application Submitted</span>
                    </div>
                  </div>

                  {/* Offer Details Card */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">Your Offer</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        currentApplication?.status === 'accepted' ? 'bg-green-500 text-white' :
                        currentApplication?.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-black'
                      }`}>
                        {currentApplication?.status === 'accepted' ? '✓ Accepted' :
                         currentApplication?.status === 'rejected' ? '✗ Rejected' :
                         '⏳ Pending Review'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">${currentApplication?.price || price}</div>
                        <div className="text-xs text-white/70">Your Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{currentApplication?.estimatedTime || estimatedTime}h</div>
                        <div className="text-xs text-white/70">Estimated Time</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {currentApplication?.status === 'pending' && (
                        <button
                          onClick={() => currentApplication && setEditingApplication(currentApplication)}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Offer</span>
                        </button>
                      )}

                      {/* Complete button for accepted applications when request is in progress */}
                      {currentApplication?.status === 'accepted' && request.status === 'in_progress' && (
                        <button
                          onClick={() => handleCompleteByNurse(request.id)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md font-medium hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Complete</span>
                        </button>
                      )}

                      {currentApplication?.status === 'pending' && (
                        <button
                          onClick={() => currentApplication ? onCancel(currentApplication.id) : onCancel('temp-' + request.id)}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Cancel Offer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : !isApplying ? (
                <button
                  onClick={handleApplyClick}
                  className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  Apply to Request
                </button>
              ) : (
                <div className="mt-3 bg-white/10 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Apply to this Request</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Your Price ($)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Time (hours)</label>
                      <input
                        type="number"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(Number(e.target.value))}
                        className="w-full px-3 py-2 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSubmitApplication}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Applying...' : 'Submit Application'}
                      </button>
                      <button
                        onClick={handleCancelApply}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

// Application Card Component
function ApplicationCard({
  application,
  formatDate,
  onCancel
}: {
  application: Application;
  formatDate: (date: string) => string;
  onCancel: (applicationId: string) => Promise<void>;
}) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(application.id);
    } catch (error) {
      console.error('Failed to cancel application:', error);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              Applied on {formatDate(application.createdAt)}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {application.request?.title ? application.request.title : `Application for Request #${application.requestId}`}
          </h3>
          
          {application.request?.patient && (
            <div className="flex items-center space-x-2 mb-3 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Patient: {application.request.patient.name}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Offered Price:</span> ${application.price}
            </div>
            <div>
              <span className="font-medium">Estimated Time:</span> {application.estimatedTime} hours
            </div>
          </div>
        </div>

        {application.status === 'pending' && (
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Patient Request Card Component for Patient's Own Requests
function PatientRequestCard({
  request,
  onCancel,
  onComplete,
  formatDate,
  cancelling
}: {
  request: Request;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  formatDate: (date: string) => string;
  cancelling: boolean;
}) {
  const [showApplications, setShowApplications] = useState(true); // Default to true to show applications
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [oldApplications, setOldApplications] = useState<any[]>([]);
  const [applications, setApplications] = useState<{
    id: string;
    nurseId: string;
    nurseName: string;
    nursePhone: string;
    nurseEmail: string;
    price: number;
    estimatedTime: number;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  }[]>([]);
  
  // For visual indicator when new applications arrive
  const [hasNewApplications, setHasNewApplications] = useState(false);
  
  // Load applications only when expanded or when component mounts
  // Completely manual refresh - no automatic updates at all
  useEffect(() => {
    if (showApplications || request.status === 'pending') {
      // Load applications once when component mounts or is expanded
      loadApplications();
      
      // Auto-refresh completely disabled - user must click refresh manually
      // This prevents annoying notifications and UI updates
    }
  }, [showApplications, request.id, request.status]);
  
  const loadApplications = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingApplications(true);
      }
      
      console.log('Loading applications for request:', request.id);
      console.log('Request title:', request.title); // Display request title for debugging
      
      // Keep track of old applications for comparison before fetching new ones
      setOldApplications(applications);
      
      let data;
      try {
        // Add request ID console log with special formatting to make it easy to spot
        console.log('🔍 Fetching applications for request ID:', request.id);
        data = await apiService.getApplicationsByRequest(request.id);
        console.log('✅ Applications data successfully received:', data);
      } catch (apiError) {
        console.error('❌ API error when fetching applications:', apiError);
        data = [];
      }
      
      // Check if we have new applications or status changes
      const hasChanges = compareApplications(applications, data);
      
  // Process the received data
      let applicationsData = [];
      
      // First, check if we have valid data from the API
      if (Array.isArray(data) && data.length > 0) {
        console.log('✅ Received real application data from server:', data.length, 'applications found');
        
        // Format the data if needed (sometimes API returns a different structure)
        applicationsData = data.map(app => {
          // Handle different data structures from backend
          if (app.nurseId && typeof app.nurseId === 'object') {
            // If nurseId is an object with name, phone, email properties
            return {
              id: app.id || app._id,
              nurseId: app.nurseId._id || app.nurseId.id || app.nurseId,
              nurseName: app.nurseId.name || app.nurseName || 'Unknown',
              nursePhone: app.nurseId.phone || app.nursePhone || 'No phone',
              nurseEmail: app.nurseId.email || app.nurseEmail || 'No email',
              price: app.price,
              estimatedTime: app.estimatedTime,
              status: app.status,
              createdAt: app.createdAt
            };
          } else {
            // Direct structure
            return {
              id: app.id || app._id,
              nurseId: app.nurseId,
              nurseName: app.nurseName || 'Unknown',
              nursePhone: app.nursePhone || 'No phone',
              nurseEmail: app.nurseEmail || 'No email',
              price: app.price,
              estimatedTime: app.estimatedTime,
              status: app.status,
              createdAt: app.createdAt
            };
          }
        });
      } else {
        console.log('❌ No applications found');
      }
      
      // Update state with applications
      setApplications(applicationsData);
      
      // Always update UI indicators without notifications
      if (hasChanges && applicationsData.length > 0) {
        console.log('📋 Applications changed, updating visual indicators');
        // Just update indicators, no sound or popup notifications
        showNewApplicationNotification(applicationsData);
        setHasNewApplications(true); // Set flag for visual indicator
      }
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  };
  
  // Helper function to compare previous and new applications to detect changes
  const compareApplications = (oldApps, newApps) => {
    if (!Array.isArray(newApps)) return false;
    if (!Array.isArray(oldApps)) return newApps.length > 0;
    
    // Check if count increased (new applications)
    if (newApps.length > oldApps.length) return true;
    
    // Check if any status changed
    const oldStatusMap = Object.fromEntries(oldApps.map(app => [app.id, app.status]));
    return newApps.some(app => oldStatusMap[app.id] !== app.status);
  };
  
  // This function only updates the UI indicator without notifications
  const showNewApplicationNotification = (applications) => {
    // Completely disabled - no notifications, no sounds, no alerts
    // Just silently update the UI if needed
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 Applications data updated silently - notifications disabled');
    }
    
    // Still maintain the visual indicator for new applications
    setHasNewApplications(true);
  };
  
  const handleAcceptApplication = async (applicationId: string) => {
    try {
      if (confirm('Accept this nurse application? This will assign the nurse to your request.')) {
        console.log('Accepting application:', applicationId);
        
        // Check if this is a mock ID (for development testing)
        if (applicationId.startsWith('mock-')) {
          // For mock data, we'll just simulate success
          alert('✅ (Mock) Application accepted! The nurse has been notified.');
          // Update the local state to reflect the change
          setApplications(prev => 
            prev.map(app => 
              app.id === applicationId 
                ? { ...app, status: 'accepted' } 
                : app
            )
          );
          return;
        }
        
        try {
          await apiService.updateApplicationStatus(applicationId, 'accepted');
          alert('✅ Application accepted! The nurse has been notified and assigned to your request.');
          // Reload applications to get updated status
          loadApplications();
        } catch (apiError: any) {
          console.error('API error when accepting application:', apiError);
          
          // If the error message suggests a validation issue but the operation may have succeeded
          if (apiError.message.includes('operation may have succeeded')) {
            alert('⚠️ The application may have been accepted successfully, but there was an issue with the response. Refreshing data...');
            loadApplications(); // Refresh the data anyway to check if it actually worked
          } else {
            throw apiError; // Re-throw to be caught by the outer catch block
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to accept application:', err);
      alert(`❌ فشل قبول الطلب: ${err.message || 'يرجى المحاولة مرة أخرى لاحقًا.'}`);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      if (confirm('Reject this nurse application? The nurse will be notified.')) {
        console.log('Rejecting application:', applicationId);
        
        // Check if this is a mock ID (for development testing)
        if (applicationId.startsWith('mock-')) {
          // For mock data, we'll just simulate success
          alert('✅ (Mock) Application rejected. The nurse has been notified.');
          // Update the local state to reflect the change
          setApplications(prev => 
            prev.map(app => 
              app.id === applicationId 
                ? { ...app, status: 'rejected' } 
                : app
            )
          );
          return;
        }
        
        try {
          await apiService.updateApplicationStatus(applicationId, 'rejected');
          alert('✅ Application rejected. The nurse has been notified.');
          loadApplications();
        } catch (apiError: any) {
          console.error('API error when rejecting application:', apiError);
          
          // If the error message suggests a validation issue but the operation may have succeeded
          if (apiError.message.includes('operation may have succeeded')) {
            alert('⚠️ The application may have been rejected successfully, but there was an issue with the response. Refreshing data...');
            loadApplications(); // Refresh the data anyway to check if it actually worked
          } else {
            throw apiError; // Re-throw to be caught by the outer catch block
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to reject application:', err);
      alert(`❌ Failed to reject application: ${err.message || 'Please try again later.'}`);
    }
  };
  
  const handleUpdateApplication = async (applicationId: string, price: number, estimatedTime: number) => {
    try {
      // This would typically call an API endpoint to update the application
      alert(`Application would be updated with price: $${price} and time: ${estimatedTime}h`);
      setEditingApplication(null);
      loadApplications();
    } catch (err: any) {
      console.error('Failed to update application:', err);
      alert('❌ Failed to update application. Please try again.');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  // Count pending applications
  const pendingApplicationsCount = applications.filter(app => app.status === 'pending').length;

  const canCancel = ['pending', 'accepted'].includes(request.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>

          {/* Image indicator */}
          {request.images && request.images.length > 0 && (
            <div className="flex items-center text-sm text-blue-600 mb-3">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{request.images.length} image{request.images.length > 1 ? 's' : ''} attached</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {request.address}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Scheduled: {formatDate(request.scheduledDate)}
            </div>
            {request.patient && (
              <>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Patient: {request.patient.name}
                </div>
                {request.patient.email && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email: {request.patient.email}
                  </div>
                )}
              </>
            )}
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Budget: ${request.budget}
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Duration: {request.estimatedDuration}h
            </div>
          </div>

          {request.nurse && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-900 mb-1">Assigned Nurse</h4>
              <p className="text-sm text-green-800">{request.nurse.name}</p>
              <p className="text-xs text-green-600">{request.nurse.phone}</p>
            </div>
          )}
          
          {/* Applications section */}
          {(request.status === 'pending' || request.status === 'open') && (
            <div className="mt-4">
              <div 
                className="flex items-center justify-between cursor-pointer p-3 bg-blue-50 rounded-t-lg border-b-2 border-blue-100" 
                onClick={() => {
                  setShowApplications(!showApplications);
                  // Reset new applications indicator when expanding
                  if (!showApplications) {
                    setHasNewApplications(false);
                  }
                }}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h4 className="font-medium text-blue-900">Nurse Applications</h4>
                  {applications.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {applications.length} total
                    </span>
                  )}
                  {pendingApplicationsCount > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {pendingApplicationsCount} new
                    </span>
                  )}
                  {hasNewApplications && (
                    <span className="ml-2 animate-pulse bg-green-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                      <span className="mr-1">●</span> New!
                    </span>
                  )}
                </div>
                <svg 
                  className={`w-5 h-5 text-blue-600 transition-transform ${showApplications ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {showApplications && (
                <div className={`mt-0 space-y-3 p-4 bg-white border border-gray-200 rounded-b-lg shadow ${applications.length > 0 ? 'divide-y divide-gray-100' : ''}`}>
                  {loadingApplications ? (
                    <div className="flex justify-center py-6">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="mt-3 text-sm text-gray-500">Loading nurse applications...</p>
                      </div>
                    </div>
                  ) : applications.length > 0 ? (
                    applications.map(app => (
                      <div key={app.id} className="p-5 rounded-lg bg-white hover:bg-blue-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                                <span className="font-semibold text-xl">
                                  {app.nurseName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-gray-900 text-xl">{app.nurseName}</h5>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                    {getStatusText(app.status)}
                                  </span>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className="text-sm text-gray-500">Applied {formatDate(app.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{app.nursePhone}</span>
                              </div>
                              {app.nurseEmail && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span>{app.nurseEmail}</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-100">
                              <h6 className="font-medium text-gray-900 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Nurse Offer Details
                              </h6>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                  <span className="text-gray-500 text-sm">Price Offer</span>
                                  <p className="font-semibold text-green-600 text-2xl">${app.price}</p>
                                  {request.budget > 0 && (
                                    <span className={`text-xs ${app.price <= request.budget ? 'text-green-500' : 'text-orange-500'}`}>
                                      {app.price <= request.budget ? 'Within' : 'Above'} your budget
                                    </span>
                                  )}
                                </div>
                                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                  <span className="text-gray-500 text-sm">Time Estimate</span>
                                  <p className="font-semibold text-blue-600 text-2xl">{app.estimatedTime}h</p>
                                  {request.estimatedDuration > 0 && (
                                    <span className={`text-xs ${app.estimatedTime <= request.estimatedDuration ? 'text-green-500' : 'text-orange-500'}`}>
                                      {app.estimatedTime <= request.estimatedDuration ? 'Within' : 'Exceeds'} your estimate
                                    </span>
                                  )}
                                </div>
                                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                  <span className="text-gray-500 text-sm">Availability</span>
                                  <p className="font-semibold text-purple-600 text-lg">Immediate</p>
                                  <span className="text-xs text-green-500">Ready to start</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            {app.status === 'pending' ? (
                              <div className="flex flex-col space-y-3">
                                <button
                                  onClick={() => handleAcceptApplication(app.id)}
                                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow font-medium flex items-center justify-center space-x-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>Accept This Nurse</span>
                                </button>
                                <button
                                  onClick={() => handleRejectApplication(app.id)}
                                  className="px-4 py-2 bg-transparent text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span>Decline Offer</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-center py-3 bg-gray-50 rounded-lg">
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                                  {getStatusText(app.status)}
                                </span>
                                <p className="text-sm text-gray-500 mt-2">
                                  {app.status === 'accepted' ? 'You\'ve accepted this nurse' : 'You\'ve rejected this application'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No Applications Yet</h3>
                      <p className="text-gray-500 mb-4">Nurses haven't applied to this request yet. Check back later or adjust your budget to attract more applications.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Applications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 ml-6">
          <Link
            href={`/requests/${request.id}`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            View Details
          </Link>

          {/* Complete button for in_progress requests */}
          {request.status === 'in_progress' && (
            <button
              onClick={() => onComplete(request.id)}
              className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-white hover:bg-green-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Complete
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(request.id)}
              disabled={cancelling}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </>
              ) : (
                'Cancel Request'
              )}
            </button>
          )}
        </div>
        {/* Edit Application Modal */}
        {editingApplication && (
          <EditApplicationModal
            application={editingApplication}
            onUpdate={handleUpdateApplication}
            onClose={() => setEditingApplication(null)}
          />
        )}
      </div>
    </div>
  );
}

// Edit Application Modal Component
function EditApplicationModal({
  application,
  onUpdate,
  onClose
}: {
  application: Application;
  onUpdate: (applicationId: string, price: number, estimatedTime: number) => Promise<void>;
  onClose: () => void;
}) {
  const [price, setPrice] = useState(application.price);
  const [estimatedTime, setEstimatedTime] = useState(application.estimatedTime);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0 || estimatedTime <= 0) {
      alert('Please enter valid price and time values');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(application.id, price, estimatedTime);
    } catch (error) {
      console.error('Failed to update application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Your Offer</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Price ($)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Time (hours)
            </label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
              min="0.5"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestsList;
