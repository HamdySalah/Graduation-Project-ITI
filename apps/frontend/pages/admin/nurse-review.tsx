import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/Layout';
import { apiService } from '../../lib/api';
import { motion } from 'framer-motion';

interface NurseProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  address: string;
  location?: {
    coordinates: [number, number];
  };
  createdAt: string;
  
  // Profile completion data
  fullName?: string;
  emailAddress?: string;
  
  // Step 2: Verification Documents
  licenseNumber?: string;
  licenseExpirationDate?: string;
  licenseDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };
  backgroundCheckDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };
  resumeDocument?: {
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  };
  
  // Step 3: Complete Profile
  certificationName?: string;
  issuingOrganization?: string;
  certificationLicenseNumber?: string;
  certificationExpirationDate?: string;
  skills?: string[];
  workExperience?: string;
  institutionName?: string;
  degree?: string;
  graduationDate?: string;
  additionalDocuments?: Array<{
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    documentType: string;
  }>;
  
  // Legacy fields
  yearsOfExperience?: number;
  specializations?: string[];
  education?: string;
  certifications?: string[];
  rating?: number;
  totalReviews?: number;
  completedJobs?: number;
  isAvailable?: boolean;
  hourlyRate?: number;
  bio?: string;
  languages?: string[];
  
  // Profile status
  completionStatus?: string;
  step1Completed?: boolean;
  step2Completed?: boolean;
  step3Completed?: boolean;
  submittedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export default function NurseReview() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [nurse, setNurse] = useState<NurseProfile | null>(null);
  const [loadingNurse, setLoadingNurse] = useState(true);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    if (id && typeof id === 'string') {
      loadNurseData(id);
    }
  }, [user, loading, id, router]);

  const loadNurseData = async (nurseId: string) => {
    try {
      setLoadingNurse(true);
      setError('');

      console.log('Loading nurse data for ID:', nurseId);

      // Get nurse details with profile data
      const nurseData = await apiService.getNurseDetails(nurseId);
      console.log('🔍 Raw nurse data received:', nurseData);
      console.log('🔍 Nurse data type:', typeof nurseData);
      console.log('🔍 Nurse data keys:', nurseData ? Object.keys(nurseData) : 'null');

      if (!nurseData) {
        throw new Error('No nurse data received from server');
      }

      // Log specific fields to debug
      console.log('🔍 Nurse name:', nurseData.name);
      console.log('🔍 Nurse email:', nurseData.email);
      console.log('🔍 Nurse fullName:', nurseData.fullName);
      console.log('🔍 Nurse emailAddress:', nurseData.emailAddress);
      console.log('🔍 Completion status:', nurseData.completionStatus);
      console.log('🔍 Step completions:', {
        step1: nurseData.step1Completed,
        step2: nurseData.step2Completed,
        step3: nurseData.step3Completed
      });

      setNurse(nurseData);
      setAdminNotes(nurseData.adminNotes || '');

      console.log('✅ Nurse data loaded successfully for:', nurseData.name || nurseData.fullName || nurseData.email);

    } catch (err: any) {
      console.error('Failed to load nurse data:', err);
      setError(`Failed to load nurse data: ${err.message || 'Please try again.'}`);
    } finally {
      setLoadingNurse(false);
    }
  };

  const handleApprove = async () => {
    if (!nurse) return;
    
    try {
      setProcessing(true);
      setError('');
      
      await apiService.verifyNurse(nurse.id);
      
      if (adminNotes.trim()) {
        await apiService.updateNurseNotes(nurse.id, adminNotes);
      }
      
      setSuccessMessage(`✅ ${nurse.name} has been approved successfully!`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to approve nurse:', err);
      setError('Failed to approve nurse. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!nurse || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    
    try {
      setProcessing(true);
      setError('');
      
      await apiService.rejectNurse(nurse.id, rejectionReason);
      
      if (adminNotes.trim()) {
        await apiService.updateNurseNotes(nurse.id, adminNotes);
      }
      
      setSuccessMessage(`❌ ${nurse.name} application has been rejected.`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to reject nurse:', err);
      setError('Failed to reject nurse. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading || loadingNurse) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!nurse) {
    return (
      <Layout title="Nurse Not Found">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nurse Not Found</h1>
          <p className="text-gray-600 mb-4">The requested nurse profile could not be found.</p>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <p className="text-gray-500 text-sm mb-8">Nurse ID: {id}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Review: ${nurse.name || nurse.fullName || nurse.email || 'Nurse'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Nurse Application Review
                </h1>
                <p className="text-gray-600">
                  Complete profile review for {nurse.name || nurse.fullName || nurse.email || 'this nurse'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  nurse.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : nurse.status === 'verified'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {nurse.status?.charAt(0).toUpperCase() + nurse.status?.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Profile Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Basic Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900 font-medium">{nurse.fullName || nurse.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{nurse.emailAddress || nurse.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{nurse.phone || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{nurse.address || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Registration Date</label>
                <p className="text-gray-900">{formatDate(nurse.createdAt)}</p>
              </div>

              {nurse.submittedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Application Submitted</label>
                  <p className="text-gray-900">{formatDate(nurse.submittedAt)}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Profile Completion Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completion Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Step 1: Basic Info</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nurse.step1Completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {nurse.step1Completed ? 'Completed' : 'Incomplete'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Step 2: Documents</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nurse.step2Completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {nurse.step2Completed ? 'Completed' : 'Incomplete'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Step 3: Profile</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nurse.step3Completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {nurse.step3Completed ? 'Completed' : 'Incomplete'}
                </span>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    nurse.completionStatus === 'submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : nurse.completionStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : nurse.completionStatus === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {nurse.completionStatus?.replace('_', ' ').toUpperCase() || 'IN PROGRESS'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Professional Stats
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-gray-900 font-medium">{nurse.yearsOfExperience || 0} years</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Rating</label>
                <p className="text-gray-900 font-medium">
                  {nurse.rating ? `${nurse.rating}/5.0` : 'No ratings yet'}
                  {nurse.totalReviews ? ` (${nurse.totalReviews} reviews)` : ''}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Completed Jobs</label>
                <p className="text-gray-900 font-medium">{nurse.completedJobs || 0}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                <p className="text-gray-900 font-medium">
                  {nurse.hourlyRate ? `$${nurse.hourlyRate}/hour` : 'Not set'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Availability</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  nurse.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {nurse.isAvailable ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* License and Certification Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            License & Certification Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nursing License */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nursing License</h3>

              <div>
                <label className="text-sm font-medium text-gray-500">License Number</label>
                <p className="text-gray-900 font-medium">{nurse.licenseNumber || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">License Expiration</label>
                <p className="text-gray-900">{formatDate(nurse.licenseExpirationDate)}</p>
              </div>
            </div>

            {/* Additional Certification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Certification</h3>

              <div>
                <label className="text-sm font-medium text-gray-500">Certification Name</label>
                <p className="text-gray-900">{nurse.certificationName || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Issuing Organization</label>
                <p className="text-gray-900">{nurse.issuingOrganization || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Certification License Number</label>
                <p className="text-gray-900">{nurse.certificationLicenseNumber || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Certification Expiration</label>
                <p className="text-gray-900">{formatDate(nurse.certificationExpirationDate)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Education and Experience */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Education & Experience
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Education</h3>

              <div>
                <label className="text-sm font-medium text-gray-500">Institution Name</label>
                <p className="text-gray-900">{nurse.institutionName || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Degree</label>
                <p className="text-gray-900">{nurse.degree || nurse.education || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Graduation Date</label>
                <p className="text-gray-900">{formatDate(nurse.graduationDate)}</p>
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Professional Experience</h3>

              <div>
                <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                <p className="text-gray-900 font-medium">{nurse.yearsOfExperience || 0} years</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Work Experience Description</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {nurse.workExperience || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {nurse.bio || 'No bio provided'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skills and Specializations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Skills & Specializations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Skills</h3>
              {nurse.skills && nurse.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nurse.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No skills listed</p>
              )}
            </div>

            {/* Specializations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Specializations</h3>
              {nurse.specializations && nurse.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nurse.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specializations listed</p>
              )}
            </div>
          </div>

          {/* Languages and Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Languages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Languages</h3>
              {nurse.languages && nurse.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nurse.languages.map((language, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No languages listed</p>
              )}
            </div>

            {/* Certifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Additional Certifications</h3>
              {nurse.certifications && nurse.certifications.length > 0 ? (
                <div className="space-y-2">
                  {nurse.certifications.map((cert, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900">{cert}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No additional certifications listed</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Documents Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Uploaded Documents
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* License Document */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                License Document
              </h3>
              {nurse.licenseDocument ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {nurse.licenseDocument.originalName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Size:</span> {formatFileSize(nurse.licenseDocument.fileSize)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {nurse.licenseDocument.fileType}
                  </p>
                  <a
                    href={nurse.licenseDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 italic">No license document uploaded</p>
              )}
            </div>

            {/* Background Check Document */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Background Check
              </h3>
              {nurse.backgroundCheckDocument ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {nurse.backgroundCheckDocument.originalName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Size:</span> {formatFileSize(nurse.backgroundCheckDocument.fileSize)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {nurse.backgroundCheckDocument.fileType}
                  </p>
                  <a
                    href={nurse.backgroundCheckDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 italic">No background check document uploaded</p>
              )}
            </div>

            {/* Resume Document */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Resume/CV
              </h3>
              {nurse.resumeDocument ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {nurse.resumeDocument.originalName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Size:</span> {formatFileSize(nurse.resumeDocument.fileSize)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {nurse.resumeDocument.fileType}
                  </p>
                  <a
                    href={nurse.resumeDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 italic">No resume document uploaded</p>
              )}
            </div>
          </div>

          {/* Additional Documents */}
          {nurse.additionalDocuments && nurse.additionalDocuments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Additional Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nurse.additionalDocuments.map((doc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{doc.documentType || 'Additional Document'}</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">File:</span> {doc.originalName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Size:</span> {formatFileSize(doc.fileSize)}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Type:</span> {doc.fileType}
                    </p>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Admin Action Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Review & Actions
          </h2>

          <div className="space-y-6">
            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Internal)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add internal notes about this nurse application..."
              />
            </div>

            {/* Existing Admin Notes */}
            {nurse.adminNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Admin Notes
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">{nurse.adminNotes}</p>
                </div>
              </div>
            )}

            {/* Rejection Reason (only show if rejecting) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (Required for rejection)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Provide a clear reason for rejection that will be communicated to the nurse..."
              />
            </div>

            {/* Previous Rejection Reason */}
            {nurse.rejectionReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Rejection Reason
                </label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-900 whitespace-pre-wrap">{nurse.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <button
                onClick={handleApprove}
                disabled={processing || nurse.status === 'verified'}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {nurse.status === 'verified' ? 'Already Approved' : 'Approve Application'}
                  </>
                )}
              </button>

              <button
                onClick={handleReject}
                disabled={processing || nurse.status === 'rejected'}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {nurse.status === 'rejected' ? 'Already Rejected' : 'Reject Application'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
