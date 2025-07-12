import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
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
  const { user } = useAuth();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    latitude: 30.033,
    longitude: 31.233,
    radius: 10,
    specializations: [] as string[],
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
    searchNurses();
  }, [user]);

  const searchNurses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getNearbyNurses(filters);
      setNurses(data as Nurse[]);
    } catch (err: any) {
      setError(err.message || 'Failed to search nurses');
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

  if (!user || user.role !== 'patient') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Only patients can search for nurses.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Find Nurses">
      <div className="space-y-6">
        {/* Search Filters */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={filters.latitude}
                onChange={(e) => handleFilterChange('latitude', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={filters.longitude}
                onChange={(e) => handleFilterChange('longitude', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={filters.radius}
                onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specializations
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(spec => (
                <button
                  key={spec.value}
                  onClick={() => handleSpecializationToggle(spec.value)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.specializations.includes(spec.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {spec.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={searchNurses}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Nurses'}
          </button>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : nurses.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {nurses.length} nurse{nurses.length !== 1 ? 's' : ''} nearby
            </h3>
            {nurses.map(nurse => (
              <NurseCard key={nurse.id} nurse={nurse} />
            ))}
          </div>
        ) : !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No nurses found in your area. Try expanding your search radius.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Nurse Card Component
function NurseCard({ nurse }: { nurse: Nurse }) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{nurse.name}</h3>
          <p className="text-gray-600">{nurse.yearsOfExperience} years of experience</p>
          <p className="text-sm text-gray-500">{nurse.address}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-yellow-400">⭐</span>
            <span className="font-medium">{nurse.rating.toFixed(1)}</span>
            <span className="text-gray-500">({nurse.totalReviews} reviews)</span>
          </div>
          <p className="text-lg font-semibold text-green-600">{nurse.hourlyRate} EGP/hour</p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            nurse.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {nurse.isAvailable ? 'Available' : 'Busy'}
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{nurse.bio}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
          <div className="flex flex-wrap gap-1">
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
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Languages</h4>
          <div className="flex flex-wrap gap-1">
            {nurse.languages.map(lang => (
              <span
                key={lang}
                className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <p>License: {nurse.licenseNumber}</p>
          <p>Completed Jobs: {nurse.completedJobs}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/nurses/${nurse.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View Profile
          </Link>
          {nurse.isAvailable && (
            <Link
              href={`/requests/create?nurseId=${nurse.id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
