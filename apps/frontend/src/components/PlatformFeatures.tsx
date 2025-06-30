import React from 'react';

const features = [
  {
    icon: (
      // Pin icon (أيقونة الموقع)
      <svg className="w-8 h-8" fill="#2563eb" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
    ),
    title: 'Location-Based Matching',
    desc: 'Automatically connects patients with the nearest available nurses using GPS technology.',
  },
  {
    icon: (
      // Shield Check icon
      <svg className="w-8 h-8" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5.25-3.5 9.75-8 11-4.5-1.25-8-5.75-8-11V7l8-4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
    ),
    title: 'Verified Professionals',
    desc: 'Every nurse is manually verified with license checks and background screening.',
  },
  {
    icon: (
      // Calendar icon
      <svg className="w-8 h-8" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4M8 3v4M3 10h18" /></svg>
    ),
    title: 'Flexible Scheduling',
    desc: 'Book appointments in advance or request immediate assistance for urgent needs.',
  },
  {
    icon: (
      // Lock icon
      <svg className="w-8 h-8" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="9" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" /></svg>
    ),
    title: 'Location-Based Matching',
    desc: 'Automatically connects patients with the nearest available nurses using GPS technology.',
  },
  {
    icon: (
      // Star icon
      <svg className="w-8 h-8" fill="#2563eb" stroke="#2563eb" strokeWidth="1" viewBox="0 0 24 24"><polygon points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27" /></svg>
    ),
    title: 'Rating System',
    desc: 'Review and rate your experience to help maintain quality across the platform.',
  },
  {
    icon: (
      // Mobile icon
      <svg className="w-8 h-8" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" /><circle cx="12" cy="18" r="1.5" /></svg>
    ),
    title: 'Mobile Ready',
    desc: 'Accessible on all devices with responsive design for on-the-go booking.',
  },
];

export default function PlatformFeatures() {
  return (
    <section className="py-14 bg-[#f7fafd]">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h2 className="text-4xl font-extrabold mb-2 tracking-tight text-black">Platform Features</h2>
        <p className="text-gray-600 text-lg">Everything you need for seamless home healthcare connections</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-start min-h-[200px]">
            <div className="mb-5">{feature.icon}</div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
            <p className="text-gray-500 text-base leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
