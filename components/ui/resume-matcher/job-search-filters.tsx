// src/components/job-search-filters.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <Input
            id="title"
            placeholder="e.g., Software Engineer"
            value={filters.title}
            onChange={handleChange('title')}
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            id="location"
            placeholder="e.g., Remote, London"
            value={filters.location}
            onChange={handleChange('location')}
          />
        </div>

        <div>
          <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Salary
          </label>
          <Input
            id="minSalary"
            type="number"
            placeholder="e.g., 50000"
            value={filters.minSalary}
            onChange={handleChange('minSalary')}
          />
        </div>

        <Button 
          className="w-full"
          onClick={() => onChange(filters)}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobSearchFilters;