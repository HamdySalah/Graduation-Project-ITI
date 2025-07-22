import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/auth';
import { apiService } from '../../lib/api';
import Layout from '../../components/Layout';
import PaymentForm from '../../components/PaymentForm';

interface Request {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  budget: number;
  estimatedDuration: number;
  nurse: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  patient: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { requestId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (requestId && !authLoading) {
      loadRequest();
    }
  }, [requestId, authLoading]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRequestById(requestId as string);
      setRequest(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentSuccess(true);
    // Optionally redirect after a delay
    setTimeout(() => {
      router.push('/requests');
    }, 3000);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">Please log in to make a payment.</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Request not found.</p>
            <button
              onClick={() => router.push('/requests')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (paymentSuccess) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-green-600 mb-4">
              Your payment has been processed successfully. The nurse will receive their payment shortly.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              You will be redirected to your requests page in a few seconds...
            </p>
            <button
              onClick={() => router.push('/requests')}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              View My Requests
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Convert budget to smallest currency unit (piastres)
  const amountInPiastres = Math.round(request.budget * 100);

  return (
    <Layout title="Payment">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Secure payment for your nursing service</p>
        </div>

        {/* Request Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Summary</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">{request.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{request.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{request.estimatedDuration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nurse:</span>
              <span className="font-medium">{request.nurse.name}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>EGP {request.budget.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
          
          <PaymentForm
            requestId={request.id}
            amount={amountInPiastres}
            description={`Payment for ${request.title} - ${request.serviceType}`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
              <p className="text-sm text-blue-600 mt-1">
                Your payment is processed securely through Stripe. We never store your card information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
