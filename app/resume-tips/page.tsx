'use client';

import { Card, CardContent } from "@/components/ui/card";

export default function ResumeTipsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Resume Tips</h1>
      <p className="text-gray-600 mb-8">Optimize your resume to stand out and get more interviews</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Resume Fundamentals</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-3">Structure & Format</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Use a clean, professional template with consistent formatting</li>
                <li>• Keep your resume to 1-2 pages (1 page for less than 10 years of experience)</li>
                <li>• Use standard sections: Contact Info, Summary, Experience, Skills, Education</li>
                <li>• Save and submit as a PDF to preserve formatting</li>
                <li>• Use a professional, readable font (Arial, Calibri, Helvetica) at 10-12pt size</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-3">Contact Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Include your full name, phone number, and professional email</li>
                <li>• Add your LinkedIn profile and GitHub/portfolio if relevant</li>
                <li>• Location information should include city and state (full address not necessary)</li>
                <li>• Make your name stand out with a slightly larger font size</li>
                <li>• Include a LinkedIn URL that's customized (e.g., linkedin.com/in/yourname)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Content Optimization</h2>
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Professional Summary</h3>
            <p className="text-gray-700 mb-3">
              Your professional summary should be a compelling 3-4 line overview of your career, highlighting your expertise, 
              specialization, and value proposition.
            </p>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Example (Software Engineer):</h4>
              <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                "Full-stack software engineer with 5 years of experience building scalable web applications using React, Node.js, and AWS. 
                Specialized in optimizing performance for high-traffic applications and implementing robust security measures. Proven track 
                record of reducing load times by 40% and implementing CI/CD pipelines that decreased deployment time by 65%."
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Experience Section</h3>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>• List your experience in reverse chronological order (most recent first)</li>
              <li>• Include company name, job title, location, and employment dates (month and year)</li>
              <li>• Use bullet points (4-6 per role) focused on accomplishments, not just responsibilities</li>
              <li>• Start bullet points with strong action verbs (Developed, Implemented, Led, Optimized)</li>
              <li>• Quantify results with metrics whenever possible (%, $, time saved)</li>
            </ul>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Example (Before):</h4>
              <div className="bg-gray-50 p-4 rounded-md text-gray-800 mb-4">
                "Responsible for developing new features for the company website."
              </div>
              <h4 className="font-medium mb-2">Example (After):</h4>
              <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                "Developed and implemented a responsive checkout system that increased mobile conversion rates by 23% and reduced cart abandonment by 15%."
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Skills Section</h3>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li>• Organize skills into categories (Programming Languages, Frameworks, Tools)</li>
              <li>• Prioritize technical skills relevant to the job you're applying for</li>
              <li>• List skills in order of proficiency or relevance</li>
              <li>• Include both hard technical skills and relevant soft skills</li>
              <li>• Avoid vague skills like "teamwork" or "communication" without context</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="text-blue-800 font-medium mb-2">Pro Tip:</h4>
              <p className="text-gray-700">
                Analyze the job description for keywords and ensure your skills section includes the specific technologies and 
                tools mentioned in the posting. Our Workr platform automatically highlights skill matches between your 
                resume and job listings to help you target the right opportunities.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Tech Resume Specialization</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-3">Technical Projects</h3>
              <p className="text-gray-700 mb-3">
                For tech roles, include a dedicated projects section with:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Project name and brief description</li>
                <li>• Technologies and methodologies used</li>
                <li>• Your specific role and contributions</li>
                <li>• Measurable outcomes or achievements</li>
                <li>• Links to GitHub repositories or live demos</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-3">ATS Optimization</h3>
              <p className="text-gray-700 mb-3">
                To pass Applicant Tracking Systems (ATS):
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Use standard section headings (Experience, not "Work History")</li>
                <li>• Avoid tables, columns, headers/footers and graphics</li>
                <li>• Match keywords from the job description</li>
                <li>• Spell out acronyms at least once (e.g., "React.js (JS)")</li>
                <li>• Use common file naming: "FirstName-LastName-Resume.pdf"</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Resume Checklist</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-700 mb-4">
              Before submitting your resume, make sure you've checked each of these items:
            </p>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Proofread for spelling and grammar errors</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Used specific metrics and achievements</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Matched keywords from target job descriptions</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Removed outdated experience (10-15 years old)</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Ensured consistent formatting and spacing</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Verified all links are functional</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Removed personal information (age, marital status)</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Saved as a PDF with a professional filename</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Tailored for the specific role/company</span>
              </div>
              <div className="flex items-start">
                <input type="checkbox" className="mt-1 mr-2" />
                <span className="text-gray-700">Had someone else review it</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}