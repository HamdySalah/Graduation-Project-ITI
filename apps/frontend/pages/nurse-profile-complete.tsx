import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import Layout from '../components/Layout';
import Step1BasicInfo, { Step1Data } from '../components/profile-completion/Step1BasicInfo';
import NurseProtectedRoute from '../components/NurseProtectedRoute';

interface ProfileCompletionStatus {
  status: string;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  submittedAt?: string;
}

interface ProfileCompletionData {
  step1?: Step1Data;
  step2?: any;
  step3?: any;
}

export default function NurseProfileCompletion() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileStatus, setProfileStatus] = useState<ProfileCompletionStatus | null>(null);
  const [formData, setFormData] = useState<ProfileCompletionData>({});

  // Check if user is nurse and redirect if not
  useEffect(() => {
    if (!user) return;

    if (user.role !== 'nurse') {
      router.replace('/dashboard');
      return;
    }

    // If user is already verified, redirect to dashboard
    if (user.status === 'verified') {
      router.replace('/dashboard');
      return;
    }

    // For now, just set initial status - we'll implement API calls later
    setProfileStatus({
      status: 'not_started',
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
    });
  }, [user, router]);

  const handleStep1Submit = async (data: Step1Data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // For now, just simulate API call and move to next step
      // TODO: Implement actual API call to save step 1 data
      setFormData(prev => ({ ...prev, step1: data }));
      setCurrentStep(2);
      setSuccess('Step 1 completed successfully!');

      // Update profile status
      setProfileStatus(prev => prev ? { ...prev, step1Completed: true } : null);
    } catch (err: any) {
      setError('Failed to save step 1');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!user || !profileStatus) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <NurseProtectedRoute requireVerified={false}>
      <Layout title="Complete Your Profile">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">Profile Setup</h1>
                <span className="text-sm text-gray-500">Step {currentStep} of 3</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Basic Info</span>
                <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Documents</span>
                <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Complete Profile</span>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm">
              {currentStep === 1 && (
                <div className="p-8">
                  <Step1BasicInfo
                    onNext={handleStep1Submit}
                    initialData={formData.step1}
                    loading={loading}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Documents</h2>
                    <p className="text-gray-600">Please upload the required documents to complete your profile verification.</p>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Step 2 component coming soon...</p>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    >
                      Continue to Step 3 (Temporary)
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                    <p className="text-gray-600">Provide additional information about your qualifications and experience.</p>
                  </div>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Step 3 component coming soon...</p>
                    <button
                      onClick={() => router.push('/verification-pending')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Profile (Temporary)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </NurseProtectedRoute>
  );
}
