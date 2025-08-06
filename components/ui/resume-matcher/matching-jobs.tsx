// components/ui/resume-matcher/matching-jobs.tsx - Cool Modern Version
import React, { useState } from 'react';
import { Job } from '@/types/job';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Send, 
  Building, 
  MapPin, 
  DollarSign, 
  Clock,
  Star,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Search,
  Eye
} from 'lucide-react';
import ApplicationModal from './ApplicationModal';

interface MatchingJobsProps {
 jobs: Job[];
 isLoading: boolean;
 currentPage: number;
 totalPages: number;
 onPageChange: (page: number) => void;
}

const MatchingJobs: React.FC<MatchingJobsProps> = ({ 
 jobs, 
 isLoading,
 currentPage,
 totalPages,
 onPageChange
}) => {
 const [selectedJob, setSelectedJob] = useState<Job | null>(null);

 if (isLoading) {
   return (
     <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5 p-12">
       <div className="text-center">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
           <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
         </div>
         <h3 className="text-xl font-semibold text-gray-900 mb-2">Finding Perfect Matches</h3>
         <p className="text-gray-600">Searching through thousands of opportunities...</p>
       </div>
     </div>
   );
 }

 if (jobs.length === 0) {
   return (
     <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-black/5">
       <div className="p-12 text-center">
         <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-6 shadow-lg">
           <Search className="h-10 w-10 text-gray-400" />
         </div>
         <h3 className="text-2xl font-semibold mb-3 text-gray-900">No jobs found</h3>
         <p className="text-gray-600 mb-6 max-w-md mx-auto">
           No jobs matching your criteria were found. Try adjusting your search filters or broadening your requirements.
         </p>
         <div className="flex flex-col sm:flex-row gap-3 justify-center">
           <Button variant="outline" className="hover:shadow-md transition-all duration-300">
             <Target className="h-4 w-4 mr-2" />
             Adjust Filters
           </Button>
           <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
             <Sparkles className="h-4 w-4 mr-2" />
             Browse All Jobs
           </Button>
         </div>
       </div>
     </div>
   );
 }

 return (
   <div className="space-y-6">
     {/* Results Header */}
     <div className="flex items-center justify-between">
       <div className="flex items-center space-x-3">
         <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
           <TrendingUp className="h-4 w-4 text-white" />
         </div>
         <h2 className="text-2xl font-bold text-gray-900">
           Found {jobs.length} Perfect Matches
         </h2>
       </div>
       <div className="text-sm text-gray-500">
         Showing page {currentPage} of {totalPages}
       </div>
     </div>
     
     {/* Job Cards */}
     <div className="space-y-4">
       {jobs.map((job, index) => (
         <div 
           key={job.id} 
           className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden"
           style={{ animationDelay: `${index * 100}ms` }}
         >
           {/* Match Score Banner */}
           {job.match > 0 && (
             <div className={`px-4 py-2 text-center text-white text-sm font-bold ${
               job.match >= 90 
                 ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                 : job.match >= 70 
                 ? 'bg-gradient-to-r from-blue-500 to-cyan-600'
                 : 'bg-gradient-to-r from-yellow-500 to-orange-600'
             }`}>
               <div className="flex items-center justify-center gap-2">
                 <Star className="h-4 w-4" />
                 {job.match}% Perfect Match
                 <Sparkles className="h-4 w-4" />
               </div>
             </div>
           )}

           <div className="p-6">
             <div className="flex justify-between items-start mb-4">
               <div className="flex-1">
                 <div className="flex items-start justify-between mb-3">
                   <div>
                     <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                       {job.title}
                     </h3>
                     <div className="flex items-center space-x-4 text-sm text-gray-600">
                       <span className="flex items-center bg-gray-50 px-3 py-1 rounded-lg">
                         <Building className="h-4 w-4 mr-2 text-blue-500" />
                         <span className="font-medium">{job.company}</span>
                       </span>
                       <span className="flex items-center">
                         <MapPin className="h-4 w-4 mr-1 text-green-500" />
                         {job.location}
                       </span>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-sm text-gray-500 flex items-center">
                       <Clock className="h-4 w-4 mr-1" />
                       {new Date(job.postedAt).toLocaleDateString()}
                     </div>
                   </div>
                 </div>

                 {/* Job Details */}
                 <div className="space-y-3">
                   {job.salary && (
                     <div className="flex items-center text-sm">
                       <div className="flex items-center bg-green-50 px-3 py-1 rounded-lg">
                         <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                         <span className="font-bold text-green-800">{job.salary}</span>
                       </div>
                     </div>
                   )}

                   {/* Job Description */}
                   <div className="bg-gray-50/70 rounded-xl p-4">
                     <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                       {job.description}
                     </p>
                   </div>

                 

                   {/* Action Buttons */}
                   <div className="flex gap-3 pt-4">
                     <a
                       href={job.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="group/btn flex-1 inline-flex items-center justify-center text-sm bg-white border-2 border-gray-200 text-gray-700 px-4 py-3 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 hover:shadow-md font-medium"
                     >
                       <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                       View Details
                       <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                     </a>
                     <button
                       onClick={() => setSelectedJob(job)}
                       className="group/btn flex-1 inline-flex items-center justify-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                     >
                       <Send className="h-4 w-4 mr-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                       Apply Now
                       <Zap className="h-3 w-3 ml-2" />
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       ))}
     </div>

     {/* Enhanced Pagination */}
     {totalPages > 1 && (
       <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6">
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-3">
             <Button
               variant="outline"
               onClick={() => onPageChange(currentPage - 1)}
               disabled={currentPage === 1}
               className="bg-white/70 hover:bg-white/90 border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-105"
             >
               <ChevronLeft className="h-4 w-4 mr-2" /> 
               Previous
             </Button>
             
             {/* Page Numbers */}
             <div className="flex items-center space-x-2">
               {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                 const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                 return (
                   <button
                     key={pageNum}
                     onClick={() => onPageChange(pageNum)}
                     className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-300 ${
                       currentPage === pageNum
                         ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                         : 'bg-white/70 text-gray-600 hover:bg-white/90 hover:text-blue-600'
                     }`}
                   >
                     {pageNum}
                   </button>
                 );
               })}
             </div>
             
             <Button
               variant="outline"
               onClick={() => onPageChange(currentPage + 1)}
               disabled={currentPage === totalPages}
               className="bg-white/70 hover:bg-white/90 border-gray-200 hover:shadow-md transition-all duration-300 hover:scale-105"
             >
               Next 
               <ChevronRight className="h-4 w-4 ml-2" />
             </Button>
           </div>
           
           <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
             Showing <span className="font-semibold">{((currentPage - 1) * 10) + 1}</span> to{' '}
             <span className="font-semibold">{Math.min(currentPage * 10, jobs.length * totalPages)}</span> of{' '}
             <span className="font-semibold">{jobs.length * totalPages}</span> jobs
           </div>
         </div>
       </div>
     )}

     {/* Application Modal */}
     {selectedJob && (
       <ApplicationModal
         job={selectedJob}
         onClose={() => setSelectedJob(null)}
         onSuccess={() => setSelectedJob(null)}
       />
     )}

     {/* Success Tips */}
     <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
       <div className="flex items-start gap-4">
         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
           <Target className="h-5 w-5 text-white" />
         </div>
         <div>
           <h3 className="font-bold text-blue-900 mb-2">Job Search Tips</h3>
           <ul className="text-sm text-blue-800 space-y-1">
             <li className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
               Apply to jobs with 70%+ match score for better success rates
             </li>
             <li className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
               Customize your application for each position
             </li>
             <li className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
               Apply within 24-48 hours of posting for maximum visibility
             </li>
           </ul>
         </div>
       </div>
     </div>
   </div>
 );
};

export default MatchingJobs;