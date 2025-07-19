import React from 'react';
import { useAuth } from '../lib/auth';
import Layout from '../components/Layout';
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

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/dashboard' },
  { id: 'patients', label: 'My Patients', icon: '👥', href: '/requests' },
  { id: 'profile', label: 'My Profile', icon: '👤', href: '/profile' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings', active: true },
  { id: 'help', label: 'Help', icon: '❓', href: '/help' }
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user.name || 'User'}</h2>
              <p className="text-sm text-gray-600 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="p-8">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

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
      </div>
    </div>
  );
}
