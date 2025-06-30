import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo/Brand */}
        <div className="text-3xl font-extrabold text-white animate-pulse">
          <span className="text-yellow-300">Nurse</span><span className="text-white">Connect</span>
        </div>

        {/* Navigation Links */}
        <div className="space-x-6">
          <Link href="#home" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Home
          </Link>
          <Link href="#how-it-works" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            About
          </Link>
          <Link href="#platform-features" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Features
          </Link>
          <Link href="#contact-us" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Contact
          </Link>
          <Link href="/login" className="text-white hover:text-yellow-300 transition duration-300 font-semibold hover:scale-110">
            Login
          </Link>
          <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-full hover:bg-yellow-300 hover:text-blue-800 transition duration-300 font-semibold shadow-md hover:shadow-lg">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;