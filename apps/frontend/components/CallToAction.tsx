import React from "react";
import { motion } from "framer-motion";
import { UserSearch, UserPlus } from "lucide-react";

export default function CallToAction() {
  return (
    <motion.section
      className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white text-center py-20 px-4 sm:px-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-4xl font-extrabold mb-4 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Ready to Experience Better Home Healthcare?
        </motion.h2>
        <motion.p
          className="mb-10 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Join thousands of patients and nurses who trust NurseConnect for professional, convenient home healthcare services.
        </motion.p>
        <motion.div
          className="flex justify-center flex-wrap gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <button className="flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-blue-100 transition-all duration-300 shadow-md">
            <UserSearch size={20} />
            Find a Nurse
          </button>
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full border border-white transition-all duration-300 shadow-md">
            <UserPlus size={20} />
            Register as a Nurse
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}
