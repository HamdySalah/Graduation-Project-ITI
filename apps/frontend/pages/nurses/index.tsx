import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { LoadingSpinner } from '../../components/Layout';
import { apiService } from '../../lib/api';
import Link from 'next/link';

const SPECIALIZATIONS = [
  { value: 'general', label: 'General Nursing' },
  { value: 'pediatric', label: 'Pediatric Care' },
  { value: 'geriatric', label: 'Geriatric Care' },
  { value: 'icu', label: 'ICU Care' },
  { value: 'emergency', label: 'Emergency Care' },
  { value: 'surgical', label: 'Surgical Care' },
  { value: 'psychiatric', label: 'Psychiatric Care' },
  { value: 'oncology', label: 'Oncology Care' },
];

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Any Experience' },
  { value: '1-3', label: '1-3 years' },
  { value: '4-7', label: '4-7 years' },
  { value: '8-15', label: '8-15 years' },
  { value: '15+', label: '15+ years' },
];

const RATING_LEVELS = [
  { value: '', label: 'Any Rating' },
  { value: '4.5', label: '4.5+ stars' },
  { value: '4.0', label: '4.0+ stars' },
  { value: '3.5', label: '3.5+ stars' },
  { value: '3.0', label: '3.0+ stars' },
];

interface Nurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  profileImage?: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  hourlyRate: number;
  bio: string;
  languages: string[];
  isAvailable: boolean;
  education?: string;
  certifications?: string[];
}

