import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function TestAuth() {
  // Try to use the auth context
  const auth = useAuth();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Context Test</h1>
      
      <div className="p-4 bg-green-100 border border-green-300 rounded mb-4">
        {auth ? 'Auth context is working properly!' : 'Auth context not found!'}
      </div>
      
      <div className="flex space-x-4">
        <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded">
          Go to Home
        </Link>
        <Link href="/register" className="px-4 py-2 bg-purple-500 text-white rounded">
          Go to Register
        </Link>
      </div>
    </div>
  );
}
