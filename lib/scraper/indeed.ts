// src/lib/scraper/indeed.ts
import puppeteer, { Page, Browser } from 'puppeteer';
import { Job } from '@/types/job';

// Tech keywords to look for
const TECH_KEYWORDS = [
  // Languages
  'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'C++', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin',
  // Frontend
  'React', 'Angular', 'Vue', 'Next.js', 'Svelte', 'HTML', 'CSS', 'SASS', 'Tailwind',
  // Backend
  'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel',
  // Databases
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'DynamoDB',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins',
  // Tools
  'Git', 'GitHub', 'Jira', 'Webpack', 'npm', 'yarn'
];

interface ScrapeConfig {
  maxJobs?: number;
  location?: string;
  position?: string;
  pageDelay?: number;
  detailDelay?: number;
}

// Helper function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function scrapeIndeedJobs(config: ScrapeConfig = {}): Promise<Job[]> {
  const {
    maxJobs = 200,
    location = 'remote',
    position = 'software developer',
    pageDelay = 2000,
    detailDelay = 1000
  } = config;

  const browser: Browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const jobs: Job[] = [];
  let currentPage = 0;

  try {
    const page: Page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    while (jobs.length < maxJobs) {
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(position)}&l=${encodeURIComponent(location)}&start=${currentPage * 10}`;
      
      console.log(`Scraping page ${currentPage + 1}...`);
      await page.goto(searchUrl, { waitUntil: 'networkidle0' });
      
      // Random delay between 1-3 seconds
      await delay(Math.random() * 2000 + pageDelay);

      // Wait for job cards to load
      try {
        await page.waitForSelector('.job_seen_beacon', { timeout: 5000 });
      } catch (error) {
        console.log('No job cards found on page');
        break;
      }

      const jobCards = await page.$$('.job_seen_beacon');
      
      if (!jobCards.length) {
        console.log('No more jobs found.');
        break;
      }

      for (const card of jobCards) {
        if (jobs.length >= maxJobs) break;

        try {
          // Extract data from the job card
          const title = await card.$eval('h2.jobTitle', el => el.textContent?.trim() || '')
            .catch(() => '');
          const company = await card.$eval('.companyName', el => el.textContent?.trim() || '')
            .catch(() => '');
          const location = await card.$eval('.companyLocation', el => el.textContent?.trim() || '')
            .catch(() => '');
          const jobUrl = await card.$eval('h2.jobTitle a', (el: any) => el.href)
            .catch(() => '');

          if (!jobUrl) continue;

          // Visit job detail page
          const detailPage = await browser.newPage();
          await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          await detailPage.goto(jobUrl, { waitUntil: 'networkidle0' });
          await delay(Math.random() * 1000 + detailDelay);

          const description = await detailPage.$eval('#jobDescriptionText', el => el.textContent?.trim() || '')
            .catch(() => '');

          await detailPage.close();

          if (!title || !company || !description) continue;

          const techStack = extractTechKeywords(description);

          const job: Job = {
            id: `indeed-${Date.now()}-${jobs.length}`,
            title,
            company,
            location,
            description,
            url: jobUrl,
            source: 'indeed',
            postedAt: new Date(),
            match: 0,
            techStack,
          };

          jobs.push(job);
          console.log(`Scraped job ${jobs.length}: ${title} at ${company}`);

        } catch (error) {
          console.error('Error scraping job details:', error);
          continue;
        }
      }

      currentPage++;
      
      // Additional delay between pages
      await delay(Math.random() * 3000 + pageDelay);
    }

  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }

  return jobs;
}

function extractTechKeywords(text: string): string[] {
  const normalizedText = text.toLowerCase();
  return TECH_KEYWORDS.filter(keyword => 
    new RegExp(`\\b${keyword.toLowerCase()}\\b`).test(normalizedText)
  );
}

export async function saveJobsToJson(jobs: Job[], filename: string = 'scraped-jobs.json'): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  
  const filePath = path.join(process.cwd(), filename);
  await fs.promises.writeFile(
    filePath,
    JSON.stringify(jobs, null, 2)
  );
  
  console.log(`Saved ${jobs.length} jobs to ${filePath}`);
}