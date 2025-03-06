'use client';

import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and about section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-blue-600">
              JobMatcher
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Matching tech professionals with their ideal job opportunities through smart resume analysis.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Jobs</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
                  Latest Jobs
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="text-sm text-gray-600 hover:text-blue-600">
                  Job Alerts
                </Link>
              </li>
             
              <li>
                <Link href="/?tech=JavaScript" className="text-sm text-gray-600 hover:text-blue-600">
                  JavaScript Jobs
                </Link>
              </li>
              <li>
                <Link href="/?location=Remote" className="text-sm text-gray-600 hover:text-blue-600">
                  Remote Jobs
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-blue-600">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-blue-600">
                  Pricing
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600">
                  Resume Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-blue-600">
                  Interview Prep
                </a>
              </li>
            
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="/about" className="text-sm text-gray-600 hover:text-blue-600">
                  About Us
                </a>
              </li>
              <li>
                <a href="" className="text-sm text-gray-600 hover:text-blue-600">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-sm text-gray-600 hover:text-blue-600">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-sm text-gray-600 hover:text-blue-600">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            &copy; {currentYear} JobMatcher. All rights reserved.
          </p>
         
        </div>
      </div>
    </footer>
  );
}