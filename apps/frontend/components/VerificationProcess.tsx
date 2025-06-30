import React from 'react';

export default function VerificationProcess() {
  return (
    <section className="bg-white py-16 flex justify-center">
      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-10 px-4">
        {/* النص */}
        <div className="flex-1">
          <h2 className="text-3xl md:text-4xl font-extrabold text-black text-center md:text-left mb-2">Our Verification Process</h2>
          <p className="text-gray-600 text-center md:text-left mb-6">Ensuring only qualified professionals join our platform</p>
          <span className="inline-block bg-blue-600 text-white px-5 py-2 rounded-full font-medium text-lg mb-6">Certified Nurse Badge</span>
          <h3 className="font-bold text-xl mb-2">Trust Through Verification</h3>
          <p className="text-gray-700 mb-2">Every nurse on NurseConnect undergoes a rigorous verification process before they can accept appointments.</p>
          <ul className="list-disc list-inside text-gray-700 mb-2 pl-2">
            <li>License validation with state boards</li>
            <li>ID verification and background checks</li>
            <li>Certification and education confirmation</li>
            <li>Skills assessment and specialization validation</li>
          </ul>
          <p className="text-gray-700">Verified nurses receive a "Certified Nurse" badge on their profile, so you can book with confidence.</p>
        </div>
        {/* الصورة */}
        <div className="flex-1 flex justify-center items-center">
          <img
            src="https://www.provocollege.edu/wp-content/uploads/2023/02/shutterstock_1724802532-scaled.jpg"
            alt="Nurse Verification"
            className="rounded-2xl shadow-lg w-full max-w-md max-h-[400px] object-cover"
            style={{ aspectRatio: '4/5' }}
          />
        </div>
      </div>
    </section>
  );
}
