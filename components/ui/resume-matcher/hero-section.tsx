// src/components/hero-section.tsx
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Find Your Perfect <span className="text-blue-600">Tech Job</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover opportunities matched to your skills. Browse thousands of tech jobs from top companies.
          </p>
          
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
              <Search className="w-5 h-5 text-gray-400 ml-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, skills, or companies..."
                className="flex-1 ml-3 outline-none text-gray-700"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button className="ml-2" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
            <span>Popular: </span>
            <button 
              onClick={() => handleQuickSearch('Software Engineer')}
              className="hover:text-blue-600"
            >
              Software Engineer
            </button>
            <button 
              onClick={() => handleQuickSearch('Full Stack Developer')}
              className="hover:text-blue-600"
            >
              Full Stack Developer
            </button>
            <button 
              onClick={() => handleQuickSearch('Frontend Developer')}
              className="hover:text-blue-600"
            >
              Frontend Developer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;