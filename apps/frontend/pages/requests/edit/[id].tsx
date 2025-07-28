import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../lib/auth';
import { apiService } from '../../../lib/api';

interface Request {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  address: string;
  scheduledDate: string;
  estimatedDuration: number;
  urgencyLevel: string;
  budget: number;
  contactPhone: string;
  notes: string;
  specialRequirements: string;
  location?: {
    coordinates: [number, number];
  };
}

export default function EditRequest() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<Request | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceType: '',
    address: '',
    scheduledDate: '',
    estimatedDuration: '',
    urgencyLevel: 'medium',
    specialRequirements: '',
    budget: '',
    contactPhone: '',
    notes: '',
    coordinates: [31.233, 30.033] as [number, number],
  });

  // Fetch request data
  useEffect(() => {
    if (id && user) {
      fetchRequest();
    }
  }, [id, user]);

  const fetchRequest = async () => {
    try {
      setFetchLoading(true);
      const response = await apiService.getRequestById(id as string);
      const requestData = response.data;
      
      // Check if user can edit this request
      if (requestData.status !== 'pending') {
        setError('Only pending requests can be edited');
        return;
      }

      setRequest(requestData);
      
      // Populate form with existing data
      setFormData({
        title: requestData.title || '',
        description: requestData.description || '',
        serviceType: requestData.serviceType || '',
        address: requestData.address || '',
        scheduledDate: requestData.scheduledDate ? new Date(requestData.scheduledDate).toISOString().slice(0, 16) : '',
        estimatedDuration: requestData.estimatedDuration?.toString() || '',
        urgencyLevel: requestData.urgencyLevel || 'medium',
        specialRequirements: requestData.specialRequirements || '',
        budget: requestData.budget?.toString() || '',
        contactPhone: requestData.contactPhone || '',
        notes: requestData.notes || '',
        coordinates: requestData.location?.coordinates || [31.233, 30.033],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch request');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setLoading(true);
    setError('');

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        serviceType: formData.serviceType,
        address: formData.address,
        scheduledDate: formData.scheduledDate,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        urgencyLevel: formData.urgencyLevel,
        specialRequirements: formData.specialRequirements,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        contactPhone: formData.contactPhone,
        notes: formData.notes,
        coordinates: formData.coordinates,
      };

      await apiService.updateRequest(id as string, updateData);
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        router.push('/requests');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update request');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to edit requests.</p>
        </div>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request...</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/requests')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Updated Successfully!</h2>
          <p className="text-gray-600 mb-4">Your request has been updated and is now available for nurses to view.</p>
          <p className="text-sm text-gray-500">Redirecting to your requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Request</h1>
            <p className="text-gray-600 mt-2">Update your service request details</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Home nursing care needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service type</option>
                  <option value="home_care">Home Care</option>
                  <option value="medication_administration">Medication Administration</option>
                  <option value="wound_care">Wound Care</option>
                  <option value="vital_signs_monitoring">Vital Signs Monitoring</option>
                  <option value="post_surgical_care">Post-Surgical Care</option>
                  <option value="elderly_care">Elderly Care</option>
                  <option value="pediatric_care">Pediatric Care</option>
                  <option value="chronic_disease_management">Chronic Disease Management</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the nursing service you need in detail..."
              />
            </div>

            {/* Location and Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full address where service is needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="1"
                  max="24"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <select
                  name="urgencyLevel"
                  value={formData.urgencyLevel}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (EGP)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  min="50"
                  max="5000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 200"
                />
              </div>
            </div>

            {/* Contact and Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+201234567890"
                />
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requirements or instructions..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes or comments..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.push('/requests')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
