import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiService } from '../../../lib/api';
import AdminLayout from '../../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';

const APPROVAL_CHECKLIST = [
  'Verify License',
  'Review Resume',
  'Check References',
  'Background Check',
];

interface Document {
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  documentType?: string;
}

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
  licenseDocument?: Document;
  backgroundCheckDocument?: Document;
  resumeDocument?: Document;
  
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
  additionalDocuments?: Document[];
  
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

export default function NurseReviewDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [nurse, setNurse] = useState<NurseProfile | null>(null);
  const [loadingNurse, setLoadingNurse] = useState(true);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Get all nurse documents as an array
  const getAllDocuments = (nurse: NurseProfile): Document[] => {
    const documents: Document[] = [];
    
    if (nurse.licenseDocument) {
      documents.push({...nurse.licenseDocument, documentType: 'License'});
    }
    
    if (nurse.resumeDocument) {
      documents.push({...nurse.resumeDocument, documentType: 'Resume'});
    }
    
    if (nurse.backgroundCheckDocument) {
      documents.push({...nurse.backgroundCheckDocument, documentType: 'Background Check'});
    }
    
    if (nurse.additionalDocuments && nurse.additionalDocuments.length > 0) {
      documents.push(...nurse.additionalDocuments);
    }
    
    return documents;
  };

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadNurseData(id);
    }
  }, [id]);

  const loadNurseData = async (nurseId: string) => {
    try {
      setLoadingNurse(true);
      setError('');

      console.log('Loading nurse data for ID:', nurseId);

      // Get nurse details with profile data
      const nurseData = await apiService.getNurseDetails(nurseId);
      console.log('Nurse data received:', nurseData);

      if (!nurseData) {
        throw new Error('No nurse data received from server');
      }

      setNurse(nurseData);
      setAdminNotes(nurseData.adminNotes || '');
      
      // Initialize checklist
      const initialChecklist: Record<string, boolean> = {};
      APPROVAL_CHECKLIST.forEach(item => {
        initialChecklist[item] = false;
      });
      setChecklist(initialChecklist);
      
    } catch (err: any) {
      console.error('Failed to load nurse data:', err);
      setError(`Failed to load nurse data: ${err.message}`);
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
      
      setSuccessMessage(`✅ ${nurse.name || nurse.fullName} has been approved successfully!`);
      
      setTimeout(() => {
        router.push('/admin/nurse-approvals');
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to approve nurse:', err);
      setError(`Failed to approve nurse: ${err.message}`);
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
      
      setSuccessMessage(`❌ ${nurse.name || nurse.fullName}'s application has been rejected.`);
      
      setTimeout(() => {
        router.push('/admin/nurse-approvals');
      }, 2000);
      
    } catch (err: any) {
      console.error('Failed to reject nurse:', err);
      setError(`Failed to reject nurse: ${err.message}`);
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

  const handleChecklistChange = (item: string, checked: boolean) => {
    setChecklist(prev => ({...prev, [item]: checked}));
  };
  
  const openDocument = (doc: Document) => {
    setSelectedDocument(doc);
  };
  
  const closeDocumentViewer = () => {
    setSelectedDocument(null);
  };

  if (loadingNurse) {
    return (
      <AdminLayout title="Loading Nurse Details">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!nurse) {
    return (
      <AdminLayout title="Nurse Not Found">
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
            onClick={() => router.push('/admin/nurse-approvals')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Nurse Approvals
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Nurse Profile Review">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
            >
              <p className="text-red-600">{error}</p>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <p className="text-green-600">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nurse Details Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                {nurse.fullName?.charAt(0) || nurse.name?.charAt(0) || 'N'}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full mb-2">
                Status: {nurse.status || 'Pending'}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{nurse.fullName || nurse.name}</h2>
              <div className="text-gray-500 text-sm md:text-base space-y-1">
                <p><span className="font-medium">Email:</span> {nurse.emailAddress || nurse.email}</p>
                <p><span className="font-medium">Phone:</span> {nurse.phone || 'Not provided'}</p>
                <p><span className="font-medium">Registered:</span> {formatDate(nurse.createdAt)}</p>
                {nurse.licenseNumber && (
                  <p><span className="font-medium">License Number:</span> {nurse.licenseNumber}</p>
                )}
                {nurse.yearsOfExperience && (
                  <p><span className="font-medium">Experience:</span> {nurse.yearsOfExperience} years</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completion Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Profile Completion</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Step 1: Basic Info</span>
                    <span className="text-sm font-medium text-gray-700">
                      {nurse.step1Completed ? '100%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${nurse.step1Completed ? 'bg-green-600' : 'bg-gray-300'}`}
                      style={{ width: nurse.step1Completed ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Step 2: Documents</span>
                    <span className="text-sm font-medium text-gray-700">
                      {nurse.step2Completed ? '100%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${nurse.step2Completed ? 'bg-green-600' : 'bg-gray-300'}`}
                      style={{ width: nurse.step2Completed ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Step 3: Profile</span>
                    <span className="text-sm font-medium text-gray-700">
                      {nurse.step3Completed ? '100%' : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${nurse.step3Completed ? 'bg-green-600' : 'bg-gray-300'}`}
                      style={{ width: nurse.step3Completed ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Information</h3>
              <div className="space-y-3">
                {nurse.specializations && nurse.specializations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Specializations:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {nurse.specializations.map((spec) => (
                        <span key={spec} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {nurse.skills && nurse.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Skills:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {nurse.skills.map((skill, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {nurse.languages && nurse.languages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Languages:</p>
                    <p className="text-sm text-gray-600">{nurse.languages.join(', ')}</p>
                  </div>
                )}
                
                {nurse.hourlyRate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hourly Rate:</p>
                    <p className="text-sm text-gray-600">${nurse.hourlyRate} / hour</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Education & Experience</h3>
              <div className="space-y-3">
                {nurse.education && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Education:</p>
                    <p className="text-sm text-gray-600">{nurse.education}</p>
                  </div>
                )}
                
                {nurse.institutionName && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Institution:</p>
                    <p className="text-sm text-gray-600">{nurse.institutionName}</p>
                  </div>
                )}
                
                {nurse.degree && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Degree:</p>
                    <p className="text-sm text-gray-600">{nurse.degree}</p>
                  </div>
                )}
                
                {nurse.graduationDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Graduation Date:</p>
                    <p className="text-sm text-gray-600">{formatDate(nurse.graduationDate)}</p>
                  </div>
                )}
                
                {nurse.workExperience && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Work Experience:</p>
                    <p className="text-sm text-gray-600">{nurse.workExperience}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {nurse.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">About</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{nurse.bio}</p>
            </div>
          )}
        </div>

        {/* Document Review Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Document Review</h3>
          
          {/* Document Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {getAllDocuments(nurse).map((doc, idx) => (
              <div 
                key={idx}
                onClick={() => openDocument(doc)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Document Icon based on type */}
                {doc.fileType.includes('pdf') ? (
                  <svg className="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : doc.fileType.includes('image') ? (
                  <img 
                    src={doc.fileUrl} 
                    alt={doc.documentType || doc.originalName}
                    className="h-24 w-24 object-cover rounded mb-2"
                  />
                ) : (
                  <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                
                <p className="text-sm font-medium text-gray-700 text-center truncate w-full">
                  {doc.documentType || doc.originalName.split('.')[0]}
                </p>
                <p className="text-xs text-gray-500">Click to view</p>
              </div>
            ))}
            
            {getAllDocuments(nurse).length === 0 && (
              <div className="col-span-full text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-600">No documents available for review</p>
              </div>
            )}
          </div>
          
          {/* Document Viewer Modal */}
          {selectedDocument && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDocument.documentType || selectedDocument.originalName}
                  </h3>
                  <button 
                    onClick={closeDocumentViewer}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                  {selectedDocument.fileType.includes('pdf') ? (
                    <iframe 
                      src={selectedDocument.fileUrl} 
                      className="w-full h-full min-h-[70vh]"
                      title={selectedDocument.originalName}
                    />
                  ) : selectedDocument.fileType.includes('image') ? (
                    <img 
                      src={selectedDocument.fileUrl}
                      alt={selectedDocument.originalName}
                      className="max-w-full max-h-[70vh] mx-auto"
                    />
                  ) : (
                    <div className="text-center p-12">
                      <p>Preview not available for this file type.</p>
                      <a 
                        href={selectedDocument.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Download File
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Original filename: {selectedDocument.originalName}
                      </p>
                      <p className="text-sm text-gray-600">
                        File type: {selectedDocument.fileType}
                      </p>
                    </div>
                    <a 
                      href={selectedDocument.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Approval Checklist Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-lg">Approval Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
              {APPROVAL_CHECKLIST.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-blue-600 rounded" 
                    checked={checklist[item] || false}
                    onChange={(e) => handleChecklistChange(item, e.target.checked)}
                  /> 
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Admin Notes & Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Decision</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Internal Only)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this application..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (will be sent to the nurse)..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
                onClick={() => router.push('/admin/nurse-approvals')}
                disabled={processing}
              >
                Back to List
              </button>
              
              <button
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Approve Nurse'
                )}
              </button>
              
              <button
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Processing...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
