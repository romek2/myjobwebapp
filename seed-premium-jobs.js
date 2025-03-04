// prisma/seed-premium-jobs.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPremiumJobs() {
  console.log('Seeding premium jobs...');

  try {
    // Delete existing premium jobs to prevent duplicates
    await prisma.jobAlertHistory.deleteMany();
    await prisma.premiumJob.deleteMany();
    
    // Create premium jobs
    const premiumJobs = [
      {
        title: 'Senior Frontend Architect',
        company: 'Tech Unicorn Inc.',
        location: 'Remote (US)',
        description: 'Looking for an experienced Frontend Architect to lead our UI engineering team. You will be responsible for designing and implementing the frontend architecture for our next-generation products.',
        url: '/jobs/premium-1',
        salary: '$150,000 - $180,000',
        isPremium: true,
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        title: 'Lead React Engineer',
        company: 'Fortune 100 Company',
        location: 'New York, NY',
        description: 'Our client, a leading Fortune 100 company, is seeking a Lead React Engineer to join their digital transformation team. This role offers exceptional benefits and growth opportunities.',
        url: '/jobs/premium-2',
        salary: '$170,000 - $200,000',
        isPremium: true,
        postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: 'Principal UI Engineer',
        company: 'Stealth Startup',
        location: 'San Francisco, CA',
        description: 'Join an exciting stealth startup backed by top-tier VCs. We are looking for a Principal UI Engineer to help build our revolutionary product from the ground up.',
        url: '/jobs/premium-3',
        salary: '$160,000 - $190,000 + equity',
        isPremium: true,
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        title: 'VP of Engineering',
        company: 'AI Innovation Labs',
        location: 'Boston, MA (Hybrid)',
        description: 'Exceptional opportunity for a seasoned engineering leader to join our AI-focused company. You will lead a team of 50+ engineers and shape the future of our technology platform.',
        url: '/jobs/premium-4',
        salary: '$220,000 - $260,000',
        isPremium: true,
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        title: 'Senior Full Stack Developer',
        company: 'HealthTech Pioneer',
        location: 'Remote (Worldwide)',
        description: 'Join our mission to revolutionize healthcare technology. We are looking for a Senior Full Stack Developer with experience in React, Node.js, and cloud infrastructure.',
        url: '/jobs/premium-5',
        salary: '$140,000 - $170,000',
        isPremium: true,
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ];

    // Insert premium jobs
    for (const job of premiumJobs) {
      await prisma.premiumJob.create({
        data: job
      });
    }

    console.log(`Seeded ${premiumJobs.length} premium jobs`);
  } catch (error) {
    console.error('Error seeding premium jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPremiumJobs()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });