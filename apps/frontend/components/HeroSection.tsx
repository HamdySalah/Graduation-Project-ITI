import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="bg-gray-200 py-16 text-center">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Connect with Trusted Nurses for Personalized Care</h1>
        <p className="text-white mb-6">
          Find experienced and compassionate nurses for in-home care, tailored to your specific needs. Or, if you're a nurse,
          find flexible opportunities and connect with patients seeking your expertise.
        </p>
        <div className="space-x-4">
          <Link href="/find-nurse" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Find a Nurse</Link>
          <Link href="/register" className="bg-white text-blue-600 py-2 px-4 rounded border border-blue-600 hover:bg-gray-100">Register as a Nurse</Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;