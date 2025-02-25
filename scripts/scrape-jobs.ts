// scripts/scrape-jobs.ts
import { scrapeIndeedJobs, saveJobsToJson } from '../lib/scraper/indeed';
import { Job } from '../types/job';

interface TechStats {
  technology: string;
  count: number;
  percentage: number;
}

async function main() {
  console.log('Starting job scraper...');
  
  try {
    const jobs = await scrapeIndeedJobs({
      maxJobs: 200,
      position: 'software developer',
      location: 'remote',
      pageDelay: 2000,
      detailDelay: 1000
    });

    console.log(`Successfully scraped ${jobs.length} jobs`);
    
    // Save to JSON file
    await saveJobsToJson(jobs);
    
    // Print some stats
    const techUsage = new Map<string, number>();
    
    jobs.forEach((job: Job) => {
      if (job.techStack && Array.isArray(job.techStack)) {
        job.techStack.forEach((tech: string) => {
          techUsage.set(tech, (techUsage.get(tech) || 0) + 1);
        });
      }
    });

    console.log('\nTechnology usage in job postings:');
    const sortedTech: TechStats[] = Array.from(techUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tech, count]) => ({
        technology: tech,
        count,
        percentage: Math.round((count / jobs.length) * 100)
      }));

    console.table(sortedTech);

  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

main();