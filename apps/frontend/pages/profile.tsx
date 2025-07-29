import { useEffect, useState } from 'react';
import { useAuth, User } from '../lib/auth';
import CommonLayout from '../components/CommonLayout';
import { apiService } from '../lib/api';

// Helper components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SPECIALIZATIONS = [
  { value: 'general', label: 'General Nursing' },
  { value: 'pediatric', label: 'Pediatric Care' },
  { value: 'geriatric', label: 'Geriatric Care' },
  { value: 'icu', label: 'ICU Care' },
  { value: 'emergency', label: 'Emergency Care' },
  { value: 'surgical', label: 'Surgical Care' },
  { value: 'psychiatric', label: 'Psychiatric Care' },
  { value: 'oncology', label: 'Oncology Care' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    // Nurse-specific fields
    bio: '',
    hourlyRate: '',
    specializations: [] as string[],
    languages: [] as string[],
    education: '',
    certifications: [] as string[],
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.nurseProfile?.bio || '',
        hourlyRate: user.nurseProfile?.hourlyRate?.toString() || '',
        specializations: user.nurseProfile?.specializations || [],
        languages: user.nurseProfile?.languages || [],
        education: user.nurseProfile?.education || '',
        certifications: user.nurseProfile?.certifications || [],
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageChange = (languages: string) => {
    setFormData(prev => ({
      ...prev,
      languages: languages.split(',').map(lang => lang.trim()).filter(lang => lang)
    }));
  };

  const handleCertificationChange = (certifications: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: certifications.split(',').map(cert => cert.trim()).filter(cert => cert)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      // Add nurse-specific data if user is a nurse
      if (user?.role === 'nurse') {
        updateData.nurseProfile = {
          bio: formData.bio,
          hourlyRate: parseFloat(formData.hourlyRate),
          specializations: formData.specializations,
          languages: formData.languages,
          education: formData.education,
          certifications: formData.certifications,
        };
      }

      const updatedUser = await apiService.updateProfile(updateData);
      updateUser(updatedUser as Partial<User>);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      await apiService.toggleNurseAvailability();
      // Refresh user data
      const updatedProfile = await apiService.getProfile();
      updateUser(updatedProfile as Partial<User>);
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    }
  };

  if (!user) {
    return (
      <CommonLayout activeItem="profile" allowedRoles={['patient', 'nurse']}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout activeItem="profile" allowedRoles={['patient', 'nurse']}>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 capitalize">{user.role}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={user.status} />
              {user.role === 'nurse' && user.nurseProfile && (
                <button
                  onClick={toggleAvailability}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.nurseProfile.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.nurseProfile.isAvailable ? 'Available' : 'Unavailable'}
                </button>
              )}
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-600">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="01030321695"
                    pattern="(\+20|0)?1[0-2,5]\d{8}"
                    title="Please enter a valid Egyptian phone number (e.g., 01030321695)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
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
                />
              </div>
            </Card>

            {user.role === 'nurse' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell patients about your experience and approach to care..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (EGP)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Education
                    </label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bachelor of Nursing"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specializations
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map(spec => (
                      <button
                        key={spec.value}
                        type="button"
                        onClick={() => handleSpecializationToggle(spec.value)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          formData.specializations.includes(spec.value)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {spec.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.languages.join(', ')}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Arabic, English, French"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.certifications.join(', ')}
                      onChange={(e) => handleCertificationChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CPR Certified, BLS"
                    />
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-500">Phone:</span>
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Address:</span>
                  <p className="text-gray-900">{user.address || 'Not provided'}</p>
                </div>
              </div>
            </Card>

            {user.role === 'nurse' && user.nurseProfile && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Profile</h3>
                
                {user.nurseProfile.bio && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-500">Bio:</span>
                    <p className="text-gray-900 mt-1">{user.nurseProfile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="font-medium text-gray-500">Experience:</span>
                    <p className="text-gray-900">{user.nurseProfile.yearsOfExperience} years</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Hourly Rate:</span>
                    <p className="text-gray-900">{user.nurseProfile.hourlyRate} EGP</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Rating:</span>
                    <p className="text-gray-900">{user.nurseProfile.rating}⭐ ({user.nurseProfile.totalReviews} reviews)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-500">Specializations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.nurseProfile.specializations.map(spec => (
                        <span
                          key={spec}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {spec.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Languages:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.nurseProfile.languages.map(lang => (
                        <span
                          key={lang}
                          className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
        </div>
      </div>
    </CommonLayout>
  );
}
