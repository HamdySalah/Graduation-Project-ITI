const TestimonialSection = () => {
  return (
    <section className="bg-gray-100 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
      <p className="text-gray-600 mb-6">Hear from patients and nurses who use NurseConnect</p>
      <div className="container mx-auto max-w-md bg-white p-6 rounded-lg shadow-md">
        <p className="italic mb-4">
          "After my surgery, I needed regular wound care but couldn't get to the clinic. NurseConnect matched me with an amazing nurse who came to my home. It was a lifesaver!"
        </p>
        <div className="flex items-center justify-center">
          <img src="https://via.placeholder.com/50" alt="User" className="rounded-full mr-2" />
          <div>
            <p className="font-semibold">Margaret T.</p>
            <p className="text-gray-600">Patient, Post-Op Care</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;