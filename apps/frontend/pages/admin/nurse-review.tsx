import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import Layout from '../../components/Layout';
import { apiService } from '../../lib/api';

const APPROVAL_CHECKLIST = [
  'Verify License',
  'Review Resume',
  'Check References',
  'Background Check',
];

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

      // Provide more specific error messages
      let errorMessage = 'Failed to load nurse data. ';

      if (err.message?.includes('fetch')) {
        errorMessage += 'Unable to connect to server. Please check if the backend is running.';
      } else if (err.message?.includes('Validation failed')) {
        errorMessage += 'Authentication required. Please make sure you are logged in as an admin.';
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        errorMessage += 'You are not authorized to view this page. Please log in as an admin.';
      } else if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        errorMessage += 'The requested nurse profile was not found.';
      } else {
        errorMessage += err.message || 'Please try again.';
      }

      setError(errorMessage);
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
    <Layout title="Nurse Approval">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Nurse Details Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold">
              {nurse.fullName?.split(' ').map(n => n[0]).join('') || nurse.name?.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{nurse.fullName || nurse.name}</h2>
            <div className="text-gray-600 mb-2">{nurse.yearsOfExperience ? `${nurse.yearsOfExperience} years experience` : ''}</div>
            <div className="text-gray-500 text-sm mb-2">Status: <span className="font-medium">{nurse.status}</span></div>
            <div className="text-gray-500 text-sm mb-2">Email: {nurse.emailAddress || nurse.email}</div>
            <div className="text-gray-500 text-sm mb-2">Phone: {nurse.phone}</div>
            <div className="text-gray-500 text-sm mb-2">Registered: {formatDate(nurse.createdAt)}</div>
            <div className="text-gray-500 text-sm mb-2">Specializations: {nurse.specializations?.join(', ')}</div>
            <div className="text-gray-500 text-sm mb-2">Languages: {nurse.languages?.join(', ')}</div>
            <div className="text-gray-500 text-sm mb-2">Hourly Rate: {nurse.hourlyRate} EGP</div>
            <div className="text-gray-500 text-sm mb-2">Bio: {nurse.bio}</div>
          </div>
        </div>

        {/* Document Review Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2 text-lg">Document Review</h3>
          <div className="flex gap-6 flex-wrap">
            {nurse.licenseDocument && (
              <div className="w-40 h-40 bg-gray-100 rounded shadow flex flex-col items-center justify-center">
                <img src={nurse.licenseDocument.fileUrl} alt="License" className="h-24 mb-2" />
                <div className="text-xs text-gray-700">License</div>
              </div>
            )}
            {nurse.resumeDocument && (
              <div className="w-40 h-40 bg-gray-100 rounded shadow flex flex-col items-center justify-center">
                <img src={nurse.resumeDocument.fileUrl} alt="Resume" className="h-24 mb-2" />
                <div className="text-xs text-gray-700">Resume</div>
              </div>
            )}
            {nurse.backgroundCheckDocument && (
              <div className="w-40 h-40 bg-gray-100 rounded shadow flex flex-col items-center justify-center">
                <img src={nurse.backgroundCheckDocument.fileUrl} alt="Background Check" className="h-24 mb-2" />
                <div className="text-xs text-gray-700">Background Check</div>
              </div>
            )}
            {nurse.additionalDocuments?.map((doc, idx) => (
              <div key={idx} className="w-40 h-40 bg-gray-100 rounded shadow flex flex-col items-center justify-center">
                <img src={doc.fileUrl} alt={doc.documentType || doc.originalName} className="h-24 mb-2" />
                <div className="text-xs text-gray-700">{doc.documentType || doc.originalName}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Checklist Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2 text-lg">Approval Checklist</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {APPROVAL_CHECKLIST.map((item, idx) => (
              <label key={idx} className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600" /> {item}
              </label>
            ))}
          </div>
        </div>

        {/* Admin Notes & Actions */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            placeholder="Add any notes for this application..."
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (if rejecting)</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
          />
          <div className="flex gap-4">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleApprove}
              disabled={processing}
            >
              Approve
            </button>
            <button
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 disabled:opacity-50"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
