import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';
import { reviewApiService } from '../lib/reviewApi';
import CommonLayout from '../components/CommonLayout';
import ErrorDisplay from '../components/ErrorDisplay';
import UserRatingDisplay from '../components/UserRatingDisplay';
import { StarRating } from '../components/RatingComponent';
import { CustomError } from '../lib/errors';
import { errorHandler } from '../lib/errorHandler';

interface Nurse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  profile?: {
    specializations: string[];
    experience: number;
    bio: string;
    hourlyRate: number;
    availability: string[];
    location: {
      address: string;
      city: string;
      state: string;
    };
  };
  rating?: number;
  completedJobs?: number;
  createdAt: string;
}

const FindNursesPage = () => {
  const { user } = useAuth();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CustomError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);

  useEffect(() => {
    if (user?.role === 'patient') {
      loadNurses();
    }
  }, [user]);

  const loadNurses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all verified nurses
      const response = await apiService.getNurses();
      const verifiedNurses = response.filter((nurse: any) => nurse.status === 'verified');
      
      setNurses(verifiedNurses);
    } catch (err: any) {
      console.error('Failed to load nurses:', err);
      const customError = errorHandler.handleError(err);
      setError(customError);
    } finally {
      setLoading(false);
    }
  };

  const filteredNurses = nurses.filter(nurse => {
    const matchesSearch = nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nurse.profile?.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialization = !filterSpecialization || 
                                 nurse.profile?.specializations?.includes(filterSpecialization);
    
    const matchesLocation = !filterLocation ||
                           nurse.profile?.location?.city?.toLowerCase().includes(filterLocation.toLowerCase()) ||
                           nurse.profile?.location?.state?.toLowerCase().includes(filterLocation.toLowerCase());

    return matchesSearch && matchesSpecialization && matchesLocation;
  });



  if (user?.role !== 'patient') {
    return (
      <CommonLayout activeItem="find-nurses" allowedRoles={['patient']}>
        <div className="p-6">
          <ErrorDisplay 
            error="Access denied. This page is only available to patients."
            onDismiss={() => window.location.href = '/dashboard'}
          />
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout activeItem="find-nurses" allowedRoles={['patient']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Find Nurses</h1>
          <p className="text-gray-600 mt-2">
            Browse and connect with qualified nurses in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Nurses
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or bio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                id="specialization"
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Specializations</option>
                <option value="elderly_care">Elderly Care</option>
                <option value="pediatric">Pediatric</option>
                <option value="wound_care">Wound Care</option>
                <option value="medication_management">Medication Management</option>
                <option value="post_surgical">Post-Surgical Care</option>
                <option value="chronic_disease">Chronic Disease Management</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                placeholder="City or state..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <ErrorDisplay 
            error={error}
            className="mb-6"
            onDismiss={() => setError(null)}
            onRetry={loadNurses}
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNurses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Nurses Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterSpecialization || filterLocation 
                ? 'Try adjusting your search criteria.'
                : 'No verified nurses are available at the moment.'
              }
            </p>
            {(searchTerm || filterSpecialization || filterLocation) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterSpecialization('');
                  setFilterLocation('');
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredNurses.map((nurse) => (
              <div key={nurse._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{nurse.name}</h3>
                      <p className="text-gray-600">{nurse.profile?.bio || 'Professional nurse'}</p>
                      {nurse.rating && (
                        <div className="flex items-center mt-1">
                          <StarRating rating={nurse.rating} readonly size="sm" />
                          <span className="text-sm text-gray-600 ml-2">
                            ({nurse.rating}/5) • {nurse.completedJobs || 0} jobs completed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {nurse.profile?.hourlyRate && (
                      <div className="text-lg font-semibold text-green-600">
                        ${nurse.profile.hourlyRate}/hr
                      </div>
                    )}
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {nurse.profile?.specializations?.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {spec.replace('_', ' ')}
                        </span>
                      )) || <span className="text-sm text-gray-500">Not specified</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Experience & Location</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Experience:</span> {nurse.profile?.experience || 'Not specified'} years</p>
                      <p><span className="font-medium">Location:</span> {
                        nurse.profile?.location 
                          ? `${nurse.profile.location.city}, ${nurse.profile.location.state}`
                          : 'Not specified'
                      }</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Member since {new Date(nurse.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNurse(nurse)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>
                    <a
                      href={`tel:${nurse.phone}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact
                    </a>
                    <a
                      href={`/create-request?nurse=${nurse._id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Request Service
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredNurses.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredNurses.length} of {nurses.length} available nurses
          </div>
        )}

        {/* Nurse Profile Modal */}
        {selectedNurse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedNurse.name}'s Profile
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedNurse(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <UserRatingDisplay
                  userId={selectedNurse._id}
                  userName={selectedNurse.name}
                  userRole="nurse"
                  showReviews={true}
                  showStats={true}
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <a
                  href={`tel:${selectedNurse.phone}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact
                </a>
                <a
                  href={`/create-request?nurse=${selectedNurse._id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Request Service
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </CommonLayout>
  );
};

export default FindNursesPage;
