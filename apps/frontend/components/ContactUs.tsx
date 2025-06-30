import React from "react";

export default function ContactUs() {
  return (
    <section className="bg-white py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-2">Contact Us</h2>
      <p className="text-center mb-8">
        Have questions or want to partner with us? We’d love to hear from you.
      </p>
      <div className="flex flex-col md:flex-row justify-center gap-10">
        <div>
          <p className="mb-2">📧 support@nurseconnect.com</p>
          <p className="mb-2">📞 +20 100 123 4567</p>
          <p className="mb-2">📍 Assiut, Egypt</p>
        </div>
        <form className="flex flex-col gap-4 w-full max-w-md">
          <input type="text" placeholder="Your name" className="border p-2 rounded" />
          <input type="email" placeholder="Your Email" className="border p-2 rounded" />
          <textarea placeholder="Your message" rows={4} className="border p-2 rounded" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
