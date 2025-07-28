import { useState } from 'react';
import { useAuth } from '../lib/auth';
import Layout from '../components/Layout';
import Link from 'next/link';
import PatientLayout from '../components/PatientLayout';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'How do I update my profile information?',
    answer: 'You can update your profile information by going to Settings > Account > Contact Information, or by visiting your Profile page directly.'
  },
  {
    id: '2',
    question: 'How do I change my password?',
    answer: 'To change your password, go to Settings > Security > Password and follow the instructions.'
  },
  {
    id: '3',
    question: 'How do I manage my notifications?',
    answer: 'You can manage your notification preferences by going to Settings > Account > Notifications.'
  },
  {
    id: '4',
    question: 'How do I view my request history?',
    answer: 'You can view your request history by clicking on "My Patients" in the navigation menu or visiting the Requests page.'
  },
  {
    id: '5',
    question: 'How do I contact support?',
    answer: 'You can contact our support team by emailing support@nurseplatform.com or calling our helpline at 1-800-NURSE-HELP.'
  }
];



export default function Help() {
  const { user } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Please log in to access help.</p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
          </div>
        </div>
      </Layout>
    );
  }

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <PatientLayout activeItem="help" title="Help & Support">
      <div className="max-w-4xl">

            {/* Contact Support Section */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Need Immediate Help?</h2>
              <p className="text-blue-800 mb-4">
                Our support team is here to help you with any questions or issues you may have.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:support@nurseplatform.com"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  📧 Email Support
                </a>
                <a
                  href="tel:1-800-NURSE-HELP"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  📞 Call Support
                </a>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <span className="text-gray-500">
                        {expandedFAQ === faq.id ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/profile"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">👤 My Profile</h3>
                  <p className="text-sm text-gray-600">Update your personal information and preferences</p>
                </Link>
                <Link
                  href="/settings"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">⚙️ Settings</h3>
                  <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
                </Link>
                <Link
                  href="/requests"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">👥 My Patients</h3>
                  <p className="text-sm text-gray-600">View and manage your patient requests</p>
                </Link>
                <Link
                  href="/visit-history"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">📋 Visit History</h3>
                  <p className="text-sm text-gray-600">View your complete visit history</p>
                </Link>
              </div>
            </div>
          </div>
      </div>
    </PatientLayout>
  );
}
