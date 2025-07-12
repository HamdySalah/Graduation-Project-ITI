import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
import Link from 'next/link';

interface NurseProfile {
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
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    patientName: string;
    createdAt: string;
  }>;
}

export default function NurseProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [nurse, setNurse] = useState<NurseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadNurseProfile();
    }
  }, [id]);

  const loadNurseProfile = async () => {
    try {
      setLoading(true);
      // Note: You'll need to add this endpoint to your API service
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/nurses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load nurse profile');
      }
      
      const data = await response.json();
      setNurse(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load nurse profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error || !nurse) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Nurse not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${nurse.name} - Nurse Profile`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{nurse.name}</h1>
              <p className="text-gray-600">{nurse.yearsOfExperience} years of experience</p>
              <p className="text-sm text-gray-500">{nurse.address}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-2">
                <span className="text-yellow-400 text-2xl">⭐</span>
                <span className="text-2xl font-bold">{nurse.rating.toFixed(1)}</span>
                <span className="text-gray-500">({nurse.totalReviews} reviews)</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{nurse.hourlyRate} EGP/hour</p>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                nurse.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {nurse.isAvailable ? 'Available Now' : 'Currently Busy'}
              </div>
            </div>
          </div>

          {user?.role === 'patient' && nurse.isAvailable && (
            <div className="flex space-x-4">
              <Link
                href={`/requests/create?nurseId=${nurse.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Book This Nurse
              </Link>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium">
                Contact Nurse
              </button>
            </div>
          )}
        </Card>

        {/* About */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
          <p className="text-gray-700 leading-relaxed">{nurse.bio}</p>
        </Card>

        {/* Professional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-500">License Number:</span>
                <p className="text-gray-900">{nurse.licenseNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Education:</span>
                <p className="text-gray-900">{nurse.education || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Completed Jobs:</span>
                <p className="text-gray-900">{nurse.completedJobs}</p>
              </div>
              {nurse.certifications && nurse.certifications.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">Certifications:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nurse.certifications.map(cert => (
                      <span
                        key={cert}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills & Languages</h3>
            <div className="space-y-4">
              <div>
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
              <div>
                <span className="font-medium text-gray-500">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
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
          </Card>
        </div>

        {/* Reviews */}
        {nurse.reviews && nurse.reviews.length > 0 && (
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Patient Reviews</h3>
            <div className="space-y-4">
              {nurse.reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{review.patientName}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Back Button */}
        <div className="flex justify-start">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to Search
          </button>
        </div>
      </div>
    </Layout>
  );
}
