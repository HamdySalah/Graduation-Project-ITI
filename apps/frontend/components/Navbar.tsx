import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-bold">NurseConnect</div>
        <div className="space-x-4">
          <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;