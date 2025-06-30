import React from "react";

export default function CallToAction() {
  return (
    <section className="bg-blue-600 text-white text-center py-16">
      <h2 className="text-3xl font-bold mb-4">
        Ready to Experience Better Home Healthcare?
      </h2>
      <p className="mb-8">
        Join thousands of patients and nurses who trust NurseConnect for professional, convenient home healthcare services.
      </p>
      <div className="flex justify-center gap-4">
        <button className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded">
          Find a Nurse
        </button>
        <button className="bg-white text-black px-6 py-2 rounded border border-gray-300 hover:bg-gray-100">
          Register as a Nurse
        </button>
      </div>
    </section>
  );
}

