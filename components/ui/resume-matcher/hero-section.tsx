// src/components/ui/resume-matcher/hero-section.tsx
import React from 'react';
import { Search, Sparkles, TrendingUp, Zap, Code, Users, MapPin } from 'lucide-react';
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

  const popularSearches = [
    { query: 'Software Engineer', icon: Code, color: 'from-blue-500 to-cyan-500' },
    { query: 'Full Stack Developer', icon: Zap, color: 'from-purple-500 to-pink-500' },
    { query: 'Frontend Developer', icon: Sparkles, color: 'from-orange-500 to-red-500' },
    { query: 'Remote', icon: MapPin, color: 'from-green-500 to-emerald-500' }
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
      {/* Animated background patterns */}
      <div>
      <div className="absolute inset-0 opacity-40" style={{
  backgroundImage: `url("data:image/svg+xml,<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><g fill='none' fill-rule='evenodd'><g fill='white' fill-opacity='0.1'><circle cx='7' cy='7' r='7'/><circle cx='53' cy='7' r='7'/><circle cx='7' cy='53' r='7'/><circle cx='53' cy='53' r='7'/></g></g></svg>")`
}}></div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-2xl rotate-12 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-lg rotate-45 animate-ping"></div>
      <div className="absolute bottom-32 right-16 w-8 h-8 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full animate-pulse"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-8 border border-white/20">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            AI-Powered Job Matching
          </div>

          {/* Main heading with gradient text */}
          <h1 className="text-4xl font-extrabold text-white sm:text-6xl md:text-7xl leading-tight">
            Find Your Perfect{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                Tech Job
              </span>
              {/* Decorative underline */}
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
            </span>
          </h1>
          
          <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100 leading-relaxed">
            Discover opportunities matched to your skills with our AI-powered platform. 
            Join thousands of developers who found their dream positions through our curated job listings.
          </p>
          
          {/* Enhanced search bar */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-3 border border-white/20">
                <div className="flex-shrink-0 pl-3">
                  <Search className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, skills, companies, or locations..."
                  className="flex-1 ml-4 outline-none text-gray-800 text-lg placeholder-gray-500 bg-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  className="ml-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Popular searches with icons and colors */}
          <div className="mt-8">
            <p className="text-blue-200 text-sm mb-4 font-medium">Popular Searches:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularSearches.map(({ query, icon: Icon, color }, index) => (
                <button
                  key={query}
                  onClick={() => handleQuickSearch(query)}
                  className={`group inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 hover:shadow-lg`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-5 h-5 mr-2 bg-gradient-to-br ${color} rounded p-0.5`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Stats section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                icon: TrendingUp, 
                number: '10,000+', 
                label: 'Active Jobs',
                color: 'from-green-400 to-emerald-500'
              },
              { 
                icon: Users, 
                number: '500+', 
                label: 'Top Companies',
                color: 'from-blue-400 to-cyan-500'
              },
              { 
                icon: Zap, 
                number: '95%', 
                label: 'Match Success',
                color: 'from-purple-400 to-pink-500'
              }
            ].map(({ icon: Icon, number, label, color }, index) => (
              <div 
                key={label} 
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${color} rounded-xl mb-4 group-hover:rotate-12 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{number}</div>
                <div className="text-blue-200 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <div className="text-blue-200 text-sm">
              Ready to get started?
            </div>
            <button className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg">
              Create Free Account
              <Sparkles className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;