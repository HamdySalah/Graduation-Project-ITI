import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import Layout from '../components/Layout';
import Step1BasicInfo, { Step1Data } from '../components/profile-completion/Step1BasicInfo';
import Step2VerificationDocuments, { Step2Data } from '../components/profile-completion/Step2VerificationDocuments';
import Step3CompleteProfile, { Step3Data } from '../components/profile-completion/Step3CompleteProfile';

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

  // Debug logging
  console.log('NurseProfileCompletion render:', {
    user: user ? { role: user.role, status: user.status } : null,
    statusLoading,
    profileStatus,
    currentStep,
    error
  });

  // Load data from local storage on mount
  useEffect(() => {
    const loadLocalData = () => {
      try {
        const step1Data = localStorage.getItem('nurse-profile-step1');
        const step2Data = localStorage.getItem('nurse-profile-step2');
        const step3Data = localStorage.getItem('nurse-profile-step3');

        if (step1Data || step2Data || step3Data) {
          setFormData({
            step1: step1Data ? JSON.parse(step1Data) : undefined,
            step2: step2Data ? JSON.parse(step2Data) : undefined,
            step3: step3Data ? JSON.parse(step3Data) : undefined,
          });

          // Set current step based on what's completed
          if (step3Data) setCurrentStep(3);
          else if (step2Data) setCurrentStep(2);
          else if (step1Data) setCurrentStep(2); // Move to step 2 if step 1 is done
        }
      } catch (error) {
        console.error('Error loading local data:', error);
      }
    };

    loadLocalData();
  }, []);

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

          // Provide fallback status for pending nurses
          if (user.status === 'pending') {
            const fallbackStatus: ProfileCompletionStatus = {
              status: 'not_started',
              step1Completed: false,
              step2Completed: false,
              step3Completed: false,
            };
            if (cancelled) return;
            setProfileStatus(fallbackStatus);
            setCurrentStep(1);
            return;
          }

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
        // eslint-disable-next-line no-console
        console.error('Error fetching profile status:', error);

        // For pending nurses, provide a fallback to allow profile completion
        if (user.status === 'pending') {
          const fallbackStatus: ProfileCompletionStatus = {
            status: 'not_started',
            step1Completed: false,
            step2Completed: false,
            step3Completed: false,
          };
          setProfileStatus(fallbackStatus);
          setCurrentStep(1);
          setError(''); // Clear any previous errors
        } else {
          const message = error instanceof Error ? error.message : 'Failed to load profile data';
          setError(message);
        }
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

      console.log('Submitting Step 1 data:', data);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making request to /api/nurse-profile/step1');

      // First, test if the backend is accessible
      try {
        const testResponse = await fetch('/api/nurse-profile/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        console.log('Backend test response status:', testResponse.status);
      } catch (testError) {
        console.error('Backend not accessible:', testError);
        throw new Error('Backend server is not running. Please start the backend server.');
      }

      const response = await fetch('/api/nurse-profile/step1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Step 1 save failed:', response.status, errorText);

        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error('Backend endpoint not found. Please ensure the backend server is running on port 3001.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Only nurses can complete profiles.');
        } else if (response.status === 400 && errorText.includes('User is not a nurse')) {
          throw new Error('Authentication issue: Your account role is not recognized. Please log out and log in again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Failed to save step 1 data: ${response.status} ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Step 1 save successful:', result);

      setFormData(prev => ({ ...prev, step1: data }));
      setCurrentStep(2);
      setSuccess('Step 1 completed successfully!');
      setProfileStatus(prev => prev ? { ...prev, step1Completed: true } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save step 1';
      console.error('Step 1 submit error:', error);

      // Handle authentication errors specifically
      if (message.includes('Authentication') || message.includes('User is not a nurse')) {
        setError(`${message}\n\nThis usually means you need to log in again with fresh credentials.`);

        setTimeout(() => {
          if (window.confirm('Authentication issue detected. Would you like to log out and log in again to refresh your session?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
        }, 1000);
      } else {
        // Provide fallback option to continue locally for other errors
        setError(`${message}\n\nWould you like to continue with local storage? Your data will be saved locally and you can submit it later when the server is available.`);

        // Add a fallback button to continue locally
        setTimeout(() => {
          if (window.confirm('Backend server is not available. Would you like to continue with local storage? Your data will be saved locally.')) {
            // Save to local storage as fallback
            localStorage.setItem('nurse-profile-step1', JSON.stringify(data));
            setFormData(prev => ({ ...prev, step1: data }));
            setCurrentStep(2);
            setSuccess('Step 1 saved locally! You can submit to server later.');
            setProfileStatus(prev => prev ? { ...prev, step1Completed: true } : null);
            setError('');
          }
        }, 1000);
      }
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
        const errorText = await response.text();
        console.error('Step 2 save failed:', response.status, errorText);
        let errorMessage = `Failed to save step 2 data: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` - ${errorData.message || errorText}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }
        throw new Error(errorMessage);
      }

      setFormData(prev => ({ ...prev, step2: data }));
      setCurrentStep(3);
      setSuccess('Step 2 completed successfully!');
      setProfileStatus(prev => prev ? { ...prev, step2Completed: true } : null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save step 2';
      console.error('Step 2 submit error:', error);

      // Provide fallback option
      if (window.confirm('Backend server is not available. Would you like to continue with local storage?')) {
        localStorage.setItem('nurse-profile-step2', JSON.stringify(data));
        setFormData(prev => ({ ...prev, step2: data }));
        setCurrentStep(3);
        setSuccess('Step 2 saved locally!');
        setProfileStatus(prev => prev ? { ...prev, step2Completed: true } : null);
        setError('');
      } else {
        setError(message);
      }
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
        const errorText = await response.text();
        console.error('Step 3 save failed:', response.status, errorText);
        throw new Error(`Failed to save step 3 data: ${response.status}`);
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
        const submitErrorText = await submitResponse.text();
        console.error('Profile submit failed:', submitResponse.status, submitErrorText);
        throw new Error(`Failed to submit profile: ${submitResponse.status}`);
      }

      setSuccess('Profile completed successfully! Redirecting to verification pending...');
      setProfileStatus(prev => prev ? {
        ...prev,
        step3Completed: true,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      } : null);

      // Clear local storage since profile was submitted successfully
      localStorage.removeItem('nurse-profile-step1');
      localStorage.removeItem('nurse-profile-step2');
      localStorage.removeItem('nurse-profile-step3');

      // Redirect to verification pending page after a short delay
      setTimeout(() => {
        router.push('/verification-pending');
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit profile';
      console.error('Step 3 submit error:', error);

      // Provide fallback option
      if (window.confirm('Backend server is not available. Would you like to save locally and try submitting later?')) {
        localStorage.setItem('nurse-profile-step3', JSON.stringify(data));
        setFormData(prev => ({ ...prev, step3: data }));
        setSuccess('Step 3 saved locally! Please try submitting again when the server is available.');
        setProfileStatus(prev => prev ? {
          ...prev,
          step3Completed: true,
          status: 'completed_locally'
        } : null);
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setStepLoading(false);
    }
  };

  const handleBackToStep = (step: number) => {
    setCurrentStep(step);
    setError('');
    setSuccess('');
  };

  const retrySubmitProfile = async () => {
    try {
      setStepLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check if we have all the data locally
      const step1Data = localStorage.getItem('nurse-profile-step1');
      const step2Data = localStorage.getItem('nurse-profile-step2');
      const step3Data = localStorage.getItem('nurse-profile-step3');

      if (!step1Data || !step2Data || !step3Data) {
        throw new Error('Missing profile data. Please complete all steps again.');
      }

      // Submit all steps to the server
      const steps = [
        { endpoint: '/api/nurse-profile/step1', data: JSON.parse(step1Data) },
        { endpoint: '/api/nurse-profile/step2', data: JSON.parse(step2Data) },
        { endpoint: '/api/nurse-profile/step3', data: JSON.parse(step3Data) }
      ];

      for (const step of steps) {
        const response = await fetch(step.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(step.data),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit ${step.endpoint}`);
        }
      }

      // Submit the profile
      const submitResponse = await fetch('/api/nurse-profile/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit profile');
      }

      // Clear local storage and redirect
      localStorage.removeItem('nurse-profile-step1');
      localStorage.removeItem('nurse-profile-step2');
      localStorage.removeItem('nurse-profile-step3');

      setSuccess('Profile submitted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/verification-pending');
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retry submission';
      setError(message);
    } finally {
      setStepLoading(false);
    }
  };

  // Authentication checks
  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access this page.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.role !== 'nurse') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">This page is only accessible to nurses.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (user.status === 'verified') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Already Complete</h2>
            <p className="text-gray-600 mb-4">Your profile has been verified and approved.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

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

  // Error state - only show if we have a real error and user is not pending
  if (error && user?.status !== 'pending') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg shadow max-w-md text-center">
            <h2 className="text-lg font-semibold mb-2">Unable to Load Profile</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Ensure we have a profile status for pending nurses
  if (!profileStatus && user?.status === 'pending') {
    const fallbackStatus: ProfileCompletionStatus = {
      status: 'not_started',
      step1Completed: false,
      step2Completed: false,
      step3Completed: false,
    };
    setProfileStatus(fallbackStatus);
    setCurrentStep(1);
  }

  return (
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

            {/* Local Storage Notice */}
            {(localStorage.getItem('nurse-profile-step1') || localStorage.getItem('nurse-profile-step2') || localStorage.getItem('nurse-profile-step3')) && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You have locally saved profile data.
                    </p>
                    <button
                      onClick={retrySubmitProfile}
                      disabled={stepLoading}
                      className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    >
                      {stepLoading ? 'Submitting...' : 'Retry Submit to Server'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  <p className="ml-3 text-sm text-red-700 whitespace-pre-line">{error}</p>
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
                    loading={stepLoading}
                  />
                </div>
              )}
              {currentStep === 2 && (
                <div className="p-8">
                  <Step2VerificationDocuments
                    onNext={handleStep2Submit}
                    onBack={() => handleBackToStep(1)}
                    initialData={formData.step2}
                    loading={stepLoading}
                  />
                </div>
              )}
              {currentStep === 3 && (
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
  );
}
