// components/profile/SkillsProfile.tsx - CORRECTED VERSION
'use client';

import { useState } from 'react';
import { UserProfile, Skill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Plus, 
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SkillsProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  isPro: boolean;
  onSubscribe: () => void;
  onAddSkill: (name: string, category?: string) => Promise<Skill>;  // ✅ Added missing props
  onRemoveSkill: (skillId: number) => Promise<void>;  // ✅ Added missing props
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;  // ✅ Added missing props
}

const SKILL_SUGGESTIONS = [
  { name: 'JavaScript', category: 'programming' },
  { name: 'TypeScript', category: 'programming' },
  { name: 'Python', category: 'programming' },
  { name: 'Java', category: 'programming' },
  { name: 'React', category: 'framework' },
  { name: 'Vue.js', category: 'framework' },
  { name: 'Angular', category: 'framework' },
  { name: 'Node.js', category: 'framework' },
  { name: 'AWS', category: 'tool' },
  { name: 'Docker', category: 'tool' },
  { name: 'Git', category: 'tool' },
  { name: 'MongoDB', category: 'tool' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years' },
  { value: 'mid', label: 'Mid Level', description: '3-5 years' },
  { value: 'senior', label: 'Senior', description: '5-8 years' },
  { value: 'lead', label: 'Lead/Principal', description: '8+ years' },
] as const;

export default function SkillsProfile({ 
  profile, 
  setProfile, 
  isPro, 
  onSubscribe,
  onAddSkill,        // ✅ Use these props from parent
  onRemoveSkill,     // ✅ Use these props from parent
  onUpdateProfile    // ✅ Use these props from parent
}: SkillsProfileProps) {
  const [showSkillsEditor, setShowSkillsEditor] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  // ✅ FIXED: Use the handler props from parent instead of local logic
  const handleAddSkill = async (skillName: string) => {
    if (!skillName.trim()) return;
    
    const existingSkill = profile.skills.find(
      skill => skill.name.toLowerCase() === skillName.trim().toLowerCase()
    );
    
    if (existingSkill) {
      setLocalError('Skill already exists');
      setNewSkill('');
      setShowSuggestions(false);
      setTimeout(() => setLocalError(''), 3000);
      return;
    }

    try {
      setIsLoading(true);
      await onAddSkill(skillName.trim());  // ✅ Use parent handler
      setNewSkill('');
      setShowSuggestions(false);
      setLocalError('');
    } catch (error) {
      setLocalError('Failed to add skill. Please try again.');
      setTimeout(() => setLocalError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Use the handler props from parent
  const handleRemoveSkill = async (skillId: number) => {
    try {
      setIsLoading(true);
      await onRemoveSkill(skillId);  // ✅ Use parent handler
    } catch (error) {
      setLocalError('Failed to remove skill. Please try again.');
      setTimeout(() => setLocalError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Use correct property names and parent handler
  const updateExperience = async (level: UserProfile['experience_level']) => {
    setProfile(prev => ({ ...prev, experience_level: level }));
    await onUpdateProfile({ experience_level: level });
  };

  const updateLocation = async (location: UserProfile['preferred_location']) => {
    setProfile(prev => ({ ...prev, preferred_location: location }));
    await onUpdateProfile({ preferred_location: location });
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (profile.skills.length > 0) score += 30;
    if (profile.skills.length >= 5) score += 20;
    if (profile.experience_level) score += 20;  // ✅ Fixed property name
    if (profile.preferred_location) score += 15;  // ✅ Fixed property name
    if (profile.salary_min && profile.salary_max) score += 15;  // ✅ Fixed property names
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Building className="h-5 w-5" />
          Skills Profile
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            FREE
          </span>
        </CardTitle>
        <CardDescription>
          Build your professional profile and showcase your skills to employers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Error Alert */}
        {localError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{localError}</AlertDescription>
          </Alert>
        )}
        
        {/* Skills Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Your Skills</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSkillsEditor(!showSkillsEditor)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : showSkillsEditor ? 'Done' : 'Edit Skills'}
            </Button>
          </div>
          
          {showSkillsEditor ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => {
                      setNewSkill(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                      setLocalError('');
                    }}
                    placeholder="Add a skill (e.g., React, Python, AWS)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSkill.trim()) {
                        e.preventDefault();
                        handleAddSkill(newSkill);
                      }
                    }}
                    disabled={isLoading}
                  />
                  
                  {/* Skill Suggestions Dropdown */}
                  {showSuggestions && newSkill && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {SKILL_SUGGESTIONS
                        .filter(skill => 
                          skill.name.toLowerCase().includes(newSkill.toLowerCase()) &&
                          !profile.skills.some(userSkill => userSkill.name.toLowerCase() === skill.name.toLowerCase())
                        )
                        .slice(0, 5)
                        .map((skill, index) => (
                          <button
                            key={index}
                            onClick={() => handleAddSkill(skill.name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm first:rounded-t-lg last:rounded-b-lg"
                            disabled={isLoading}
                          >
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-gray-500 ml-2 text-xs capitalize">
                              {skill.category}
                            </span>
                          </button>
                        ))}
                      {newSkill.trim() && !SKILL_SUGGESTIONS.some(skill => 
                        skill.name.toLowerCase() === newSkill.toLowerCase()
                      ) && (
                        <button
                          onClick={() => handleAddSkill(newSkill)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm rounded-lg border-t"
                          disabled={isLoading}
                        >
                          <span className="font-medium">Add "{newSkill}"</span>
                          <span className="text-gray-500 ml-2 text-xs">Custom skill</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAddSkill(newSkill)}
                  disabled={!newSkill.trim() || isLoading}
                  className="btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick Add Popular Skills */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Popular skills:</p>
                <div className="flex flex-wrap gap-1">
                  {SKILL_SUGGESTIONS
                    .filter(skill => !profile.skills.some(userSkill => userSkill.name === skill.name))
                    .slice(0, 6)
                    .map((skill, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddSkill(skill.name)}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors disabled:opacity-50"
                        disabled={isLoading}
                      >
                        + {skill.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <div key={skill.id} className="group relative">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                    {skill.name}
                    <button
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors disabled:opacity-50"
                      title="Remove skill"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </button>
                  </span>
                </div>
              ))}
              {profile.skills.length === 0 && (
                <button 
                  onClick={() => setShowSkillsEditor(true)}
                  className="px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400 transition-colors"
                >
                  + Add your first skill
                </button>
              )}
            </div>
          )}
        </div>

        {/* Experience Level */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Experience Level
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => updateExperience(level.value)}
                className={`p-3 text-sm border rounded-lg transition-colors text-center ${
                  profile.experience_level === level.value  // ✅ Fixed property name
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-gray-500">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Job Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Preferred Location
            </label>
            <select 
              value={profile.preferred_location}  // ✅ Fixed property name
              onChange={(e) => updateLocation(e.target.value as UserProfile['preferred_location'])}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="no-preference">No preference</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salary Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={profile.salary_min || ''}  // ✅ Fixed property name
                onChange={(e) => {
                  const value = parseInt(e.target.value) || undefined;
                  setProfile(prev => ({ ...prev, salary_min: value }));
                }}
                onBlur={() => onUpdateProfile({ salary_min: profile.salary_min })}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={profile.salary_max || ''}  // ✅ Fixed property name
                onChange={(e) => {
                  const value = parseInt(e.target.value) || undefined;
                  setProfile(prev => ({ ...prev, salary_max: value }));
                }}
                onBlur={() => onUpdateProfile({ salary_max: profile.salary_max })}
                className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
            <span className="text-sm font-semibold text-blue-600">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600">
            {completeness < 100 ? (
              <>Complete your profile to get better job matches. </>
            ) : (
              "Great! Your profile is complete. "
            )}
            {!isPro && (
              <button 
                onClick={onSubscribe}
                className="text-blue-600 hover:underline ml-1"
              >
                Upgrade to PRO for AI matching
              </button>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}