import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Step2VerificationDocumentsProps {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  initialData?: Step2Data;
  loading?: boolean;
}

export interface Step2Data {
  licenseNumber: string;
  licenseExpirationDate: string;
  licenseDocument?: File;
  backgroundCheckDocument?: File;
  resumeDocument?: File;
}

export default function Step2VerificationDocuments({ 
  onNext, 
  onBack, 
  initialData, 
  loading = false 
}: Step2VerificationDocumentsProps) {
  const [formData, setFormData] = useState<Step2Data>({
    licenseNumber: '',
    licenseExpirationDate: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Step2Data, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step2Data, boolean>>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateField = (name: keyof Step2Data, value: string | File | undefined): string | undefined => {
    switch (name) {
      case 'licenseNumber':
        if (!value || typeof value !== 'string') return 'License number is required';
        if (value.trim().length < 3) return 'License number must be at least 3 characters';
        return undefined;
      
      case 'licenseExpirationDate':
        if (!value || typeof value !== 'string') return 'License expiration date is required';
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate <= today) return 'License expiration date must be in the future';
        return undefined;
      
      case 'licenseDocument':
        if (!value) return 'License copy is required';
        if (value instanceof File) {
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedTypes.includes(value.type)) {
            return 'Only PDF, JPG, PNG files are allowed';
          }
          if (value.size > 5 * 1024 * 1024) { // 5MB
            return 'File size must be less than 5MB';
          }
        }
        return undefined;
      
      case 'backgroundCheckDocument':
        if (!value) return 'Experience or Recommendation report is required';
        if (value instanceof File) {
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedTypes.includes(value.type)) {
            return 'Only PDF, JPG, PNG files are allowed';
          }
          if (value.size > 5 * 1024 * 1024) { // 5MB
            return 'File size must be less than 5MB';
          }
        }
        return undefined;
      
      case 'resumeDocument':
        if (!value) return 'Resume is required';
        if (value instanceof File) {
          const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
          if (!allowedTypes.includes(value.type)) {
            return 'Only PDF, DOC, DOCX files are allowed';
          }
          if (value.size > 5 * 1024 * 1024) { // 5MB
            return 'File size must be less than 5MB';
          }
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof Step2Data;
    
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Step2Data) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setFormData(prev => ({ ...prev, [fieldName]: file }));
      
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fieldName]: 0 }));
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fieldName] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [fieldName]: currentProgress + 10 };
        });
      }, 100);
    }
    
    // Clear error when file is selected
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof Step2Data;
    
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step2Data, string>> = {};
    let isValid = true;

    // Validate text fields
    const textFields: (keyof Step2Data)[] = ['licenseNumber', 'licenseExpirationDate'];
    textFields.forEach(key => {
      const error = validateField(key, formData[key] as string);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    // Validate file fields
    const fileFields: (keyof Step2Data)[] = ['licenseDocument', 'backgroundCheckDocument', 'resumeDocument'];
    fileFields.forEach(key => {
      const error = validateField(key, formData[key] as File);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      licenseNumber: true,
      licenseExpirationDate: true,
      licenseDocument: true,
      backgroundCheckDocument: true,
      resumeDocument: true,
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext(formData);
    }
  };

  const FileUploadField = ({ 
    fieldName, 
    label, 
    acceptedFormats, 
    description 
  }: { 
    fieldName: keyof Step2Data; 
    label: string; 
    acceptedFormats: string;
    description: string;
  }) => {
    const file = formData[fieldName] as File | undefined;
    const progress = uploadProgress[fieldName];
    const error = errors[fieldName];
    const isTouched = touched[fieldName];

    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id={fieldName}
            onChange={(e) => handleFileChange(e, fieldName)}
            className="hidden"
            accept={acceptedFormats}
            disabled={loading}
          />
          <label
            htmlFor={fieldName}
            className="cursor-pointer flex flex-col items-center"
          >
            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {file ? (
              <div className="text-sm">
                <p className="text-green-600 font-medium">{file.name}</p>
                <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-blue-600 font-medium">Choose File</p>
                <p className="text-gray-500">{description}</p>
              </div>
            )}
          </label>
          
          {progress !== undefined && progress < 100 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-1">{acceptedFormats}</p>
        
        {error && isTouched && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Documents</h2>
        <p className="text-gray-600">
          Please upload the required documents to complete your profile verification.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* License Verification Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">License Verification</h3>
            
            {/* License Number */}
            <div className="mb-4">
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.licenseNumber && touched.licenseNumber
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter your license number"
                disabled={loading}
              />
              {errors.licenseNumber && touched.licenseNumber && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.licenseNumber}
                </motion.p>
              )}
            </div>

            {/* License Expiration Date */}
            <div className="mb-4">
              <label htmlFor="licenseExpirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                License Expiration Date
              </label>
              <input
                type="date"
                id="licenseExpirationDate"
                name="licenseExpirationDate"
                value={formData.licenseExpirationDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.licenseExpirationDate && touched.licenseExpirationDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={loading}
              />
              {errors.licenseExpirationDate && touched.licenseExpirationDate && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.licenseExpirationDate}
                </motion.p>
              )}
            </div>

            {/* Upload License Copy */}
            <FileUploadField
              fieldName="licenseDocument"
              label="Upload License Copy"
              acceptedFormats="Accepted formats: PDF, JPG, PNG. Max size: 5MB"
              description="Upload a clear copy of your nursing license"
            />
          </div>

          {/* Background Check Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience or Recommendation</h3>
            <FileUploadField
              fieldName="backgroundCheckDocument"
              label="Upload Experience or Recommendation Report"
              acceptedFormats="Accepted formats: PDF, JPG, PNG. Max size: 5MB"
              description="Upload your Experience or Recommendation report"
            />
          </div>

          {/* Resume Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resume</h3>
            <FileUploadField
              fieldName="resumeDocument"
              label="Upload Resume"
              acceptedFormats="Accepted formats: PDF, DOC, DOCX. Max size: 5MB"
              description="Upload your current resume"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Submit Documents'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
