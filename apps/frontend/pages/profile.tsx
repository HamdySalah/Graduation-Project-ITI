
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Profile() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    // Add other fields as needed
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      // Fetch full profile data
      const fetchProfileData = async () => {
        try {
          const response = await api.get('/api/auth/profile');
          const profileData = response.data;
          
          setFormData({
            name: profileData.name || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
            // Add other fields as needed
          });
        } catch (err: any) {
          setError('Failed to load profile data');
          console.error('Error fetching profile:', err);
        }
      };
      
      fetchProfileData();
    }
  }, [user]);

  // Validate phone number (Egyptian format)
  const validateEgyptianPhone = (phone: string): boolean => {
    const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
    return egyptianPhoneRegex.test(phone);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (formData.name && formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (formData.phone && !validateEgyptianPhone(formData.phone)) {
      errors.phone = 'Please provide a valid Egyptian mobile number (01X format, 11 digits)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Only send fields that have values
      const updateData: {[key: string]: any} = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          updateData[key] = value;
        }
      });
      
      await api.put('/api/auth/profile', updateData);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'An error occurred while updating profile';
      
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-r from-blue-400 via-white-500 to-white-500 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md rounded-xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-purple-700 mb-8 text-center">Your Profile</h2>
            
            {isSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                Profile updated successfully!
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-2 w-full border-b-2 ${
                    formErrors.name ? 'border-red-500' : 'border-purple-300'
                  } focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300`}
                  placeholder="Your full name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700" htmlFor="phone">
                  Phone Number (Egyptian format)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-2 w-full border-b-2 ${
                    formErrors.phone ? 'border-red-500' : 'border-purple-300'
                  } focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300`}
                  placeholder="01X followed by 8 digits"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className={`mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300`}
                  placeholder="Your address"
                />
              </div>
              
              {/* Add other fields as needed */}
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full text-lg font-semibold shadow-lg transform transition duration-300 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700 hover:scale-105'
                  }`}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
