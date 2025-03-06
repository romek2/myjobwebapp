'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function InterviewPrepPage() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const toggleQuestion = (id: string) => {
    if (expandedQuestion === id) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(id);
    }
  };

  // Define the question data
  const technicalQuestions = [
    {
      id: 'q1',
      question: 'What is the difference between let, const, and var in JavaScript?',
      answer: '<p class="mb-2"><strong>var:</strong> Function-scoped, can be redeclared and updated, hoisted to the top of its scope and initialized with undefined.</p><p class="mb-2"><strong>let:</strong> Block-scoped, can be updated but not redeclared within its scope, hoisted to the top of its scope but not initialized.</p><p><strong>const:</strong> Block-scoped, cannot be updated or redeclared, must be initialized at declaration, hoisted to the top of its scope but not initialized.</p>'
    },
    {
      id: 'q2',
      question: 'Explain the concept of time complexity and space complexity.',
      answer: '<p class="mb-2"><strong>Time complexity:</strong> A measure of the amount of time an algorithm takes to complete as a function of the input size. It\'s typically expressed using Big O notation (e.g., O(n), O(log n), O(n²)).</p><p><strong>Space complexity:</strong> A measure of the amount of memory an algorithm uses as a function of the input size. It includes both auxiliary space and space used by the input.</p><p>When analyzing an algorithm, we usually focus on the worst-case scenario and look for the dominant term that grows the fastest as the input size increases.</p>'
    },
    {
      id: 'q3',
      question: 'What are closures in JavaScript and how might you use them?',
      answer: '<p class="mb-2">A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). In other words, a closure gives you access to an outer function\'s scope from an inner function.</p><p class="mb-2">Example:</p><pre class="bg-gray-100 p-2 rounded-md mb-2 overflow-x-auto">function createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2</pre><p>Closures are commonly used for data privacy, function factories, and implementing modules.</p>'
    },
    {
      id: 'q4',
      question: 'Describe RESTful API design principles.',
      answer: '<p>REST (Representational State Transfer) is an architectural style for designing networked applications. RESTful APIs typically follow these principles:</p><ul class="list-disc pl-5 space-y-1"><li>Stateless: Server doesn\'t store client state between requests</li><li>Client-Server Architecture: Separation of concerns</li><li>Cacheable: Responses must define themselves as cacheable or non-cacheable</li><li>Uniform Interface: Resources are identified in requests, manipulated through representations, self-descriptive messages, and HATEOAS</li><li>Layered System: Client can\'t tell what layer it\'s connected to</li><li>Resource-Based: APIs are centered around resources (nouns) not actions</li><li>HTTP Methods: Use HTTP methods explicitly (GET, POST, PUT, DELETE)</li></ul>'
    },
    {
      id: 'q5',
      question: 'How would you implement a linked list in your preferred programming language?',
      answer: '<p class="mb-2">Here\'s an implementation of a singly linked list in JavaScript:</p><pre class="bg-gray-100 p-2 rounded-md mb-2 overflow-x-auto">class Node {\n  constructor(value) {\n    this.value = value;\n    this.next = null;\n  }\n}\n\nclass LinkedList {\n  constructor() {\n    this.head = null;\n    this.tail = null;\n    this.length = 0;\n  }\n\n  append(value) {\n    const newNode = new Node(value);\n    if (!this.head) {\n      this.head = newNode;\n      this.tail = newNode;\n    } else {\n      this.tail.next = newNode;\n      this.tail = newNode;\n    }\n    this.length++;\n    return this;\n  }\n\n  prepend(value) {\n    const newNode = new Node(value);\n    if (!this.head) {\n      this.head = newNode;\n      this.tail = newNode;\n    } else {\n      newNode.next = this.head;\n      this.head = newNode;\n    }\n    this.length++;\n    return this;\n  }\n\n  delete(value) {\n    if (!this.head) return null;\n    \n    if (this.head.value === value) {\n      this.head = this.head.next;\n      this.length--;\n      return this;\n    }\n    \n    let current = this.head;\n    while (current.next && current.next.value !== value) {\n      current = current.next;\n    }\n    \n    if (current.next) {\n      if (current.next === this.tail) {\n        this.tail = current;\n      }\n      current.next = current.next.next;\n      this.length--;\n    }\n    \n    return this;\n  }\n}</pre>'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Interview Preparation</h1>
      <p className="text-gray-600 mb-8">Comprehensive resources to help you ace your tech interviews</p>

      {/* Before the Interview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Before the Interview</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Company Research</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Research the company's products, services, and recent news</li>
                  <li>Understand their business model and revenue streams</li>
                  <li>Read their engineering blog if available</li>
                  <li>Check Glassdoor reviews for company culture insights</li>
                  <li>Review their tech stack and development practices</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Role Preparation</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Review the job description thoroughly and highlight key requirements</li>
                  <li>Match your experience to each requirement with specific examples</li>
                  <li>Prepare to discuss relevant projects and technical challenges</li>
                  <li>Research typical interview process for similar roles at the company</li>
                  <li>Understand the team structure and your potential role within it</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Technical Preparation</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Review fundamentals related to the role (data structures, algorithms, etc.)</li>
                  <li>Practice coding problems on platforms like LeetCode or HackerRank</li>
                  <li>Refresh knowledge on the specific technologies mentioned in the job description</li>
                  <li>Prepare for system design questions if applying for a senior role</li>
                  <li>Practice explaining technical concepts clearly and concisely</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* During the Interview Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">During the Interview</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Technical Interview Tips</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Begin by clarifying requirements before diving into solutions</li>
                  <li>Think out loud to demonstrate your problem-solving process</li>
                  <li>Start with a simple approach, then optimize</li>
                  <li>Discuss time and space complexity of your solutions</li>
                  <li>Test your solution with example inputs and edge cases</li>
                  <li>When stuck, break the problem down into smaller parts</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Behavioral Interview Techniques</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
                  <li>Prepare specific examples that highlight your technical and soft skills</li>
                  <li>Focus on your individual contributions within team projects</li>
                  <li>Be ready to discuss failures and what you learned from them</li>
                  <li>Keep answers concise and relevant (1-2 minutes per question)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Questions to Ask the Interviewer</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>What does success look like in this role after 3, 6, and 12 months?</li>
                  <li>How is the engineering team structured? Who would I be working with directly?</li>
                  <li>What are the biggest technical challenges the team is facing right now?</li>
                  <li>How do you measure individual and team performance?</li>
                  <li>What is the development and release process like?</li>
                  <li>What opportunities are there for professional growth and learning?</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* After the Interview Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">After the Interview</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Send a Thank-You Email</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Send within 24 hours of the interview</li>
                  <li>Thank the interviewer for their time and the opportunity</li>
                  <li>Reference specific topics discussed during the interview</li>
                  <li>Express continued interest in the position</li>
                  <li>Keep it concise and professional</li>
                </ul>
                
                <div className="mt-4 bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Sample Thank-You Email:</h4>
                  <p className="text-gray-700 text-sm">
                    Subject: Thank You for the Software Engineer Interview<br/><br/>
                    
                    Dear [Interviewer's Name],<br/><br/>
                    
                    Thank you for taking the time to speak with me yesterday about the Senior Frontend Developer position. I enjoyed learning more about your team's work on [specific project] and the challenges you're facing with [specific challenge discussed].<br/><br/>
                    
                    Our conversation reinforced my enthusiasm for the role and the company. I'm particularly excited about the opportunity to contribute to [specific aspect of the job or company].<br/><br/>
                    
                    If you need any additional information from me, please don't hesitate to reach out. I'm looking forward to hearing from you about the next steps in the process.<br/><br/>
                    
                    Thank you again for your consideration.<br/><br/>
                    
                    Best regards,<br/>
                    [Your Name]
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Self-Assessment</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Write down the questions you were asked while they're fresh in your mind</li>
                  <li>Evaluate your performance honestly: what went well and what could be improved</li>
                  <li>Research answers to questions you struggled with</li>
                  <li>Consider asking for feedback even if you don't get the job</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Follow-Up Strategy</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>If you haven't heard back within the timeframe mentioned, send a polite follow-up</li>
                  <li>Keep the follow-up brief and reiterate your interest</li>
                  <li>Continue your job search while waiting for a response</li>
                  <li>If rejected, ask for constructive feedback to improve for future interviews</li>
                  <li>Maintain the relationship with the interviewer on LinkedIn for future opportunities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Common Technical Interview Questions Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Common Technical Interview Questions</h2>
        
        <div className="space-y-4">
          {technicalQuestions.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                className="w-full p-4 text-left font-medium bg-white hover:bg-gray-50 flex justify-between items-center"
                onClick={() => toggleQuestion(item.id)}
              >
                {item.question}
                <svg 
                  className={`w-5 h-5 transition-transform ${expandedQuestion === item.id ? 'transform rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {expandedQuestion === item.id && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div dangerouslySetInnerHTML={{ __html: item.answer }} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button className="text-blue-600 font-medium hover:text-blue-800">
            Load More Questions
          </button>
        </div>
      </section>

      {/* Mock Interview Practice Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Mock Interview Practice</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">Ready to practice your interview skills?</h3>
              <p className="text-gray-700">
                JobMatcher PRO members can access our mock interview platform to practice with AI interviewers or schedule sessions with real tech professionals.
              </p>
            </div>
            
          
            
            <div className="mt-6 text-center text-gray-600 text-sm">
              Not a PRO member yet? <a href="/pricing" className="text-blue-600 hover:underline">Upgrade now</a> to access these premium features.
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}