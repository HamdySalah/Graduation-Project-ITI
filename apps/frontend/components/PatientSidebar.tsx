import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

interface PatientSidebarProps {
  activeItem?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/dashboard' },
  { id: 'requests', label: 'My Requests', icon: '📋', href: '/requests' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', href: '/notifications' },
  { id: 'payments', label: 'Payments', icon: '💳', href: '/payments' },
  { id: 'profile', label: 'Profile', icon: '👤', href: '/profile' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
  { id: 'help', label: 'Help', icon: '❓', href: '/help' }
];

export default function PatientSidebar({ activeItem }: PatientSidebarProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Auto-detect active item based on current route if not provided
  const currentActiveItem = activeItem || (() => {
    const pathname = router.pathname;
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname.startsWith('/requests')) return 'requests';
    if (pathname.startsWith('/notifications')) return 'notifications';
    if (pathname.startsWith('/payments')) return 'payments';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/help')) return 'help';
    return '';
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        {/* User Profile Section */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{user?.name || 'Patient'}</h2>
            <p className="text-sm text-gray-600 capitalize">{user?.role || 'Patient'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                currentActiveItem === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
