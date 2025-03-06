'use client';

import { Card, CardContent } from "@/components/ui/card";

export default function AboutUsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">About JobMatcher</h1>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            At JobMatcher, we're on a mission to transform how tech professionals find their ideal roles. 
            We believe that the right job match isn't just about matching keywords—it's about understanding 
            the unique skills, experiences, and career aspirations of every individual.
          </p>
          <p className="text-gray-700">
            By leveraging cutting-edge technology and deep industry expertise, we're creating a more 
            efficient and personalized job search experience for both candidates and employers.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            JobMatcher was founded in 2023 by a team of tech professionals who experienced firsthand 
            the challenges of finding the right job fit in the rapidly evolving tech landscape. 
            After spending countless hours sifting through generic job listings that didn't align 
            with their skills or career goals, they decided there had to be a better way.
          </p>
          <p className="text-gray-700">
            Starting with a simple idea—that resume analysis could intelligently match candidates with 
            suitable job opportunities—JobMatcher has grown into a comprehensive platform that serves 
            thousands of tech professionals and companies across the industry.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">How We're Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-2">Smart Matching</h3>
              <p className="text-gray-700">
                Our proprietary algorithm analyzes not just keywords, but context, skills relationships, 
                and industry trends to create more meaningful job matches.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Curated Listings</h3>
              <p className="text-gray-700">
                We focus on quality over quantity, ensuring that each job listing meets our standards 
                for transparency and completeness.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Premium Insights</h3>
              <p className="text-gray-700">
                Our PRO subscribers get exclusive access to salary data, company culture insights, 
                and early access to premium job opportunities.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-2">Community-Focused</h3>
              <p className="text-gray-700">
                We're building more than a job board—we're creating a community where tech professionals 
                can grow their careers with confidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Our Team</h2>
          <p className="text-gray-700 mb-4">
            We're a diverse team of engineers, data scientists, HR specialists, and industry veterans 
            who are passionate about creating better career opportunities in tech. With backgrounds 
            spanning from startups to Fortune 500 companies, our team brings a wealth of experience 
            and perspectives to the table.
          </p>
          <p className="text-gray-700">
            United by our commitment to innovation, transparency, and user-centered design, we're working 
            every day to make JobMatcher the most trusted platform for tech career advancement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}