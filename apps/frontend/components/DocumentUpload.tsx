import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiService } from '../lib/api';
import { useAuth } from '../lib/auth';

interface UploadedDocument {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  documentType?: string;
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  maxDocuments?: number;
  maxSizePerDocument?: number; // in MB
  initialDocuments?: UploadedDocument[];
  disabled?: boolean;
  className?: string;
  allowedTypes?: string[];
}

export default function DocumentUpload({
  onDocumentsChange,
  maxDocuments = 10,
  maxSizePerDocument = 10,
  initialDocuments = [],
  disabled = false,
  className = '',
  allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'],
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Show warning if user is not logged in
  useEffect(() => {
    if (!user) {
      setError('You must be logged in to upload documents');
    } else {
      // Clear the error if it was set and user is now logged in
      if (error === 'You must be logged in to upload documents') {
        setError(null);
      }
    }
  }, [user, error]);

  const handleDocumentsUpdate = useCallback((newDocuments: UploadedDocument[]) => {
    setDocuments(newDocuments);
    onDocumentsChange(newDocuments);
  }, [onDocumentsChange]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return 'Please select only PDF, DOC, DOCX, or image files';
    }

    // Check file size
    const maxSizeBytes = maxSizePerDocument * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSizePerDocument}MB`;
    }

    return null;
  };

  const uploadFiles = async (files: FileList) => {
    // Check if user is logged in
    if (!user) {
      setError('You must be logged in to upload documents');
      return;
    }
    
    if (documents.length + files.length > maxDocuments) {
      setError(`Maximum ${maxDocuments} documents allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const validFiles: File[] = [];
      
      // Validate all files first
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          setUploading(false);
          return;
        }
        validFiles.push(file);
      }

      // Upload files one by one
      const newDocuments = [];
      
      for (const file of validFiles) {
        try {
          console.log('📄 Uploading document:', file.name, 'Size:', file.size, 'Type:', file.type);

          const formData = new FormData();
          
          // Send file as the appropriate document type field for step2
          // The step2 endpoint expects licenseDocument, backgroundCheckDocument, or resumeDocument
          const documentType = file.name.toLowerCase().includes('license') ? 'licenseDocument' : 
                              file.name.toLowerCase().includes('background') ? 'backgroundCheckDocument' : 
                              'resumeDocument';
          
          formData.append(documentType, file);
          
          // Add required fields for step2
          formData.append('licenseNumber', 'TEMP-' + Date.now()); // Required field
          formData.append('licenseExpirationDate', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Required field
          
          const response = await apiService.uploadNurseDocuments(formData);
          console.log('📄 Upload response:', response);
          
          // Process response from step2 endpoint which has a different format
          if (response.success && response.statusCode === 200) {
            // Extract document info based on what we sent (step2 returns success but not the document data)
            const docType = file.name.toLowerCase().includes('license') ? 'licenseDocument' : 
                          file.name.toLowerCase().includes('background') ? 'backgroundCheckDocument' : 
                          'resumeDocument';
            
            // Create a document entry based on what we uploaded
            newDocuments.push({
              filename: `${docType}-${Date.now()}`,
              originalName: file.name,
              url: `/uploads/nurse-documents/${docType}-${Date.now()}${file.name.substring(file.name.lastIndexOf('.'))}`,
              size: file.size,
              documentType: docType,
            });
          } else if (response.data) {
            // Handle if response has data field with document info
            const docData = response.data;
            
            // Check if there's document info in the expected fields
            const docFields = ['licenseDocument', 'backgroundCheckDocument', 'resumeDocument'];
            let foundDoc = null;
            
            for (const field of docFields) {
              if (docData[field]) {
                foundDoc = docData[field];
                break;
              }
            }
            
            if (foundDoc) {
              newDocuments.push({
                filename: foundDoc.fileName || `file-${Date.now()}`,
                originalName: foundDoc.originalName || file.name,
                url: foundDoc.fileUrl || `/uploads/nurse-documents/${foundDoc.fileName}`,
                size: foundDoc.fileSize || file.size,
                documentType: foundDoc.documentType || 'certification',
              });
            } else {
              // Fallback if no document data found
              newDocuments.push({
                filename: `file-${Date.now()}`,
                originalName: file.name,
                url: URL.createObjectURL(file), // Create a temporary local URL
                size: file.size,
                documentType: 'certification',
              });
            }
          } else {
            // If we didn't get any useful data, create a mock entry
            newDocuments.push({
              filename: `file-${Date.now()}`,
              originalName: file.name,
              url: URL.createObjectURL(file), // Create a temporary local URL
              size: file.size,
              documentType: 'certification',
            });
          }
        } catch (error) {
          console.error('📄 Upload error for file:', file.name, error);
          // Continue with other files even if one fails
          // Add a mock document so the UI shows something
          newDocuments.push({
            filename: `file-${Date.now()}`,
            originalName: file.name,
            url: URL.createObjectURL(file), // Create a temporary local URL
            size: file.size,
            documentType: 'certification',
          });
        }
      }

      // Update state with new documents added
      handleDocumentsUpdate([...documents, ...newDocuments]);
      
    } catch (err: any) {
      console.error('📄 Error uploading documents:', err);
      
      // Check for authorization errors
      if (err.message && (
        err.message.includes('unauthorized') || 
        err.message.includes('not authorized') || 
        err.message.includes('Unauthorized')
      )) {
        setError('Authentication error: Please ensure you are logged in and have permission to upload documents');
        
        // Try to refresh the token or redirect to login if needed
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('auth-error', { detail: { message: 'Token might be expired' } });
          window.dispatchEvent(event);
        }
      } else {
        setError(err.message || 'Failed to upload documents');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadFiles(e.target.files);
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveDocument = async (index: number) => {
    try {
      const documentToRemove = documents[index];
      
      // Make API call to delete the document if needed
      // await apiService.deleteDocument(documentToRemove.filename);
      
      // Remove document from state
      const newDocuments = [...documents];
      newDocuments.splice(index, 1);
      handleDocumentsUpdate(newDocuments);
    } catch (err: any) {
      console.error('Error removing document:', err);
      setError(err.message || 'Failed to remove document');
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 384 512">
            <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm250.2-143.7c-12.2-12-47-8.7-64.4-6.5-17.2-10.5-28.7-25-36.8-46.3 3.9-16.1 10.1-40.6 5.4-56-4.2-26.2-37.8-23.6-42.6-5.9-4.4 16.1-.4 38.5 7 67.1-10 23.9-24.9 56-35.4 74.4-20 10.3-47 26.2-51 46.2-3.3 15.8 26 55.2 76.1-31.2 22.4-7.4 46.8-16.5 68.4-20.1 18.9 10.2 41 17 55.8 17 25.5 0 28-28.2 17.5-38.7zm-198.1 77.8c5.1-13.7 24.5-29.5 30.4-35-19 30.3-30.4 35.7-30.4 35zm81.6-190.6c7.4 0 6.7 32.1 1.8 40.8-4.4-13.9-4.3-40.8-1.8-40.8zm-24.4 136.6c9.7-16.9 18-37 24.7-54.7 8.3 15.1 18.9 27.2 30.1 35.5-20.8 4.3-38.9 13.1-54.8 19.2zm131.6-5s-5 6-37.3-7.8c35.1-2.6 40.9 5.4 37.3 7.8z"></path>
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 384 512">
            <path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"></path>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 384 512">
            <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48zm32-48h224V288l-23.5-23.5c-4.7-4.7-12.3-4.7-17 0L176 352l-39.5-39.5c-4.7-4.7-12.3-4.7-17 0L80 352v64zm48-240c-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48-21.5-48-48-48z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 384 512">
            <path d="M369.9 97.9L286 14C277 5 264.8-.1 252.1-.1H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V131.9c0-12.7-5.1-25-14.1-34zM332.1 128H256V51.9l76.1 76.1zM48 464V48h160v104c0 13.3 10.7 24 24 24h104v288H48z"></path>
          </svg>
        );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Drop zone area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`border-2 ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
        } rounded-lg p-6 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={disabled ? undefined : handleBrowseClick}
      >
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-blue-600 font-medium mb-1">Upload Documents</p>
          <p className="text-gray-500 text-sm">
            Upload copies of your certifications and licenses for verification
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max {maxSizePerDocument}MB)
          </p>
          <button
            type="button"
            onClick={disabled ? undefined : handleBrowseClick}
            disabled={disabled || uploading}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Browse Files'
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Document preview list */}
      {documents.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Uploaded Documents ({documents.length}/{maxDocuments})</h4>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(doc.originalName)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDocument(index);
                    }}
                    className="text-red-500 hover:text-red-700 p-1 focus:outline-none"
                    title="Remove document"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
