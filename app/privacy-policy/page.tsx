'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-8">Last Updated: March 6, 2025</p>

      <div className="prose prose-blue max-w-none">
        <h2>Introduction</h2>
        <p>
          JobMatcher ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
          This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our 
          job matching platform and services.
        </p>
        <p>
          Please read this privacy policy carefully. If you disagree with our policies and practices, please do not use 
          our services. By accessing or using JobMatcher, you agree to this privacy policy.
        </p>

        <h2>Information We Collect</h2>
        <p>We collect several types of information from and about users of our platform, including:</p>
        <ul>
          <li>
            <strong>Personal Information:</strong> Name, email address, phone number, location, professional background, 
            educational history, and other information you provide in your profile or resume.
          </li>
          <li>
            <strong>Authentication Information:</strong> Information related to your account, such as login credentials 
            and authentication data when you sign in through third-party services.
          </li>
          <li>
            <strong>Job Preferences:</strong> Information about your job search criteria, including desired roles, 
            industries, locations, salary expectations, and other preferences.
          </li>
          <li>
            <strong>Usage Data:</strong> Information about how you interact with our platform, including browsing 
            history, search queries, job listings viewed, and applications submitted.
          </li>
          <li>
            <strong>Technical Data:</strong> Internet protocol (IP) address, browser type and version, time zone 
            setting, browser plug-in types and versions, operating system and platform, and other technology on the 
            devices you use to access our platform.
          </li>
        </ul>

        <h2>How We Collect Information</h2>
        <p>We collect information through:</p>
        <ul>
          <li>Direct interactions when you create an account, upload a resume, or provide information to us.</li>
          <li>Automated technologies or interactions as you navigate through our platform.</li>
          <li>Third-party sources, such as when you log in using Google or other authentication providers.</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide, maintain, and improve our services.</li>
          <li>Match you with relevant job opportunities based on your skills, experience, and preferences.</li>
          <li>Create and maintain your account.</li>
          <li>Process job applications and communicate with potential employers.</li>
          <li>Send notifications about new job opportunities, application statuses, and platform updates.</li>
          <li>Protect against unauthorized access and misuse of our platform.</li>
          <li>Analyze usage patterns to enhance user experience and develop new features.</li>
          <li>Fulfill subscription and payment processing for PRO memberships.</li>
        </ul>

        <h2>Disclosure of Your Information</h2>
        <p>We may disclose your personal information to:</p>
        <ul>
          <li>
            <strong>Employers:</strong> When you apply for a job, we share relevant information from your profile 
            and resume with the respective employer.
          </li>
          <li>
            <strong>Service Providers:</strong> We may share information with third-party vendors who provide 
            services on our behalf, such as hosting, analytics, customer service, and marketing.
          </li>
          <li>
            <strong>Legal Requirements:</strong> We may disclose information when required by law, regulation, or 
            legal process.
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your 
            information may be transferred as a business asset.
          </li>
        </ul>

        <h2>Your Choices and Rights</h2>
        <p>You have several choices regarding your personal information:</p>
        <ul>
          <li>
            <strong>Account Settings:</strong> You can update your profile and preferences through your account 
            settings.
          </li>
          <li>
            <strong>Communication Preferences:</strong> You can choose to opt out of certain communications.
          </li>
          <li>
            <strong>Data Access and Portability:</strong> You may request access to your personal information or 
            request a copy in a structured, machine-readable format.
          </li>
          <li>
            <strong>Deletion:</strong> You may request the deletion of your account and associated personal 
            information.
          </li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information from accidental loss, 
          unauthorized access, alteration, and disclosure. However, no method of transmission over the Internet or 
          electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2>International Transfers</h2>
        <p>
          Your information may be transferred to, and maintained on, computers located outside of your state, 
          province, country, or other governmental jurisdiction where data protection laws may differ. If you are 
          located outside the United States and choose to provide information to us, please note that we transfer 
          the data to the United States and process it there.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Our services are not intended for individuals under the age of 16, and we do not knowingly collect 
          personal information from children under 16. If we learn we have collected or received personal information 
          from a child under 16, we will delete that information.
        </p>

        <h2>Changes to Our Privacy Policy</h2>
        <p>
          We may update our privacy policy from time to time. If we make material changes, we will notify you by 
          email or through a notice on our platform prior to the change becoming effective.
        </p>

        <h2>Contact Information</h2>
        <p>
          If you have questions or concerns about this privacy policy or our practices, please contact us at:
          <br />
          <a href="mailto:privacy@jobmatcher.com" className="text-blue-600 hover:underline">
            privacy@jobmatcher.com
          </a>
        </p>
      </div>
    </div>
  );
}