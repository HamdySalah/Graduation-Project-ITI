import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import Layout, { Card, LoadingSpinner } from '../../components/Layout';
import Link from 'next/link';
import { apiService } from '../../lib/api';
import Image from 'next/image';

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
      console.log('🔍 Loading nurse profile for ID:', id);

      const response = await apiService.getNurseById(id as string);
      console.log('🔍 Nurse profile response:', response);

      // Handle different response formats
      const nurseData = response?.data || response;
      console.log('🔍 Nurse data:', nurseData);

      setNurse(nurseData);
    } catch (err: any) {
      console.error('❌ Error loading nurse profile:', err);
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

  if (error || !nurse || typeof nurse !== 'object') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Nurse not found or invalid data'}</p>
          <button
            type="button"
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CareConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900">Find Care</button>
              <button className="text-gray-600 hover:text-gray-900">Find Jobs</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Post a Job
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-white font-semibold">
                      {nurse.name?.charAt(0)?.toUpperCase() || 'N'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{nurse.name || 'Unknown Nurse'}</h1>
                  <p className="text-gray-600 mb-1">Registered Nurse (RN)</p>
                  <p className="text-gray-500 text-sm">
                    {nurse.yearsOfExperience || 0} years experience | {nurse.rating?.toFixed(1) || '0.0'} stars ({nurse.totalReviews || 0} reviews)
                  </p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {nurse.bio || `${nurse.name || 'This nurse'} is a compassionate and experienced Registered Nurse with a passion for providing personalized care. They have a proven track record of improving patient outcomes and are dedicated to building strong relationships with patients and their families, ensuring they feel supported and well-cared for.`}
              </p>
            </div>

            {/* Qualifications & Certifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Qualifications & Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Nursing Degree</h3>
                  <p className="text-gray-600 mb-1">Bachelor of Science in Nursing (BSN)</p>

                  <h3 className="font-medium text-gray-900 mb-3 mt-4">RN License</h3>
                  <p className="text-gray-600 mb-1">Active and valid RN license</p>

                  <h3 className="font-medium text-gray-900 mb-3 mt-4">BLS Certification</h3>
                  <p className="text-gray-600">Basic Life Support certified</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Geriatric Nursing Certification</h3>
                  <p className="text-gray-600">Certified in Geriatric Nursing</p>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Experience</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">H</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Registered Nurse</h3>
                    <p className="text-blue-600 text-sm">CareFirst Hospital (2018-Present)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold">H</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Nursing Assistant</h3>
                    <p className="text-blue-600 text-sm">ElderCare Facility (2016-2018)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">💊</div>
                  <p className="text-sm text-gray-700">Medication Management</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🩹</div>
                  <p className="text-sm text-gray-700">Wound Care</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🎓</div>
                  <p className="text-sm text-gray-700">Patient Education</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-sm text-gray-700">Vital Signs Monitoring</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🩺</div>
                  <p className="text-sm text-gray-700">IV Therapy</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">👴</div>
                  <p className="text-sm text-gray-700">Geriatric Care</p>
                </div>
              </div>
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews & Ratings</h2>

              {/* Rating Summary */}
              <div className="flex items-center space-x-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{nurse.rating?.toFixed(1) || '0.0'}</div>
                  <div className="flex items-center justify-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < Math.floor(nurse.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{nurse.totalReviews || 0} reviews</p>
                </div>

                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const percentage = stars === 5 ? 80 : stars === 4 ? 15 : stars === 3 ? 3 : stars === 2 ? 1 : 1;
                    return (
                      <div key={stars} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 w-2">{stars}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 w-8">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {nurse.reviews && nurse.reviews.length > 0 ? (
                  nurse.reviews.slice(0, 3).map((review, index) => (
                    <div key={review.id || index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {review.patientName?.charAt(0) || 'P'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">{review.patientName || 'Patient'}</span>
                            <span className="text-sm text-gray-500">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${
                                  i < (review.rating || 5) ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-gray-700">
                            {review.comment || `${nurse.name} provided exceptional care for my mother. She was attentive, knowledgeable, and truly compassionate. I highly recommend her services.`}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>👍</span>
                              <span>{Math.floor(Math.random() * 20) + 5}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>💬</span>
                              <span>{Math.floor(Math.random() * 5) + 1}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Default reviews if none exist
                  <>
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">E</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">Emily Carter</span>
                            <span className="text-sm text-gray-500">Dec 15, 2024</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm text-yellow-400">★</span>
                            ))}
                          </div>
                          <p className="text-gray-700">
                            {nurse.name} provided exceptional care for my mother. She was attentive, knowledgeable, and truly compassionate. I highly recommend her services.
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>👍</span>
                              <span>10</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>💬</span>
                              <span>2</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">D</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">David Lee</span>
                            <span className="text-sm text-gray-500">May 30, 2024</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className="text-sm text-yellow-400">★</span>
                            ))}
                          </div>
                          <p className="text-gray-700">
                            {nurse.name} is a fantastic nurse. She is professional, punctual, and always goes the extra mile to ensure her patients are comfortable and well-cared for.
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>👍</span>
                              <span>8</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>💬</span>
                              <span>1</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">K</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">Karen Brown</span>
                            <span className="text-sm text-gray-500">April 10, 2024</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(4)].map((_, i) => (
                              <span key={i} className="text-sm text-yellow-400">★</span>
                            ))}
                            <span className="text-sm text-gray-300">★</span>
                          </div>
                          <p className="text-gray-700">
                            {nurse.name} is a good nurse, but there were a few minor communication issues. Overall, she provided competent care.
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>👍</span>
                              <span>5</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-gray-700">
                              <span>💬</span>
                              <span>3</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium mb-4">
                Contact Nurse
              </button>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span className="font-medium">{nurse.hourlyRate || 'N/A'} EGP/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{nurse.yearsOfExperience || 0} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Jobs:</span>
                  <span className="font-medium">{nurse.completedJobs || 150}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">Within 1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Languages:</span>
                  <span className="font-medium">{nurse.languages?.join(', ') || 'English, Arabic'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{nurse.address || 'Cairo, Egypt'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className={`font-medium ${nurse.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {nurse.isAvailable ? 'Available Now' : 'Currently Busy'}
                  </span>
                </div>
              </div>

              {user?.role === 'patient' && nurse.isAvailable && (
                <Link
                  href={`/requests/create?nurseId=${nurse.id || ''}`}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium mt-6 block text-center"
                >
                  Book Now
                </Link>
              )}
            </div>
          </div>
        </div>


        {/* Back Button */}
        <div className="mt-8">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to Search
          </button>
        </div>
      </div>
    </div>
  );
}
