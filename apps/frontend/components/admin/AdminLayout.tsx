import { ReactNode } from 'react';
import Head from 'next/head';
import { useAuth } from '../../lib/auth';
import AdminNavbar from './AdminNavbar';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  requireAdmin?: boolean;
}

const AdminLayout = ({ children, title = 'Admin Dashboard', requireAdmin = true }: AdminLayoutProps) => {
  const { user, loading } = useAuth();
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }
  
  // Access control - require admin role
  if (requireAdmin && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this area.</p>
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 transition duration-200"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>{`${title} | CareConnect Admin`}</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <div className="pt-14">
          {children}
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
