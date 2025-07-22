import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  request: {
    title: string;
    serviceType: string;
  };
  nurse?: {
    name: string;
  };
  patient?: {
    name: string;
  };
}

export default function Payments() {
  const { user, loading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      loadPayments();
    }
  }, [user, loading]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const response = await apiService.getPaymentHistory();
      setPayments(response.data.payments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment history');
    } finally {
      setLoadingPayments(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || loadingPayments) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
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
            <p className="text-red-600 mb-4">Please log in to view payments.</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payments">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-2">Manage your payment methods and transaction history</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {payments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Payments Yet</h2>
                <p className="text-gray-600 mb-6">
                  You haven't made any payments yet. Complete a service request to see your payment history here.
                </p>
                <a
                  href="/requests"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Requests
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {payment.request?.title || 'Service Payment'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><span className="font-medium">Service:</span> {payment.request?.serviceType || 'N/A'}</p>
                            <p><span className="font-medium">Payment Method:</span> {payment.paymentMethod}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Date:</span> {formatDate(payment.createdAt)}</p>
                            {user?.role === 'patient' && payment.nurse && (
                              <p><span className="font-medium">Nurse:</span> {payment.nurse.name}</p>
                            )}
                            {user?.role === 'nurse' && payment.patient && (
                              <p><span className="font-medium">Patient:</span> {payment.patient.name}</p>
                            )}
                          </div>
                        </div>

                        {payment.description && (
                          <p className="text-sm text-gray-600 mt-2">{payment.description}</p>
                        )}
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-lg font-semibold text-gray-900">
                          {payment.currency.toUpperCase()} {(payment.amount / 100).toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => window.location.href = `/payments/${payment._id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
