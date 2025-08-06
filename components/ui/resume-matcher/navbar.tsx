'use client'
import React, { useState, useEffect } from 'react';
import LoginButton from '../login-button';
import Link from 'next/link';
import { Menu, X, Zap, Search, Bell, User, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5' 
        : 'bg-gradient-to-r from-white via-blue-50/30 to-white border-b border-gray-100/50'
    }`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section with Animation */}
          <div className="flex items-center group">
            <Link href="/" className="flex items-center space-x-2 group-hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Zap className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobMatcher
              </span>
            </Link>
            
            {/* Desktop navigation with cool hover effects */}
            <div className="hidden md:flex ml-12 space-x-1">
              {[
                { href: '/profile', label: 'Profile', icon: User },
                { href: '/alerts', label: 'Alerts', icon: Bell },
                { href: '/pricing', label: 'Pricing', icon: Sparkles }
              ].map(({ href, label, icon: Icon }) => (
                <Link 
                  key={href}
                  href={href} 
                  className="relative group px-4 py-2 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 focus:outline-none focus:ring-0 focus:border-none outline-none"
                >
                  <div className="flex items-center space-x-2 text-gray-700 group-hover:text-blue-600 transition-colors duration-300">
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full"></div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile menu button with cool animation */}
          <div className="flex md:hidden">
            <button 
              onClick={toggleMenu}
              className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                isMenuOpen 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-6">
                <Menu 
                  className={`absolute top-0 left-0 w-6 h-6 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0 rotate-180' : 'opacity-100 rotate-0'
                  }`}
                />
                <X 
                  className={`absolute top-0 left-0 w-6 h-6 transition-all duration-300 ${
                    isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
                  }`}
                />
              </div>
            </button>
          </div>
          
          {/* Desktop CTA Section */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <LoginButton />
              {/* Floating notification dot */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu with slide animation and backdrop */}
      <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        ></div>
        
        {/* Menu Panel */}
        <div className={`absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-2xl transition-transform duration-500 ease-out ${
          isMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="px-4 py-6 space-y-1">
            {[
              { href: '/profile', label: 'Profile', icon: User, color: 'from-blue-500 to-cyan-500' },
              { href: '/alerts', label: 'Alerts', icon: Bell, color: 'from-purple-500 to-pink-500' },
              { href: '/pricing', label: 'Pricing', icon: Sparkles, color: 'from-orange-500 to-red-500' }
            ].map(({ href, label, icon: Icon, color }, index) => (
              <Link 
                key={href}
                href={href} 
                className={`group flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-300 hover:bg-gradient-to-r hover:${color} hover:text-white hover:shadow-lg hover:scale-105 transform ${
                  isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300">
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
                </div>
                <span className="text-lg font-semibold text-gray-700 group-hover:text-white">{label}</span>
              </Link>
            ))}
          </div>
          
          {/* Mobile CTA Section */}
          <div className="px-4 pb-6 pt-4 border-t border-gray-100">
            <div className={`space-y-4 transition-all duration-500 ${
              isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`} style={{ transitionDelay: '300ms' }}>
              <div className="flex items-center justify-center space-x-4">
                <Search className="w-6 h-6 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors duration-300" />
                <div className="w-px h-6 bg-gray-200"></div>
                <div className="flex-1">
                  <LoginButton />
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-white text-blue-600 py-2 px-3 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors duration-300">
                    Search Jobs
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-3 rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-300">
                    Upload Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;