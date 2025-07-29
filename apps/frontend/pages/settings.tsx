import React from 'react';
import { useAuth } from '../lib/auth';
import CommonLayout from '../components/CommonLayout';
import Link from 'next/link';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  action: string;
  actionType: 'edit' | 'view';
}

const accountSettings: SettingsSection[] = [
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Update your contact information',
    action: 'Edit',
    actionType: 'edit'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage your notification preferences',
    action: 'Edit',
    actionType: 'edit'
  },
  {
    id: 'payment',
    title: 'Payment Information',
    description: 'Manage your payment information',
    action: 'Edit',
    actionType: 'edit'
  }
];

const preferencesSettings: SettingsSection[] = [
  {
    id: 'language',
    title: 'Language',
    description: 'Manage your language preferences',
    action: 'Edit',
    actionType: 'edit'
  },
  {
    id: 'timezone',
    title: 'Time Zone',
    description: 'Manage your time zone',
    action: 'Edit',
    actionType: 'edit'
  }
];

const securitySettings: SettingsSection[] = [
  {
    id: 'password',
    title: 'Password',
    description: 'Change your password',
    action: 'Edit',
    actionType: 'edit'
  },
  {
    id: 'security-settings',
    title: 'Security Settings',
    description: 'Manage your account security',
    action: 'Edit',
    actionType: 'edit'
  }
];

const legalSettings: SettingsSection[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'View our terms of service',
    action: 'View',
    actionType: 'view'
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'View our privacy policy',
    action: 'View',
    actionType: 'view'
  }
];



export default function Settings() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-red-600">Please log in to access settings.</p>
          <div className="mt-4">
            <a href="/login" className="text-blue-600 hover:text-blue-800">Login</a>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSettingClick = (settingId: string) => {
    // Handle setting clicks
    console.log('Setting clicked:', settingId);

    switch (settingId) {
      case 'contact':
        // Navigate to profile page for contact info editing
        window.location.href = '/profile';
        break;
      case 'notifications':
        alert('Notification settings will be available soon!');
        break;
      case 'payment':
        alert('Payment settings will be available soon!');
        break;
      case 'language':
        alert('Language settings will be available soon!');
        break;
      case 'timezone':
        alert('Timezone settings will be available soon!');
        break;
      case 'password':
        alert('Password change will be available soon!');
        break;
      case 'security-settings':
        alert('Security settings will be available soon!');
        break;
      case 'terms':
        alert('Terms of Service will be displayed here!');
        break;
      case 'privacy':
        alert('Privacy Policy will be displayed here!');
        break;
      default:
        console.log('Unknown setting:', settingId);
    }
  };

  const renderSettingsSection = (title: string, settings: SettingsSection[]) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-1">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{setting.title}</h4>
              <p className="text-sm text-gray-500">{setting.description}</p>
            </div>
            <button
              onClick={() => handleSettingClick(setting.id)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              {setting.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CommonLayout activeItem="settings" allowedRoles={['patient', 'nurse']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and settings</p>
        </div>

        <div className="max-w-4xl">
          {/* Account Section */}
          {renderSettingsSection('Account', accountSettings)}

          {/* Preferences Section */}
          {renderSettingsSection('Preferences', preferencesSettings)}

          {/* Security Section */}
          {renderSettingsSection('Security', securitySettings)}

          {/* Legal Section */}
          {renderSettingsSection('Legal', legalSettings)}
        </div>
      </div>
    </CommonLayout>
  );
}
