import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import Layout from '../components/Layout';
import Step1BasicInfo, { Step1Data } from '../components/profile-completion/Step1BasicInfo';
import Step2VerificationDocuments, { Step2Data } from '../components/profile-completion/Step2VerificationDocuments';
import Step3CompleteProfile, { Step3Data } from '../components/profile-completion/Step3CompleteProfile';
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
  step2?: Step2Data;
  step3?: Step3Data;
}

export default function NurseProfileCompletion() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [statusLoading, setStatusLoading] = useState(true); // separate loading for status
  const [stepLoading, setStepLoading] = useState(false);    // separate loading for step data
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileStatus, setProfileStatus] = useState<ProfileCompletionStatus | null>(null);
  const [formData, setFormData] = useState<ProfileCompletionData>({});

  // Fetch profile status only once when user is available
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        if (user.role !== 'nurse' || user.status === 'verified') {
          router.replace('/dashboard');
          return;
        }
        setStatusLoading(true);
        const token = localStorage.getItem('token');
        const statusResponse = await fetch('/api/nurse-profile/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!statusResponse.ok) {
          const text = await statusResponse.text();
          // eslint-disable-next-line no-console
          console.error('Profile status fetch failed:', statusResponse.status, text);
          throw new Error('Failed to fetch profile status');
        }
        const { data: status } = await statusResponse.json();
        if (cancelled) return;
        setProfileStatus(status);
        // Set initial step
        if (!status.step1Completed) setCurrentStep(1);
        else if (!status.step2Completed) setCurrentStep(2);
        else if (!status.step3Completed) setCurrentStep(3);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load profile data';
        setError(message);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
    return () => { cancelled = true; };
  }, [user, router]);

  // Fetch step data when currentStep or profileStatus changes
  useEffect(() => {
    if (!profileStatus || !user) return;
    let cancelled = false;
    const fetchStepData = async () => {
      try {
        setStepLoading(true);
        const token = localStorage.getItem('token');
        const stepResponse = await fetch(`/api/nurse-profile/step/${currentStep}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (stepResponse.ok) {
          const { data: stepData } = await stepResponse.json();
          if (cancelled) return;
          setFormData((prev) => {
            const key = `step${currentStep}` as keyof ProfileCompletionData;
            return { ...prev, [key]: stepData };
          });
        }
      } catch (error) {
        // Ignore step data error for now
      } finally {
        setStepLoading(false);
      }
    };
    fetchStepData();
    return () => { cancelled = true; };
  }, [currentStep, profileStatus, user]);

  const handleStep1Submit = async (data: Step1Data) => {
    try {
      setStepLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/nurse-profile/step1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save step 1 data');
      }

      setFormData(prev => ({ ...prev, step1: data }));
      setCurrentStep(2);
      setSuccess('Step 1 completed successfully!');
      setProfileStatus(prev => prev ? { ...prev, step1Completed: true } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save step 1';
      setError(message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep2Submit = async (data: Step2Data) => {
    try {
      setStepLoading(true);
      setError('');
      setSuccess('');

      const formDataToSend = new FormData();
      formDataToSend.append('licenseNumber', data.licenseNumber);
      formDataToSend.append('licenseExpirationDate', data.licenseExpirationDate);

      if (data.licenseDocument) {
        formDataToSend.append('licenseDocument', data.licenseDocument);
      }
      if (data.backgroundCheckDocument) {
        formDataToSend.append('backgroundCheckDocument', data.backgroundCheckDocument);
      }
      if (data.resumeDocument) {
        formDataToSend.append('resumeDocument', data.resumeDocument);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/nurse-profile/step2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to save step 2 data');
      }

      setFormData(prev => ({ ...prev, step2: data }));
      setCurrentStep(3);
      setSuccess('Step 2 completed successfully!');
      setProfileStatus(prev => prev ? { ...prev, step2Completed: true } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save step 2';
      setError(message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleStep3Submit = async (data: Step3Data) => {
    try {
      setStepLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/nurse-profile/step3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save step 3 data');
      }

      setFormData(prev => ({ ...prev, step3: data }));

      // Submit the entire profile
      const submitResponse = await fetch('/api/nurse-profile/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit profile');
      }

      setSuccess('Profile completed successfully! Redirecting to verification pending...');
      setProfileStatus(prev => prev ? {
        ...prev,
        step3Completed: true,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      } : null);

      // Redirect to verification pending page after a short delay
      setTimeout(() => {
        router.push('/verification-pending');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit profile';
      setError(message);
    } finally {
      setStepLoading(false);
    }
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
    setError('');
    setSuccess('');
  };

  // Loading state (only for status)
  if (statusLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow">{error}</div>
        </div>
      </Layout>
    );
  }

  // Fallback if profileStatus is null (should not happen)
  if (!profileStatus) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-gray-100 text-gray-700 p-6 rounded-lg shadow">Unable to load profile status.</div>
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
              {currentStep === 1 && profileStatus && (
                <div className="p-8">
                  <Step1BasicInfo
                    onNext={handleStep1Submit}
                    initialData={formData.step1}
                    loading={stepLoading}
                  />
                </div>
              )}
              {currentStep === 2 && profileStatus && (
                <div className="p-8">
                  <Step2VerificationDocuments
                    onNext={handleStep2Submit}
                    onBack={() => handleBackToStep(1)}
                    initialData={formData.step2}
                    loading={stepLoading}
                  />
                </div>
              )}
              {currentStep === 3 && profileStatus && (
                <div className="p-8">
                  <Step3CompleteProfile
                    onNext={handleStep3Submit}
                    onBack={() => handleBackToStep(2)}
                    initialData={formData.step3}
                    loading={stepLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </NurseProtectedRoute>
  );
}
