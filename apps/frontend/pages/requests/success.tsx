import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import Layout, { Card } from '../../components/Layout';
import { apiService } from '../../lib/api';

interface RequestData {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  specialRequirements?: string;
  budget?: number;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

const SERVICE_TYPE_LABELS: { [key: string]: string } = {
  home_care: 'Home Care',
  medication_administration: 'Medication Administration',
  wound_care: 'Wound Care',
  vital_signs_monitoring: 'Vital Signs Monitoring',
  post_surgical_care: 'Post-Surgical Care',
  elderly_care: 'Elderly Care',
  pediatric_care: 'Pediatric Care',
  chronic_disease_management: 'Chronic Disease Management',
};

const URGENCY_COLORS: { [key: string]: string } = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function RequestSuccess() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchRequestDetails(id);
    }
  }, [id]);

  const fetchRequestDetails = async (requestId: string) => {
    try {
      console.log('🔍 Fetching request details for ID:', requestId);
      const result = await apiService.getRequestById(requestId);
      console.log('✅ Request details fetched:', result);
      
      // Handle the double-nested response structure (similar to nurse data fix)
      let requestData: RequestData | null = null;
      if (result && typeof result === 'object') {
        const resultObj = result as any;
        requestData = resultObj?.data || resultObj;
      }

      setRequest(requestData);
    } catch (err: any) {
      console.error('❌ Error fetching request details:', err);
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user || user.role !== 'patient') {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Access denied. Only patients can view this page.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Request Submitted">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request details...</p>
          </Card>
        </div>
      </Layout>
    );
  }

  if (error || !request) {
    return (
      <Layout title="Request Submitted">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Request</h2>
            <p className="text-gray-600 mb-6">{error || 'Request not found'}</p>
            <div className="space-x-4">
              <Link href="/requests" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                View My Requests
              </Link>
              <Link href="/dashboard" className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md">
                Go to Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Request Submitted Successfully">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your nursing service request has been created and is now being processed.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Request ID:</span> {request.id}
            </p>
          </div>
        </Card>

        {/* Request Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{request.title}</h3>
              <p className="text-gray-600 mb-4">{request.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service Type:</span>
                  <span className="text-sm font-medium">{SERVICE_TYPE_LABELS[request.serviceType] || request.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Scheduled Date:</span>
                  <span className="text-sm font-medium">{formatDate(request.scheduledDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Duration:</span>
                  <span className="text-sm font-medium">{request.estimatedDuration} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Urgency:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_COLORS[request.urgencyLevel] || 'bg-gray-100 text-gray-800'}`}>
                    {request.urgencyLevel.charAt(0).toUpperCase() + request.urgencyLevel.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Service Location</h4>
              <p className="text-gray-600 mb-4">{request.address}</p>
              
              {request.budget && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">Budget</h4>
                  <p className="text-gray-600">${request.budget}</p>
                </div>
              )}
              
              {request.specialRequirements && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-1">Special Requirements</h4>
                  <p className="text-gray-600">{request.specialRequirements}</p>
                </div>
              )}
              
              {request.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Additional Notes</h4>
                  <p className="text-gray-600">{request.notes}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* What Happens Next */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Request Review</h3>
                <p className="text-gray-600">Our system will review your request and match you with qualified nurses in your area.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Nurse Matching</h3>
                <p className="text-gray-600">Available nurses will be notified and can accept your request based on their availability and expertise.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Confirmation</h3>
                <p className="text-gray-600">Once a nurse accepts your request, you'll receive a confirmation with their details and contact information.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/requests"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-center font-medium"
            >
              View My Requests
            </Link>
            <Link
              href="/requests/create"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-center font-medium"
            >
              Create Another Request
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md text-center font-medium"
            >
              Go to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
