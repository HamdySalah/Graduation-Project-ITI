import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-10 px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold mb-2">NurseConnect</h4>
          <p>
            Connecting patients with verified nurses for professional home healthcare services.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#">🔗</a>
            <a href="#">📘</a>
            <a href="#">🐦</a>
            <a href="#">📸</a>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-2">For Patients</h4>
          <ul className="space-y-1">
            <li><a href="#">How It Works</a></li>
            <li><a href="#">Services Offered</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Safety Information</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">For Nurses</h4>
          <ul className="space-y-1">
            <li><a href="#">Join Our Network</a></li>
            <li><a href="#">Verification Process</a></li>
            <li><a href="#">Earnings Calculator</a></li>
            <li><a href="#">Nurse Resources</a></li>
            <li><a href="#">Referral Program</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-2">Company</h4>
          <ul className="space-y-1">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Partnerships</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-sm mt-8">
        © 2025 NurseConnect. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
      </p>
    </footer>
  );
}
