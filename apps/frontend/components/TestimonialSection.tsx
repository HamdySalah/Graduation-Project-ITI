const TestimonialSection = () => {
  return (
    <section className="bg-gray-100 py-20 text-center">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 drop-shadow-lg animate-fade-in">
          What Our Users Say
        </h2>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 px-4 md:px-0 drop-shadow-md animate-fade-in delay-200">
          Hear from patients and nurses who use NurseConnect
        </p>
        <div className="container mx-auto max-w-xl bg-white p-8 rounded-xl shadow-2xl transform hover:scale-105 transition duration-500 animate-fade-in delay-400">
          <p className="text-lg italic text-gray-800 mb-6 leading-relaxed">
            "After my surgery, I needed regular wound care but couldn't get to the clinic. NurseConnect matched me with an amazing nurse who came to my home. It was a lifesaver!"
          </p>
          <div className="flex items-center justify-center">
            <img
              src="/imagenurse2.jpeg" // Profile image
              alt="Margaret T."
              className="w-20 h-20 rounded-full mr-4 border-4 border-blue-200 object-cover"
            />
            <div className="text-left">
              <p className="font-bold text-gray-900 text-xl">Margaret T.</p>
              <p className="text-blue-600 text-lg">Patient, Post-Op Care</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;