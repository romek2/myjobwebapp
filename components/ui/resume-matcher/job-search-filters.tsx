// src/components/job-search-filters.tsx - Cool Modern Version
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, DollarSign, Sparkles, Filter, Target, Zap } from 'lucide-react';

interface JobSearchFiltersProps {
  filters: {
    title: string;
    location: string;
    minSalary: string;
  };
  onChange: (filters: {
    title: string;
    location: string;
    minSalary: string;
  }) => void;
}

const JobSearchFilters: React.FC<JobSearchFiltersProps> = ({ filters, onChange }) => {
  const handleChange = (key: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...filters,
      [key]: e.target.value
    });
  };

  const clearFilters = () => {
    onChange({
      title: '',
      location: '',
      minSalary: ''
    });
  };

  const hasActiveFilters = filters.title || filters.location || filters.minSalary;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Smart Filters</h2>
            <p className="text-purple-100 text-sm">Refine your job search</p>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3">
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full hover:bg-white/30 transition-all duration-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Job Title Filter */}
        <div className="space-y-2">
          <label htmlFor="title" className="flex items-center text-sm font-semibold text-gray-700 gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <Search className="h-3 w-3 text-white" />
            </div>
            Job Title
          </label>
          <div className="relative">
            <Input
              id="title"
              placeholder="e.g., Software Engineer, Full Stack Developer"
              value={filters.title}
              onChange={handleChange('title')}
              className="pl-4 pr-4 py-3 rounded-xl border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-white/80"
            />
            {filters.title && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Popular Job Titles */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['Developer', 'Designer', 'Sales', 'Writer'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onChange({ ...filters, title: suggestion })}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300 hover:scale-105 border border-blue-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <label htmlFor="location" className="flex items-center text-sm font-semibold text-gray-700 gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            Location
          </label>
          <div className="relative">
            <Input
              id="location"
              placeholder="e.g., Remote, USA, Poland"
              value={filters.location}
              onChange={handleChange('location')}
              className="pl-4 pr-4 py-3 rounded-xl border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-white/80"
            />
            {filters.location && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Popular Locations */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['Remote', 'USA', 'Poland', 'Philippines'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onChange({ ...filters, location: suggestion })}
                className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all duration-300 hover:scale-105 border border-green-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Salary Filter */}
        <div className="space-y-2">
          <label htmlFor="minSalary" className="flex items-center text-sm font-semibold text-gray-700 gap-2">
            <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-3 w-3 text-white" />
            </div>
            Minimum Salary
          </label>
          <div className="relative">
            <Input
              id="minSalary"
              type="number"
              placeholder="e.g., 75000"
              value={filters.minSalary}
              onChange={handleChange('minSalary')}
              className="pl-4 pr-4 py-3 rounded-xl border-gray-200 bg-white/60 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-white/80"
            />
            {filters.minSalary && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Salary Ranges */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['50000', '75000', '100000', '150000'].map((salary) => (
              <button
                key={salary}
                onClick={() => onChange({ ...filters, minSalary: salary })}
                className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-all duration-300 hover:scale-105 border border-yellow-200"
              >
                ${parseInt(salary).toLocaleString()}+
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="pt-4 border-t border-gray-200">
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all duration-300 hover:scale-105 py-3 rounded-xl font-semibold"
            onClick={() => onChange(filters)}
          >
            <Target className="h-4 w-4 mr-2" />
            Apply Smart Filters
          </Button>
        </div>

        {/* Filter Stats */}
        {hasActiveFilters && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-semibold text-purple-800">Active Filters</span>
            </div>
            <div className="space-y-1 text-xs text-purple-700">
              {filters.title && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Title: {filters.title}</span>
                </div>
              )}
              {filters.location && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Location: {filters.location}</span>
                </div>
              )}
              {filters.minSalary && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Min Salary: ${parseInt(filters.minSalary).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pro Tip */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 text-sm mb-1">Pro Tip</h4>
              <p className="text-blue-700 text-xs">
                Use specific job titles and include "Remote" in location for the best results. 
                Leave salary blank to see all opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearchFilters;