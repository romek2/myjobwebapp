const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');
const fetch = require('node-fetch');

// Function to clean HTML tags
function stripHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, ' ') // Replace HTML tags with spaces
    .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
    .replace(/&amp;/g, '&')   // Replace &amp; with &
    .replace(/&lt;/g, '<')    // Replace &lt; with <
    .replace(/&gt;/g, '>')    // Replace &gt; with >
    .replace(/&quot;/g, '"')  // Replace &quot; with "
    .replace(/&#39;/g, "'")   // Replace &#39; with '
    .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
    .trim();                  // Trim spaces from beginning and end
}

// Function to extract tech stack
function extractTechStack(text) {
  const techKeywords = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node.js', 
    'backend', 'frontend', 'full stack', 'data science', 'machine learning',
    'aws', 'cloud', 'devops', 'golang', 'ruby', 'php', 'sql', 'nosql',
    'kubernetes', 'docker', 'angular', 'vue', 'django', 'flask', 'spring'
  ];

  const foundTechs = techKeywords.filter(tech => 
    text.toLowerCase().includes(tech.toLowerCase())
  );

  return foundTechs;
}

// Main function to fetch and parse RSS feed
async function fetchJobsFromRSS(rssUrl) {
  try {
    console.log(`Fetching RSS feed from: ${rssUrl}`);
    
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    // Parse XML to JSON
    return new Promise((resolve, reject) => {
      parseString(xmlText, (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          reject(err);
          return;
        }

        // Extract job listings
        const items = result.rss.channel[0].item || [];
        
        const jobListings = items.map(item => {
          // Extract relevant information
          const title = item.title ? item.title[0] : '';
          const description = item.description ? stripHtml(item.description[0]) : '';
          const link = item.link ? item.link[0] : '';
          const pubDate = item.pubDate ? item.pubDate[0] : new Date().toISOString();

          // Try to extract company from title (typical WeWorkRemotely format)
          const companyMatch = title.match(/(.+?)\s*-\s*(.+)/);
          const company = companyMatch ? companyMatch[1].trim() : '';
          const jobTitle = companyMatch ? companyMatch[2].trim() : title;

          return {
            title: jobTitle,
            company,
            location: 'Remote',
            description,
            url: link,
            source: 'WeWorkRemotely',
            posted_at: pubDate,
            salary: '',
            job_type: 'Remote',
            category: '',
            tech_stack: extractTechStack(title + ' ' + description),
            company_logo: '',
            scraped_date: new Date().toISOString().split('T')[0]
          };
        });

        console.log(`Extracted ${jobListings.length} job listings from RSS`);
        resolve(jobListings);
      });
    });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

// Main execution function
async function main() {
  const rssUrl = 'https://weworkremotely.com/categories/all-other-remote-jobs.rss';

  try {
    const jobs = await fetchJobsFromRSS(rssUrl);

    // Save to JSON file
    if (jobs.length > 0) {
      const outputPath = path.join(__dirname, 'weworkremotely_jobs.json');
      fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));
      console.log(`Saved ${jobs.length} jobs to ${outputPath}`);
    }

    return jobs;
  } catch (error) {
    console.error('Error processing RSS feed:', error);
    return [];
  }
}

// Install dependencies if not present
try {
  require('xml2js');
  require('node-fetch');
} catch (err) {
  console.log('Installing required dependencies...');
  const { execSync } = require('child_process');
  execSync('npm init -y', { stdio: 'inherit' });
  execSync('npm install xml2js node-fetch@2', { stdio: 'inherit' }); // Using node-fetch v2 for Node.js compatibility
}

// Run the script
main().catch(console.error);