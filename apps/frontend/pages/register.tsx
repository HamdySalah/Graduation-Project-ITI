import Link from 'next/link';
import { useState } from 'react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  role: useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'NURSE' | 'PATIENT'>('PATIENT');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const registerData = {
      name,
      email,
      password,
      phone,
      role,
      coordinates: [31.233, 30.033], // Default to Cairo for now
      ...(role === 'NURSE' && {
        licenseNumber,
        yearsOfExperience: parseInt(yearsOfExperience, 10),
      }),
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) throw new Error('Registration failed');
      const data = await response.json();
      localStorage.setItem('token', data.access_token); // Store token
      window.location.href = '/'; // Redirect to home
    } catch (err) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-blue-200 flex items-center justify-center">
        <img src="/imagenurse3.jpeg" alt="Register Background" className="max-w-full max-h-full" />
      </div>
      <div className="w-1/2 flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">register</h2>
            <div className="text-2xl">logo</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">I am</label>
              <div className="flex space-x-4 mt-1">
                <label>
                  <input
                    type="radio"
                    value="NURSE"
                    checked={role === 'NURSE'}
                    onChange={(e) => setRole(e.target.value as 'NURSE' | 'PATIENT')}
                  /> Nurse
                </label>
                <label>
                  <input
                    type="radio"
                    value="PATIENT"
                    checked={role === 'PATIENT'}
                    onChange={(e) => setRole(e.target.value as 'NURSE' | 'PATIENT')}
                  /> Patient
                </label>
              </div>
            </div>
            {role === 'NURSE' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
              </>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-sm text-gray-600">Are you already have account? <Link href="/login" className="text-blue-500">Login</Link></p>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              register
            </button>
            <div className="flex justify-center space-x-4">
              <button className="text-blue-600">f</button>
              <button className="text-black">G</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}