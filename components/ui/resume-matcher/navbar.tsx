import React from 'react';
import  LoginButton  from '../login-button';
import Link from 'next/link';
import { Search } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              JobMatcher
            </Link>
            <div className="hidden md:block ml-10 space-x-8">
              
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                Profile
              </Link>
              <Link href="/applications" className="text-gray-700 hover:text-blue-600">
                Applications
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">
                 Pricing
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <LoginButton />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;