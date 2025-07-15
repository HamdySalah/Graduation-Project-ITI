import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth';

export interface NurseAccessStatus {
  canAccessPlatform: boolean;
  canAccessDashboard: boolean;
  canViewRequests: boolean;
  canCreateRequests: boolean;
  canAccessProfile: boolean;
  redirectTo?: string;
  reason?: string;
  profileCompletionStatus: string;
  currentStep?: number;
  nextRequiredAction?: string;
}

export interface ProfileStepInfo {
  nextStep: number;
  completionPercentage: number;
  statusMessage: string;
}

export function useNurseAccessStatus() {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState<NurseAccessStatus | null>(null);
  const [stepInfo, setStepInfo] = useState<ProfileStepInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccessStatus = useCallback(async () => {
    if (!user || user.role !== 'nurse') {
      setAccessStatus(null);
      setStepInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch access status
      const accessResponse = await fetch('/api/nurse-profile-status/access-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!accessResponse.ok) {
        throw new Error('Failed to fetch access status');
      }

      const accessResult = await accessResponse.json();
      setAccessStatus(accessResult.data);

      // Fetch step information
      const stepResponse = await fetch('/api/nurse-profile-status/next-step', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (stepResponse.ok) {
        const stepResult = await stepResponse.json();
        setStepInfo(stepResult.data);
      }

    } catch (err: any) {
      console.error('Error fetching nurse access status:', err);
      setError(err.message || 'Failed to fetch access status');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    if (!user || user.role !== 'nurse') {
      return false;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`/api/nurse-profile-status/can-access/${feature}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.canAccess;
      }

      return false;
    } catch (err) {
      console.error(`Error checking access for feature ${feature}:`, err);
      return false;
    }
  }, [user]);

  const getStatusMessage = useCallback(async (): Promise<string> => {
    if (!user || user.role !== 'nurse') {
      return 'Not a nurse account';
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return 'Authentication required';

      const response = await fetch('/api/nurse-profile-status/status-message', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.statusMessage;
      }

      return 'Unable to fetch status message';
    } catch (err) {
      console.error('Error fetching status message:', err);
      return 'Error fetching status';
    }
  }, [user]);

  const refreshStatus = useCallback(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  // Auto-fetch when user changes
  useEffect(() => {
    fetchAccessStatus();
  }, [fetchAccessStatus]);

  // Helper functions for common checks
  const canAccessDashboard = accessStatus?.canAccessDashboard ?? false;
  const canViewRequests = accessStatus?.canViewRequests ?? false;
  const canCreateRequests = accessStatus?.canCreateRequests ?? false;
  const canAccessPlatform = accessStatus?.canAccessPlatform ?? false;
  const needsProfileCompletion = accessStatus?.redirectTo === '/nurse-profile-complete';
  const isUnderReview = accessStatus?.redirectTo === '/verification-pending';
  const isRejected = accessStatus?.redirectTo === '/profile-rejected' || accessStatus?.redirectTo === '/account-rejected';

  // Get redirect information
  const getRedirectInfo = useCallback(() => {
    if (!accessStatus) return null;

    return {
      shouldRedirect: !!accessStatus.redirectTo,
      redirectTo: accessStatus.redirectTo,
      reason: accessStatus.reason,
      nextAction: accessStatus.nextRequiredAction,
      currentStep: accessStatus.currentStep,
    };
  }, [accessStatus]);

  // Get completion status
  const getCompletionStatus = useCallback(() => {
    if (!stepInfo) return null;

    return {
      percentage: stepInfo.completionPercentage,
      nextStep: stepInfo.nextStep,
      message: stepInfo.statusMessage,
      isComplete: stepInfo.completionPercentage === 100,
    };
  }, [stepInfo]);

  return {
    // Status data
    accessStatus,
    stepInfo,
    loading,
    error,

    // Helper booleans
    canAccessDashboard,
    canViewRequests,
    canCreateRequests,
    canAccessPlatform,
    needsProfileCompletion,
    isUnderReview,
    isRejected,

    // Functions
    checkFeatureAccess,
    getStatusMessage,
    refreshStatus,
    getRedirectInfo,
    getCompletionStatus,

    // Status checks
    isNurse: user?.role === 'nurse',
    isVerified: user?.status === 'verified',
    isPending: user?.status === 'pending',
  };
}
