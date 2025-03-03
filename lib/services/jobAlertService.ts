// lib/services/jobAlertService.ts
import { prisma } from '../prisma';

/**
 * Types for job alerts
 */
export interface JobAlert {
  id: string;
  userId: string;
  name: string;
  keywords: string;
  frequency: 'daily' | 'weekly' | 'realtime';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PremiumJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  isPremium: boolean;
  postedAt: Date;
}

/**
 * Creates a new job alert for a user
 */
export async function createJobAlert(
  userId: string,
  name: string,
  keywords: string,
  frequency: 'daily' | 'weekly' | 'realtime'
): Promise<JobAlert | null> {
  try {
    // Check if user has PRO subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        subscriptionStatus: true,
        subscriptionPeriodEnd: true 
      }
    });
    
    if (!user || user.subscriptionStatus !== 'PRO') {
      console.log('User is not a PRO subscriber');
      return null;
    }
    
    // Check if subscription is still valid
    if (user.subscriptionPeriodEnd && new Date() > user.subscriptionPeriodEnd) {
      console.log('PRO subscription has expired');
      return null;
    }
    
    // Create the job alert
    // Note: In a real application, you'd have a JobAlert model in your schema
    // This is a mock implementation
    const alert = {
      id: `alert_${Date.now()}`,
      userId,
      name,
      keywords,
      frequency,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`Created job alert for user ${userId}: ${name}`);
    return alert;
  } catch (error) {
    console.error('Error creating job alert:', error);
    return null;
  }
}

/**
 * Gets matching premium jobs for a specific alert
 */
export async function getMatchingPremiumJobs(alertId: string): Promise<PremiumJob[]> {
  // In a real application, you would:
  // 1. Find the alert by ID
  // 2. Get the keywords and criteria
  // 3. Query your jobs database for matching jobs marked as premium
  // 4. Return the matches
  
  // This is a mock implementation
  const mockPremiumJobs: PremiumJob[] = [
    {
      id: 'job1',
      title: 'Senior Frontend Developer (Premium)',
      company: 'Exclusive Tech Inc.',
      location: 'New York, NY (Remote)',
      salary: '$140,000 - $180,000',
      description: 'An exclusive position only available to our premium users...',
      url: '/jobs/premium-1',
      isPremium: true,
      postedAt: new Date()
    },
    {
      id: 'job2',
      title: 'Lead React Engineer (Premium)',
      company: 'Fortune 500 Company',
      location: 'San Francisco, CA',
      salary: '$160,000 - $190,000',
      description: 'Special opportunity with extensive benefits package...',
      url: '/jobs/premium-2',
      isPremium: true,
      postedAt: new Date(Date.now() - 86400000) // 1 day ago
    }
  ];
  
  return mockPremiumJobs;
}

/**
 * Sends job alerts to eligible PRO users
 * This would typically be run by a cron job or scheduler
 */
export async function processPremiumJobAlerts(): Promise<void> {
  try {
    // In a real application, you would:
    // 1. Find all active alerts for PRO users
    // 2. Check which alerts need to be sent based on frequency
    // 3. Find matching premium jobs for each alert
    // 4. Send emails/notifications to users
    
    console.log('Processing premium job alerts...');
    
    // Mock implementation
    const mockAlerts = [
      { id: 'alert1', userId: 'user1', name: 'React Jobs', keywords: 'React, TypeScript', frequency: 'daily' },
      { id: 'alert2', userId: 'user2', name: 'Remote Jobs', keywords: 'Remote, Frontend', frequency: 'weekly' }
    ];
    
    for (const alert of mockAlerts) {
      const user = await prisma.user.findUnique({
        where: { id: alert.userId },
        select: { 
          email: true,
          subscriptionStatus: true 
        }
      });
      
      if (user?.subscriptionStatus === 'PRO') {
        const matchingJobs = await getMatchingPremiumJobs(alert.id);
        
        if (matchingJobs.length > 0) {
          console.log(`Sending ${matchingJobs.length} premium job alerts to ${user.email}`);
          // In a real app, you would send an email here
          // await sendAlertEmail(user.email, alert.name, matchingJobs);
        }
      }
    }
    
    console.log('Finished processing premium job alerts');
  } catch (error) {
    console.error('Error processing job alerts:', error);
  }
}

/**
 * Mocks sending an email with job alerts
 * In a real application, you would use a service like SendGrid, Mailchimp, etc.
 */
async function sendAlertEmail(
  email: string,
  alertName: string,
  jobs: PremiumJob[]
): Promise<void> {
  console.log(`📧 MOCK EMAIL to ${email}`);
  console.log(`Subject: New Premium Job Matches for "${alertName}"`);
  console.log('Body:');
  console.log('We found these premium opportunities that match your criteria:');
  
  jobs.forEach((job, i) => {
    console.log(`\n${i + 1}. ${job.title}`);
    console.log(`   ${job.company} - ${job.location}`);
    console.log(`   Salary: ${job.salary}`);
  });
  
  console.log('\nThank you for being a PRO subscriber!');
}