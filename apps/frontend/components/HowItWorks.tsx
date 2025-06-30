import React from 'react';

const steps = [
  {
    number: 1,
    title: 'Create Your Request',
    description:
      'Tell us what care you need and when. Our platform is designed for all types of home healthcare services.',
  },
  {
    number: 2,
    title: 'Find Nearby Nurses',
    description:
      'Our location-aware system shows you verified nurses in your area, ranked by proximity and qualifications.',
  },
  {
    number: 3,
    title: 'Book & Receive Care',
    description:
      'Select your preferred nurse, schedule the visit, and receive professional care in the comfort of your home.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-3xl mx-auto text-center mb-3">
        <h2 className="text-4xl font-extrabold mb-2 tracking-tight text-black">How CareConnect Works</h2>
        <p className="text-gray-600 text-lg mb-10">Simple steps to get the home healthcare you need</p>
      </div>
      <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto justify-center items-stretch">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex-1 bg-[#f7fafd] rounded-2xl shadow-sm p-8 flex flex-col items-center min-w-[260px]"
          >
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#3570ab] text-white text-2xl font-bold mb-6 shadow-md">
              {step.number}
            </div>
            <h3 className="font-bold text-xl mb-3 text-gray-900 text-center">{step.title}</h3>
            <p className="text-gray-500 text-base text-center leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
