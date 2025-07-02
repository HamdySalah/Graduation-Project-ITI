import Link from 'next/link';
import { useState } from 'react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      location: {
        type: 'Point',
        coordinates: [31.233, 30.033],
      },
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
      localStorage.setItem('token', data.access_token); 
      window.location.href = '/'; 
    } catch (err) {
      setError(err.message || 'An error occurred');
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
                <label className="block text-lg font-semibold text-gray-700">I am</label>
                <div className="flex space-x-4 mt-2">
                  <label>
                    <input
                      type="radio"
                      value="NURSE"
                      checked={role === 'NURSE'}
                      onChange={(e) => setRole(e.target.value as 'NURSE' | 'PATIENT')}
                      className="mr-2"
                    /> 
                    <span className="text-xl text-gray-800">Nurse</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="PATIENT"
                      checked={role === 'PATIENT'}
                      onChange={(e) => setRole(e.target.value as 'NURSE' | 'PATIENT')}
                      className="mr-2"
                    /> 
                    <span className="text-xl text-gray-800">Patient</span>
                  </label>
                </div>
              </div>
              {role === 'NURSE' && (
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
                      placeholder="Enter years of experience"
                    />
                  </div>
                </>
              )}
              {error && <p className="text-red-500 text-md font-medium">{error}</p>}
              <p className="text-md text-gray-600">Already have an account? <Link href="/login" className="text-purple-600 hover:text-purple-800 font-medium">Login</Link></p>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-full hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg transform hover:scale-105 transition duration-300"
              >
                Register
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