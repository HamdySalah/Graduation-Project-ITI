import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { apiService } from '../lib/api';

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

export default function Register() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<'nurse' | 'patient'>('patient');

  // Nurse-specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [specializations, setSpecializations] = useState<string[]>(['general']);
  const [education, setEducation] = useState('Bachelor of Nursing');
  const [certifications, setCertifications] = useState('');
  const [hourlyRate, setHourlyRate] = useState('50');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('Arabic, English');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSpecializationToggle = (specialization: string) => {
    setSpecializations(prev =>
      prev.includes(specialization)
        ? prev.filter(s => s !== specialization)
        : [...prev, specialization]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (role === 'nurse' && (!licenseNumber || !yearsOfExperience)) {
      setError('License number and years of experience are required for nurses');
      setLoading(false);
      return;
    }

    const registerData = {
      name,
      email,
      password,
      phone,
      role,
      coordinates: [31.233, 30.033], // Default coordinates - Cairo
      address: address || 'Cairo, Egypt',
      ...(role === 'nurse' && {
        licenseNumber,
        yearsOfExperience: parseInt(yearsOfExperience, 10),
        specializations,
        education,
        certifications: certifications.split(',').map(cert => cert.trim()).filter(cert => cert),
        hourlyRate: parseFloat(hourlyRate),
        bio: bio || 'Experienced nurse ready to help patients',
        languages: languages.split(',').map(lang => lang.trim()).filter(lang => lang),
      }),
    };

    try {
      const response: any = await apiService.register(registerData);
      console.log('Registration response:', response);

      // The backend returns: { success: true, data: { access_token: "...", user: {...} } }
      let token: string;
      if (response.data && response.data.access_token) {
        token = response.data.access_token;
      } else if (response.access_token) {
        token = response.access_token;
      } else {
        throw new Error('No token received from registration');
      }

      localStorage.setItem('token', token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-400 via-white-500 to-white-500">
      <div className="w-full flex items-center justify-center">
        <div className="container mx-auto p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-2xl flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 p-4">
            <img src="/imagenurse3.jpeg" alt="Register Background" className="w-full h-auto rounded-lg transform hover:scale-105 transition duration-300" />
          </div>
          <div className="w-full md:w-1/2 p-8 relative">
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <div className="text-3xl text-gray-800 font-cursive">logo</div>
            </div>
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-center mb-6">Register</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Confirm your password"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Enter your phone"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                  required
                  placeholder="Enter your address"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700">I am</label>
                <div className="flex space-x-4 mt-2">
                  <label>
                    <input
                      type="radio"
                      value="nurse"
                      checked={role === 'nurse'}
                      onChange={(e) => setRole(e.target.value as 'nurse' | 'patient')}
                      className="mr-2"
                    />
                    <span className="text-xl text-gray-800">Nurse</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="patient"
                      checked={role === 'patient'}
                      onChange={(e) => setRole(e.target.value as 'nurse' | 'patient')}
                      className="mr-2"
                    />
                    <span className="text-xl text-gray-800">Patient</span>
                  </label>
                </div>
              </div>
              {role === 'nurse' && (
                <>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">License Number</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      required
                      placeholder="Enter license number"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Years of Experience</label>
                    <input
                      type="number"
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      required
                      min="0"
                      max="50"
                      placeholder="Enter years of experience"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Education</label>
                    <input
                      type="text"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      placeholder="e.g., Bachelor of Nursing"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Hourly Rate (EGP)</label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      min="0"
                      step="0.01"
                      placeholder="Enter hourly rate"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Specializations</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SPECIALIZATIONS.map(spec => (
                        <button
                          key={spec.value}
                          type="button"
                          onClick={() => handleSpecializationToggle(spec.value)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            specializations.includes(spec.value)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {spec.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-2 w-full border-2 border-purple-300 focus:border-purple-600 focus:outline-none text-lg text-gray-800 placeholder-gray-400 transition duration-300 rounded-md p-2"
                      rows={3}
                      placeholder="Tell patients about your experience and approach to care..."
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Languages (comma-separated)</label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      placeholder="e.g., Arabic, English, French"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700">Certifications (comma-separated)</label>
                    <input
                      type="text"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      className="mt-2 w-full border-b-2 border-purple-300 focus:border-purple-600 focus:outline-none text-xl text-gray-800 placeholder-gray-400 transition duration-300"
                      placeholder="e.g., CPR Certified, BLS, ACLS"
                    />
                  </div>
                </>
              )}
              {error && <p className="text-red-500 text-md font-medium">{error}</p>}
              <p className="text-md text-gray-600">Already have an account? <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">Login</Link></p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg transform hover:scale-105 transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              <div className="flex justify-center space-x-4 mt-4">
                <button className="text-blue-600 text-2xl hover:text-blue-800 transition">f</button>
                <button className="text-black text-2xl hover:text-gray-800 transition">G</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}