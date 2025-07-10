
import React, { useState, useEffect } from 'react';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
import { apiService } from '../../lib/api';

// Define interfaces
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
  education: string;
  certifications: string[];
  rating: number;
  totalReviews: number;
  completedJobs: number;
  hourlyRate: number;
  bio: string;
  languages: string[];
  isAvailable: boolean;
}

interface Filters {
  latitude: number;
  longitude: number;
  radius?: number;
  specializations?: string[];
}

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

const FindNurse = () => {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [filters, setFilters] = useState<Filters>({
    latitude: 30.033, // Default to Cairo coordinates
    longitude: 31.233,
    radius: 10,
    specializations: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setFilters(prev => ({ ...prev, latitude, longitude }));
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Location access denied. Using default location (Cairo).');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser. Using default location (Cairo).');
    }
  }, []);

  // Fetch nurses based on filters
  const searchNurses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getNearbyNurses(filters);

      // Extract the data array from the API response
      let nursesData: Nurse[] = [];
      if (response && typeof response === 'object' && 'data' in response) {
        nursesData = (response as { data: Nurse[] }).data || [];
      } else if (Array.isArray(response)) {
        nursesData = response;
      }

      setNurses(nursesData);
    } catch (err: any) {
      setError(err.message || 'Failed to search nurses');
      setNurses([]); // Ensure nurses is always an array
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when location is available
  useEffect(() => {
    if (filters.latitude && filters.longitude) {
      searchNurses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.latitude, filters.longitude]);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFilters(prev => ({
      ...prev,
      specializations: prev.specializations?.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...(prev.specializations || []), specialization]
    }));
  };

  const resetFilters = () => {
    setFilters({
      latitude: userLocation?.latitude || 30.033,
      longitude: userLocation?.longitude || 31.233,
      radius: 10,
      specializations: [],
    });
  };

  return (
    <Layout title="Find Nurses">
      <div className="space-y-6">
        {/* Location Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Search Location</h3>
              <p className="text-sm text-gray-500">
                {userLocation
                  ? `Using your current location (${userLocation.latitude.toFixed(3)}, ${userLocation.longitude.toFixed(3)})`
                  : 'Using default location (Cairo, Egypt)'
                }
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh Location
            </button>
          </div>
        </Card>

        {/* Filters Section */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius (km)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={filters.radius || 10}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <label key={spec.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.specializations?.includes(spec.value) || false}
                      onChange={() => handleSpecializationToggle(spec.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{spec.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={resetFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Reset Filters
            </button>
            <button
              onClick={searchNurses}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Nurses'}
            </button>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="p-8">
            <LoadingSpinner />
          </Card>
        )}

        {/* Nurses List */}
        {!loading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Found {nurses.length} nurse{nurses.length !== 1 ? 's' : ''} nearby
              </h3>
            </div>

            {nurses.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No nurses found in your area. Try increasing the search radius.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nurses.map((nurse) => (
                  <Card key={nurse.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{nurse.name}</h3>
                        <p className="text-sm text-gray-500">{nurse.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 text-sm font-medium">
                            {nurse.rating > 0 ? nurse.rating.toFixed(1) : 'New'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {nurse.totalReviews} review{nurse.totalReviews !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Experience:</strong> {nurse.yearsOfExperience} years
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Specializations:</strong> {nurse.specializations.join(', ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Rate:</strong> ${nurse.hourlyRate}/hour
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Completed Jobs:</strong> {nurse.completedJobs}
                      </p>
                      {nurse.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <strong>About:</strong> {nurse.bio}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nurse.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {nurse.isAvailable ? 'Available' : 'Busy'}
                      </span>
                      <button
                        onClick={() => alert(`Contact ${nurse.name} at ${nurse.phone}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                      >
                        Contact
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FindNurse;