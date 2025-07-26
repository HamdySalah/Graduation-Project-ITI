import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import apiService from '../../lib/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PendingNurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  address?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  createdAt: string;
  licenseNumber: string;
  yearsOfExperience: number;
  specializations: string[];
  education: string;
  certifications: string[];
  documents: string[]
  hourlyRate: number;
  bio: string;
  languages: string[];
}

export default function NurseApprovals() {
  const [pendingNurses, setPendingNurses] = useState<PendingNurse[]>([]);
  const [filteredNurses, setFilteredNurses] = useState<PendingNurse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [processingId, setProcessingId] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<{url: string, type: string, name: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const router = useRouter();

  const loadPendingNurses = async () => {
    try {
      setError('');
      setLoadingData(true);

      const nurses = await apiService.getPendingNurses();
      console.log("Pending nurses data:", nurses);
      const nursesArray = Array.isArray(nurses) ? nurses : [];
      setPendingNurses(nursesArray);
      setFilteredNurses(nursesArray);
    } catch (err: any) {
      console.error("Error loading pending nurses:", err);
      setError(`Failed to load pending nurses: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  // Filter nurses based on search term
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredNurses(pendingNurses);
    } else {
      const filtered = pendingNurses.filter(nurse =>
        nurse.name?.toLowerCase().includes(term.toLowerCase()) ||
        nurse.email?.toLowerCase().includes(term.toLowerCase()) ||
        nurse.phone?.includes(term) ||
        nurse.licenseNumber?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredNurses(filtered);
    }
  };

  // Function to handle document preview
  const handlePreviewDocument = (documentUrl: string, documentType: string, documentName: string) => {
    setPreviewDocument({
      url: documentUrl,
      type: documentType || 'application/octet-stream',
      name: documentName || 'Document'
    });
  };

  const handleApprove = async (nurseId: string, nurseName: string) => {
    try {
      setError('');
      setSuccessMessage('');
      setProcessingId(nurseId);

      await apiService.verifyNurse(nurseId);
      setSuccessMessage(`✅ ${nurseName} has been approved successfully!`);

      // Remove from both lists with animation
      setTimeout(() => {
        setPendingNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
        setFilteredNurses(prev => prev.filter(nurse => nurse.id !== nurseId));
      }, 1000);

    } catch (err: any) {
      setError(`Failed to approve nurse: ${err.message}`);
    } finally {
      setProcessingId('');
    }
  };

  const handleReject = async (nurseId: string, nurseName: string) => {
    // Navigate to the detailed view for rejection with reason
    router.push(`/admin/nurse-review?id=${nurseId}&action=reject`);
  };

  useEffect(() => {
    loadPendingNurses();
  }, []);

  const handleViewDetails = (nurseId: string) => {
    router.push(`/admin/nurse-review?id=${nurseId}`);
  };

  // Function to close the document preview modal
  const closePreview = () => {
    setPreviewDocument(null);
  };

  return (
    <AdminLayout title="Nurse Approvals">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Document Preview Modal */}
          <AnimatePresence>
            {previewDocument && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={closePreview}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {previewDocument.name}
                    </h3>
                    <button 
                      onClick={closePreview}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4 flex justify-center items-center bg-gray-50 h-[70vh] overflow-auto">
                    {previewDocument.type.includes('pdf') ? (
                      <div className="w-full h-full">
                        <iframe
                          src={`${previewDocument.url}#toolbar=0`}
                          className="w-full h-full rounded border border-gray-200"
                          title={previewDocument.name}
                        />
                      </div>
                    ) : previewDocument.type.includes('image') ? (
                      <div className="relative h-full w-full flex items-center justify-center">
                        <img
                          src={previewDocument.url}
                          alt={previewDocument.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600">
                          This document cannot be previewed. 
                        </p>
                        <a 
                          href={previewDocument.url} 
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Download Document
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    🏥 Nurse Approvals
                  </h1>
                  <p className="text-gray-600">
                    Review and approve nurse applications for the platform
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`${filteredNurses.length > 0 ? 'bg-orange-100' : 'bg-blue-100'} rounded-lg p-3`}>
                    <svg className={`w-6 h-6 ${filteredNurses.length > 0 ? 'text-orange-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${filteredNurses.length > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                      {filteredNurses.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      {searchTerm ? 'filtered' : 'pending'}
                    </div>
                    {filteredNurses.length > 0 && !searchTerm && (
                      <div className="text-xs text-orange-600 font-medium animate-pulse">
                        Needs review!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or license number..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="mt-2 text-sm text-gray-600">
                    Showing {filteredNurses.length} of {pendingNurses.length} nurses
                  </p>
                )}
              </div>
            </div>
          </motion.div>

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

          {/* Loading State */}
          {loadingData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNurses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white rounded-lg shadow-sm p-12">
                <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? '🔍 No Results Found' : '🎉 All Applications Reviewed!'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? `No nurses found matching "${searchTerm}". Try a different search term.`
                    : 'No pending nurse applications at the moment.'
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch('')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredNurses.map((nurse, index) => (
                  <motion.div
                    key={nurse.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className="p-6">
                      {/* Nurse Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {nurse.name?.charAt(0) || 'N'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{nurse.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500">{nurse.email}</p>
                          </div>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>

                      {/* Nurse Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {nurse.phone || 'No phone'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          License: {nurse.licenseNumber || 'Not provided'}
                          {nurse.documents?.length > 0 && (
                            <button 
                              onClick={() => handlePreviewDocument(
                                nurse.documents[0],
                                nurse.documents[0].includes('.pdf') ? 'application/pdf' : 'image/jpeg',
                                'License Document'
                              )}
                              className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-xs"
                            >
                              View
                            </button>
                          )}
                        </div>
                        {nurse.yearsOfExperience && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {nurse.yearsOfExperience || 0} years experience
                          </div>
                        )}
                        {nurse.hourlyRate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            ${nurse.hourlyRate || 'Not set'}/hour
                          </div>
                        )}
                      </div>

                      {/* Documents */}
                      {nurse.documents && nurse.documents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">DOCUMENTS</p>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <button
                              onClick={() => handleViewDetails(nurse.id)}
                              className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View All Documents ({nurse.documents.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Specializations */}
                      {nurse.specializations && nurse.specializations.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-medium text-gray-500 mb-2">SPECIALIZATIONS</p>
                          <div className="flex flex-wrap gap-1">
                            {nurse.specializations.slice(0, 3).map((spec) => (
                              <span
                                key={spec}
                                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                            {nurse.specializations.length > 3 && (
                              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                +{nurse.specializations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleViewDetails(nurse.id)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
                        >
                          View Details
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleApprove(nurse.id, nurse.name)}
                          disabled={processingId === nurse.id}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === nurse.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            'Approve'
                          )}
                        </motion.button>
                      </div>
                      <div className="mt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleReject(nurse.id, nurse.name)}
                          disabled={processingId === nurse.id}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
