import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DocumentUpload from '../DocumentUpload';

interface Step3CompleteProfileProps {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  initialData?: Step3Data;
  loading?: boolean;
}

export interface Step3Data {
  // Certifications
  certificationName: string;
  issuingOrganization: string;
  certificationLicenseNumber: string;
  certificationExpirationDate: string;
  
  // Skills
  skills: string[];
  
  // Experience
  workExperience: string;
  
  // Education
  institutionName: string;
  degree: string;
  graduationDate: string;
  
  // Documents
  additionalDocuments: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
    documentType?: string;
  }>;
}

const availableSkills = [
  'Patient Care',
  'IV Therapy',
  'Wound Care',
  'Medication Administration',
  'Emergency Care',
  'Pediatric Care',
  'Geriatric Care',
  'Critical Care',
  'Surgical Assistance',
  'Mental Health',
  'Rehabilitation',
  'Home Health',
  'Infection Control',
  'Pain Management',
  'Cardiac Care',
  'Respiratory Care',
  'Diabetes Management',
  'Oncology Care',
  'Palliative Care',
  'Health Education'
];

export default function Step3CompleteProfile({ 
  onNext, 
  onBack, 
  initialData, 
  loading = false 
}: Step3CompleteProfileProps) {
  const [formData, setFormData] = useState<Step3Data>({
    certificationName: '',
    issuingOrganization: '',
    certificationLicenseNumber: '',
    certificationExpirationDate: '',
    skills: [],
    workExperience: '',
    institutionName: '',
    degree: '',
    graduationDate: '',
    additionalDocuments: [],
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof Step3Data, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Step3Data, boolean>>>({});
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validateField = (name: keyof Step3Data, value: any): string | undefined => {
    switch (name) {
      case 'certificationName':
        if (!value || typeof value !== 'string') return 'Certification name is required';
        if (value.trim().length < 2) return 'Certification name must be at least 2 characters';
        return undefined;
      
      case 'issuingOrganization':
        if (!value || typeof value !== 'string') return 'Issuing organization is required';
        if (value.trim().length < 2) return 'Issuing organization must be at least 2 characters';
        return undefined;
      
      case 'certificationLicenseNumber':
        if (!value || typeof value !== 'string') return 'License number is required';
        if (value.trim().length < 3) return 'License number must be at least 3 characters';
        return undefined;
      
      case 'certificationExpirationDate':
        if (!value || typeof value !== 'string') return 'Expiration date is required';
        const selectedDate = new Date(value);
        const today = new Date();
        if (selectedDate <= today) return 'Expiration date must be in the future';
        return undefined;
      
      case 'skills':
        if (!Array.isArray(value) || value.length === 0) return 'Please select at least one skill';
        return undefined;
      
      case 'workExperience':
        if (!value || typeof value !== 'string') return 'Work experience is required';
        if (value.trim().length < 10) return 'Please provide more detailed work experience';
        return undefined;
      
      case 'institutionName':
        if (!value || typeof value !== 'string') return 'Institution name is required';
        if (value.trim().length < 2) return 'Institution name must be at least 2 characters';
        return undefined;
      
      case 'degree':
        if (!value || typeof value !== 'string') return 'Degree is required';
        if (value.trim().length < 2) return 'Degree must be at least 2 characters';
        return undefined;
      
      case 'graduationDate':
        if (!value || typeof value !== 'string') return 'Graduation date is required';
        const gradDate = new Date(value);
        const currentDate = new Date();
        if (gradDate > currentDate) return 'Graduation date cannot be in the future';
        return undefined;
      
      default:
        return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof Step3Data;
    
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
    
    // Clear skills error
    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof Step3Data;
    
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step3Data, string>> = {};
    let isValid = true;

    // Validate all required fields
    const requiredFields: (keyof Step3Data)[] = [
      'certificationName',
      'issuingOrganization', 
      'certificationLicenseNumber',
      'certificationExpirationDate',
      'skills',
      'workExperience',
      'institutionName',
      'degree',
      'graduationDate'
    ];

    requiredFields.forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      certificationName: true,
      issuingOrganization: true,
      certificationLicenseNumber: true,
      certificationExpirationDate: true,
      skills: true,
      workExperience: true,
      institutionName: true,
      degree: true,
      graduationDate: true,
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Make sure additionalDocuments has the right structure
      // Transform the documents if needed to match the Step3CompleteProfileDto format
      const transformedData = {
        ...formData,
        additionalDocuments: formData.additionalDocuments.map(doc => ({
          fileName: doc.filename,
          originalName: doc.originalName,
          fileUrl: doc.url,
          fileSize: doc.size,
          fileType: doc.originalName.split('.').pop() || 'unknown',
          documentType: doc.documentType || 'certification',
        }))
      };
      
      onNext(transformedData);
    }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">
          Provide additional information about your qualifications and experience to attract more patients.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Certifications Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Certification Name */}
              <div>
                <label htmlFor="certificationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Name
                </label>
                <input
                  type="text"
                  id="certificationName"
                  name="certificationName"
                  value={formData.certificationName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.certificationName && touched.certificationName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter certification name"
                  disabled={loading}
                />
                {errors.certificationName && touched.certificationName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.certificationName}
                  </motion.p>
                )}
              </div>

              {/* Issuing Organization */}
              <div>
                <label htmlFor="issuingOrganization" className="block text-sm font-medium text-gray-700 mb-2">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  id="issuingOrganization"
                  name="issuingOrganization"
                  value={formData.issuingOrganization}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.issuingOrganization && touched.issuingOrganization
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter issuing organization"
                  disabled={loading}
                />
                {errors.issuingOrganization && touched.issuingOrganization && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.issuingOrganization}
                  </motion.p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* License Number */}
              <div>
                <label htmlFor="certificationLicenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  id="certificationLicenseNumber"
                  name="certificationLicenseNumber"
                  value={formData.certificationLicenseNumber}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.certificationLicenseNumber && touched.certificationLicenseNumber
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter license number"
                  disabled={loading}
                />
                {errors.certificationLicenseNumber && touched.certificationLicenseNumber && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.certificationLicenseNumber}
                  </motion.p>
                )}
              </div>

              {/* Expiration Date */}
              <div>
                <label htmlFor="certificationExpirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  id="certificationExpirationDate"
                  name="certificationExpirationDate"
                  value={formData.certificationExpirationDate}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.certificationExpirationDate && touched.certificationExpirationDate
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  disabled={loading}
                />
                {errors.certificationExpirationDate && touched.certificationExpirationDate && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.certificationExpirationDate}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Skills
              </label>
              <div
                className={`w-full px-4 py-3 bg-gray-50 border rounded-md cursor-pointer focus:outline-none focus:ring-2 transition-colors ${
                  errors.skills && touched.skills
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
              >
                {formData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Choose skills</span>
                )}
              </div>
              
              {skillsDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availableSkills.map((skill) => (
                    <div
                      key={skill}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        formData.skills.includes(skill) ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        {skill}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.skills && touched.skills && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.skills}
                </motion.p>
              )}
            </div>
          </div>

          {/* Experience Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience</h3>
            <div>
              <label htmlFor="workExperience" className="block text-sm font-medium text-gray-700 mb-2">
                Work Experience
              </label>
              <textarea
                id="workExperience"
                name="workExperience"
                value={formData.workExperience}
                onChange={handleInputChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors resize-none ${
                  errors.workExperience && touched.workExperience
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Describe your work experience, specializations, and achievements..."
                disabled={loading}
              />
              {errors.workExperience && touched.workExperience && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.workExperience}
                </motion.p>
              )}
            </div>
          </div>

          {/* Education Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Institution Name */}
              <div>
                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.institutionName && touched.institutionName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter institution name"
                  disabled={loading}
                />
                {errors.institutionName && touched.institutionName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.institutionName}
                  </motion.p>
                )}
              </div>

              {/* Degree */}
              <div>
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  id="degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    errors.degree && touched.degree
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter degree"
                  disabled={loading}
                />
                {errors.degree && touched.degree && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm mt-1"
                  >
                    {errors.degree}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Graduation Date */}
            <div>
              <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700 mb-2">
                Graduation Date
              </label>
              <input
                type="date"
                id="graduationDate"
                name="graduationDate"
                value={formData.graduationDate}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  errors.graduationDate && touched.graduationDate
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={loading}
              />
              {errors.graduationDate && touched.graduationDate && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-1"
                >
                  {errors.graduationDate}
                </motion.p>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
            <DocumentUpload
              onDocumentsChange={(documents) => {
                setFormData(prev => ({ ...prev, additionalDocuments: documents }));
              }}
              initialDocuments={formData.additionalDocuments}
              disabled={loading}
              maxDocuments={5}
              maxSizePerDocument={10} // 10MB
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
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
