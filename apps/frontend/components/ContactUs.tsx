import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactUs() {
  return (
    <motion.section
      className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 py-20 px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-4xl font-extrabold text-center mb-2 text-blue-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Contact Us
        </motion.h2>
        <motion.p
          className="text-center mb-12 text-gray-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Have questions or want to partner with us? We’d love to hear from you.
        </motion.p>
        <motion.div
          className="flex flex-col md:flex-row justify-center items-start gap-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="text-gray-800 space-y-4 text-base md:w-1/3">
            <div className="flex items-center gap-3">
              <Mail className="text-blue-600" size={20} />
              <span>support@nurseconnect.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-blue-600" size={20} />
              <span>+20 100 123 4567</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-600" size={20} />
              <span>Assiut, Egypt</span>
            </div>
          </div>
          <form className="flex flex-col gap-4 w-full md:w-1/2 bg-white p-6 rounded-2xl shadow-lg">
            <input
              type="text"
              placeholder="Your name"
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Your email"
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Your message"
              rows={4}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all duration-300"
            >
              <Send size={18} /> Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </motion.section>
  );
}
