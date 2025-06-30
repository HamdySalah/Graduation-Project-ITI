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
  return (
    <div>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <PlatformFeatures />
      <VerificationProcess />
      {/* Placeholder for remaining sections */}
      <TestimonialSection />
      {/* Add HowItWorksSection, PlatformFeaturesSection, VerificationProcessSection, 
          CallToActionSection, ContactSection, and Footer here as you implement them */}
      <CallToAction />
      <ContactUs />
      <Footer />
    </div>
  );
}