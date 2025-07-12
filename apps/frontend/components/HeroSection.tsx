import Link from 'next/link';

const HeroSection = () => {
  return (
    <section
      className="bg-cover bg-center py-24 text-center relative"
      style={{ backgroundImage: "url('/imagenurse.jpg')" }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="container mx-auto relative z-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg animate-fade-in">
          Connect with Trusted Nurses for Personalized Care
        </h1>
        <p className="text-xl md:text-2xl text-white mb-8 px-4 md:px-0 drop-shadow-md animate-fade-in delay-200">
          Find experienced and compassionate nurses for in-home care, tailored to your specific needs. Or, if you're a nurse,
          discover flexible opportunities and connect with patients seeking your expertise.
        </p>
        <div className="space-x-4 flex justify-center animate-fade-in delay-400">
          <Link
            href="/nurses"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
          >
            Find a Nurse
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-600 py-3 px-6 rounded-lg border-2 border-blue-600 shadow-md hover:bg-blue-50 hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
          >
            Register as a Nurse
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;