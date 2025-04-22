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

// Function to extract company name and job title from the full title
function extractCompanyAndTitle(fullTitle) {
  if (!fullTitle) {
    return { company: '', title: '' };
  }
  
  // First try to match Company: JobTitle pattern (with colon)
  const colonMatch = fullTitle.match(/^([^:]+):\s*(.+)$/);
  if (colonMatch) {
    return {
      company: colonMatch[1].trim(),
      title: colonMatch[2].trim()
    };
  }
  
  // Try to match Company - JobTitle pattern (with dash)
  const dashMatch = fullTitle.match(/^([^-]+)\s*-\s*(.+)$/);
  if (dashMatch) {
    return {
      company: dashMatch[1].trim(),
      title: dashMatch[2].trim()
    };
  }
  
  // If no pattern matches, we can't extract the company
  return {
    company: '',
    title: fullTitle.trim()
  };
}

// Main function to fetch and parse RSS feed from RSS.app
async function fetchJobsFromRSS(rssUrl) {
  try {
    console.log(`Fetching RSS feed from: ${rssUrl}`);
    
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const xmlText = await response.text();
    
    // Log a small sample of the response
    console.log("First 200 characters of response:");
    console.log(xmlText.substring(0, 200) + "...");

    // Parse XML to JSON
    return new Promise((resolve, reject) => {
      parseString(xmlText, { explicitArray: false }, (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          reject(err);
          return;
        }

        if (!result || !result.rss || !result.rss.channel) {
          console.error('Invalid RSS format or empty feed');
          console.log('Response structure:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
          resolve([]);
          return;
        }

        // Extract job listings
        const items = Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : (result.rss.channel.item ? [result.rss.channel.item] : []);
        
        console.log(`Found ${items.length} items in RSS feed`);
        
        // Log the first item to see its structure
        if (items.length > 0) {
          console.log('First item structure example:');
          console.log(JSON.stringify(items[0], null, 2));
        }
        
        const jobListings = items.map(item => {
          if (!item) return null;
          
          // Extract relevant information
          const fullTitle = item.title || '';
          const description = item.description ? stripHtml(item.description) : '';
          const link = item.link || '';
          const pubDate = item.pubDate || new Date().toISOString();
          
          // Extract company and job title from the full title
          const { company, title } = extractCompanyAndTitle(fullTitle);
          
          // Log some examples to debug the extraction
          if (company === '') {
            console.log(`Could not extract company from: "${fullTitle}"`);
          }

          return {
            title: title,
            company: company,
            location: 'Remote',
            description,
            url: link,
            source: 'WeWorkRemotely',
            posted_at: pubDate,
            salary: '',
            job_type: 'Remote',
            category: '',
            tech_stack: extractTechStack(fullTitle + ' ' + description),
            company_logo: '',
            scraped_date: new Date().toISOString().split('T')[0]
          };
        }).filter(job => job !== null);

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
  // Use the RSS.app feed URL
  const rssUrl = 'https://rss.app/feeds/BT6Kq6nvMbY6h4aX.xml';

  try {
    console.log('Starting WeWorkRemotely job scraper with RSS.app feed...');
    
    const jobs = await fetchJobsFromRSS(rssUrl);

    // Save to JSON file
    if (jobs.length > 0) {
      const outputPath = path.join(__dirname, 'weworkremotely_jobs.json');
      fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));
      console.log(`\nSuccess! Saved ${jobs.length} jobs to ${outputPath}`);
      
      // Print a few examples of the parsed jobs
      console.log('\nExample job entries:');
      for (let i = 0; i < Math.min(3, jobs.length); i++) {
        console.log(`Example ${i+1}:`);
        console.log(`  Title: "${jobs[i].title}"`);
        console.log(`  Company: "${jobs[i].company}"`);
      }
    } else {
      console.log('\nNo jobs found or error occurred during parsing');
    }

    return jobs;
  } catch (error) {
    console.error('Error in main function:', error);
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