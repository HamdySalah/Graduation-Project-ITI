import { useAuth } from '../lib/auth';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TestimonialSection from '../components/TestimonialSection';
import Footer from '../components/Footer';
import ContactUs from '../components/ContactUs';
import CallToAction from '../components/CallToAction';
import HowItWorks from '../components/HowItWorks';
import PlatformFeatures from '../components/PlatformFeatures';
import VerificationProcess from '../components/VerificationProcess';

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="scroll-smooth">
      <Navbar />
      <section id="home">
        <HeroSection />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="platform-features">
        <PlatformFeatures />
      </section>
      <section>
        <VerificationProcess />
      </section>
      <section>
        <TestimonialSection />
      </section>
      <section>
        <CallToAction />
      </section>
      <section id="contact-us">
        <ContactUs />
      </section>
      <section>
        <Footer />
      </section>
    </div>
  );
}