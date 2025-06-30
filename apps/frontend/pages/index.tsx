import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TestimonialSection from '../components/TestimonialSection';

export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      {/* Placeholder for remaining sections */}
      <TestimonialSection />
      {/* Add HowItWorksSection, PlatformFeaturesSection, VerificationProcessSection, 
          CallToActionSection, ContactSection, and Footer here as you implement them */}
    </div>
  );
}