export default function FindNurses() {
  console.log('FindNurses component rendering...');
  const { user } = useAuth();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [filteredNurses, setFilteredNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState('Component initialized');

  const [filters, setFilters] = useState({
    latitude: 30.033,
    longitude: 31.233,
    radius: 10,
    specializations: [] as string[],
    experience: '',
    rating: '',
    availability: 'all',
  });

  useEffect(() => {
    // Get user's location if available
    if (user?.location?.coordinates) {
      setFilters(prev => ({
        ...prev,
        longitude: user.location!.coordinates[0],
        latitude: user.location!.coordinates[1],
      }));
    }
  }, [user]);

  // Separate useEffect for initial search
  useEffect(() => {
    console.log('Initial search triggered on component mount');
    console.log('Current filters:', filters);
    setDebugInfo('useEffect triggered, calling searchNurses...');
    searchNurses();
  }, []); // Only run once on mount

  useEffect(() => {
    // Apply client-side filtering
    let filtered = nurses;
    console.log('Applying filters to nurses:', nurses.length, 'nurses');

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(nurse =>
        nurse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.specializations.some(spec =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      console.log('After search filter:', filtered.length, 'nurses');
    }

    // Filter by experience
    if (filters.experience) {
      filtered = filtered.filter(nurse => {
        const exp = nurse.yearsOfExperience;
        switch (filters.experience) {
          case '1-3': return exp >= 1 && exp <= 3;
          case '4-7': return exp >= 4 && exp <= 7;
          case '8-15': return exp >= 8 && exp <= 15;
          case '15+': return exp >= 15;
          default: return true;
        }
      });
      console.log('After experience filter:', filtered.length, 'nurses');
    }

    // Filter by rating
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(nurse => nurse.rating >= minRating);
      console.log('After rating filter:', filtered.length, 'nurses');
    }

    // Filter by availability
    if (filters.availability !== 'all') {
      filtered = filtered.filter(nurse =>
        filters.availability === 'available' ? nurse.isAvailable : !nurse.isAvailable
      );
      console.log('After availability filter:', filtered.length, 'nurses');
    }

    console.log('Final filtered nurses:', filtered.length);
    setFilteredNurses(filtered);
  }, [nurses, searchTerm, filters.experience, filters.rating, filters.availability]);

  const searchNurses = async () => {
    try {
      setLoading(true);
      setError('');
      setDebugInfo('Starting API call...');
      console.log('Searching nurses with filters:', filters);
      const data = await apiService.getNearbyNurses({
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
        specializations: filters.specializations.length > 0 ? filters.specializations : undefined,
      });
      console.log('Received nurse data:', data);
      setDebugInfo(`Received ${Array.isArray(data) ? data.length : 'invalid'} nurses`);
      setNurses(data as Nurse[]);
    } catch (err: any) {
      console.error('Error searching nurses:', err);
      setError(err.message || 'Failed to search nurses');
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFilters(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  // Check if user is logged in and has patient role
  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Please log in to search for nurses.</p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login as Patient</a>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'patient') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Only patients can search for nurses.</p>
          <p className="text-gray-500 mt-2">Current user: {user.name} ({user.role})</p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login as Patient</a>
          </div>
        </div>
      </Layout>
    );
  }

  const showAuthWarning = false; // Remove debug warning for production

  return (
    <Layout title="Find a Nurse">
      <div className="min-h-screen bg-gray-50">
        {showAuthWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mx-4 mt-4">
            <p className="text-yellow-800">
              <strong>Debug Mode:</strong> {user ? `Logged in as ${user.name} (${user.role})` : 'Not logged in'}.
              Normally only patients can access this page.
            </p>
            <p className="text-sm text-gray-600 mt-2">Debug Info: {debugInfo}</p>
            <p className="text-sm text-gray-600">Nurses: {nurses.length}, Filtered: {filteredNurses.length}</p>
            <button
              onClick={searchNurses}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Manual Search Test
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Find a Nurse</h2>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

                  {/* Specialty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Specialty</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleSpecializationToggle(value);
                        }
                      }}
                    >
                      <option value="">Select</option>
                      {SPECIALIZATIONS.map(spec => (
                        <option key={spec.value} value={spec.value}>{spec.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select</option>
                      <option>Cairo</option>
                      <option>Alexandria</option>
                      <option>Giza</option>
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Availability</label>
                    <select
                      value={filters.availability}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Select</option>
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                    </select>
                  </div>

                  {/* Experience Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Experience</label>
                    <select
                      value={filters.experience}
                      onChange={(e) => handleFilterChange('experience', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EXPERIENCE_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
                    <select
                                                                                                                                           value={filters.rating}
                      onChange={(e) => handleFilterChange('rating', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {RATING_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Apply Filters Button */}
                  <button
                    onClick={searchNurses}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {/* Selected Specializations */}
              {filters.specializations.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {filters.specializations.map(spec => (
                      <span
                        key={spec}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {SPECIALIZATIONS.find(s => s.value === spec)?.label || spec}
                        <button
                          onClick={() => handleSpecializationToggle(spec)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : filteredNurses.length > 0 ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Found {filteredNurses.length} nurse{filteredNurses.length !== 1 ? 's' : ''} nearby
                  </h3>
                  <div className="space-y-4">
                    {filteredNurses.map(nurse => (
                      <NurseCard key={nurse.id} nurse={nurse} />
                    ))}
                  </div>
                </div>
              ) : !loading && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-lg shadow-sm p-8">
                    <p className="text-gray-500 text-lg">No nurses found matching your criteria.</p>
                    <p className="text-gray-400 mt-2">Try adjusting your filters or expanding your search radius.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Nurse Card Component
function NurseCard({ nurse }: { nurse: Nurse }) {
  // Get specialization display names
  const getSpecializationLabel = (spec: string) => {
    const specialization = SPECIALIZATIONS.find(s => s.value === spec);
    return specialization ? specialization.label : spec.replace('_', ' ');
  };

  // Default nurse image if none provided - cycle through available images
  const defaultImages = ['/imagenurse.jpg', '/imagenurse2.jpeg', '/imagenurse3.jpeg'];
  const defaultImageIndex = nurse.id.charCodeAt(nurse.id.length - 1) % defaultImages.length;
  const nurseImage = nurse.profileImage || defaultImages[defaultImageIndex];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left side - Nurse Info */}
        <div className="flex-1 p-6 text-white">
          {/* Verified Badge */}
          <div className="inline-flex items-center px-2 py-1 bg-white bg-opacity-20 rounded text-xs font-medium mb-3">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </div>

          {/* Nurse Name and Title */}
          <h3 className="text-xl font-bold mb-1">{nurse.name}</h3>
          <p className="text-blue-100 mb-4">
            {nurse.yearsOfExperience > 0
              ? `${nurse.yearsOfExperience} years experience | Specializes in ${getSpecializationLabel(nurse.specializations[0] || 'general')}`
              : `Specializes in ${getSpecializationLabel(nurse.specializations[0] || 'general')}`
            }
          </p>

          {/* View Profile Button */}
          <Link
            href={`/nurses/${nurse.id}`}
            className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200"
          >
            View Profile
          </Link>

          {/* Additional Info - Hidden on mobile, shown on larger screens */}
          <div className="hidden md:block mt-6 space-y-2">
            <div className="flex items-center text-blue-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {nurse.address}
            </div>

            {nurse.rating > 0 && (
              <div className="flex items-center text-blue-100">
                <svg className="w-4 h-4 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {nurse.rating.toFixed(1)} ({nurse.totalReviews} reviews)
              </div>
            )}

            <div className="flex items-center text-blue-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {nurse.hourlyRate} EGP/hour
            </div>

            {nurse.languages && nurse.languages.length > 0 && (
              <div className="flex items-center text-blue-100">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {nurse.languages.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Nurse Photo */}
        <div className="md:w-64 h-48 md:h-auto relative">
          <img
            src={nurseImage}
            alt={nurse.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a default image if the nurse image fails to load
              (e.target as HTMLImageElement).src = defaultImages[0];
            }}
          />

          {/* Availability Badge */}
          <div className="absolute top-4 right-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              nurse.isAvailable
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {nurse.isAvailable ? 'Available' : 'Busy'}
            </div>
          </div>

          {/* Book Now Button - Mobile */}
          {nurse.isAvailable && (
            <div className="absolute bottom-4 right-4 md:hidden">
              <Link
                href={`/requests/create?nurseId=${nurse.id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
              >
                Book Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Info Section */}
      <div className="md:hidden p-4 bg-blue-800 text-blue-100 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm">{nurse.address}</span>
          </div>
          <span className="text-sm font-medium">{nurse.hourlyRate} EGP/hour</span>
        </div>

        {nurse.rating > 0 && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm">{nurse.rating.toFixed(1)} ({nurse.totalReviews} reviews)</span>
          </div>
        )}

        {/* Book Now Button - Mobile Bottom */}
        {nurse.isAvailable && (
          <div className="pt-2">
            <Link
              href={`/requests/create?nurseId=${nurse.id}`}
              className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
            >
              Book Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
