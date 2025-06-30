import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  ArrowUp,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <motion.footer
        className="w-full bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-6 relative"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h4 className="text-xl font-bold mb-3">NurseConnect</h4>
            <p className="text-sm text-gray-300">
              Connecting patients with verified nurses for professional home healthcare services.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="LinkedIn" className="hover:text-blue-400 transition-all">
                <Linkedin size={20} />
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-blue-400 transition-all">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-blue-400 transition-all">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="Instagram" className="hover:text-pink-400 transition-all">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">For Patients</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition">Services Offered</a></li>
              <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition">Safety Information</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">For Nurses</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition">Join Our Network</a></li>
              <li><a href="#" className="hover:text-white transition">Verification Process</a></li>
              <li><a href="#" className="hover:text-white transition">Earnings Calculator</a></li>
              <li><a href="#" className="hover:text-white transition">Nurse Resources</a></li>
              <li><a href="#" className="hover:text-white transition">Referral Program</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Press</a></li>
              <li><a href="#" className="hover:text-white transition">Careers</a></li>
              <li><a href="#" className="hover:text-white transition">Partnerships</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-12">
          © 2025 NurseConnect. All rights reserved. |
          <a href="#" className="hover:text-white mx-1">Privacy Policy</a> |
          <a href="#" className="hover:text-white mx-1">Terms of Service</a>
        </p>
      </motion.footer>

      {/* Scroll to top button */}
      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/201001234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-6 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={18} />
      </a>
    </>
  );
}
