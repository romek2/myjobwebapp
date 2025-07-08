// ================== CONFIGURATION SECTION ==================
// 🔧 CHANGE THESE VALUES TO CUSTOMIZE THE SCRAPER

const CONFIG = {
  // RSS Feed Configuration
  FEED_ID: 'FCZ2i5xowBKbgcd4',  // Change this to your RSS feed ID
  
  // Alternative RSS URLs to try (add/modify as needed)
  BACKUP_RSS_URLS: [
      'https://weworkremotely.com/remote-jobs.rss',
      'https://remoteok.io/remote-jobs.rss',
      // Add more backup RSS feeds here
  ],
  
  // Output Configuration (DON'T CHANGE THESE)
  OUTPUT_FILENAME: 'weworkremotely_jobs',  // Output file name (without .json)
  SOURCE_NAME: 'WeWorkRemotely',           // Source name for scraped data
  
  // Scraping Configuration
  MIN_TITLE_LENGTH: 5,              // Minimum title length to consider
  REMOVE_DUPLICATES: true,          // Remove duplicate jobs
  INCLUDE_RAW_DATA: true,           // Include original title for debugging
  MAX_RETRIES: 3,                   // Max retries per endpoint
  TIMEOUT_MS: 10000,                // Request timeout in milliseconds
  
  // Tech Keywords (add/remove as needed)
  TECH_KEYWORDS: [
      'python', 'java', 'javascript', 'typescript', 'react', 'node.js', 
      'backend', 'frontend', 'full stack', 'data science', 'machine learning',
      'aws', 'cloud', 'devops', 'golang', 'ruby', 'php', 'sql', 'nosql',
      'kubernetes', 'docker', 'angular', 'vue', 'django', 'flask', 'spring',
      'mongodb', 'postgresql', 'redis', 'elasticsearch', 'graphql', 'rest api',
      'api', 'html', 'css', 'git', 'linux', 'mysql', 'firebase', 'sass',
      'c++', 'c#', '.net', 'scala', 'kotlin', 'swift', 'rust', 'go'
  ],
  
  // Title Parsing Patterns (add/modify as needed)
  TITLE_PATTERNS: [
      /^([^:]+):\s*(.+)$/,           // Company: Job Title
      /^([^-]+)\s*-\s*(.+)$/,       // Company - Job Title  
      /^([^|]+)\s*\|\s*(.+)$/,      // Company | Job Title
      /^([^@]+)\s*@\s*(.+)$/,       // Job Title @ Company
      /^(.+?)\s+at\s+(.+)$/i,       // Job Title at Company
      /^(.+?)\s*\(\s*(.+?)\s*\)$/,  // Job Title (Company)
      /^(.+?)\s*–\s*(.+)$/,         // Company – Job Title (em dash)
      /^(.+?)\s*—\s*(.+)$/,         // Company — Job Title (em dash)
  ],
  
  // RSS.app API endpoints to try (modify if needed)
  RSS_APP_ENDPOINTS: [
      'https://rss.app/feeds/{FEED_ID}.xml',
      'https://rss.app/feeds/{FEED_ID}.json',
      'https://api.rss.app/feeds/{FEED_ID}.json',
      'https://widget.rss.app/api/feeds/{FEED_ID}',
      'https://rss.app/api/feeds/{FEED_ID}',
      'https://rss.app/feeds/{FEED_ID}/json',
      'https://feeds.rss.app/{FEED_ID}.xml',
  ]
};

// ================== MAIN SCRAPER CODE ==================
// 🚨 DON'T MODIFY BELOW UNLESS YOU KNOW WHAT YOU'RE DOING

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Utility Functions
function cleanText(text) {
  if (!text) return '';
  return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
}

function extractTechStack(text) {
  const foundTechs = CONFIG.TECH_KEYWORDS.filter(tech => 
      text.toLowerCase().includes(tech.toLowerCase())
  );
  return [...new Set(foundTechs)]; // Remove duplicates
}

function extractCompanyAndTitle(fullTitle) {
  if (!fullTitle) {
      return { company: '', title: '' };
  }

  fullTitle = cleanText(fullTitle);
  
  for (const pattern of CONFIG.TITLE_PATTERNS) {
      const match = fullTitle.match(pattern);
      if (match) {
          let company = match[1].trim();
          let title = match[2].trim();
          
          // For "at" and "@" patterns, swap company and title
          if (pattern.toString().includes('at') || pattern.toString().includes('@')) {
              [company, title] = [title, company];
          }
          
          // For parentheses pattern, also swap
          if (pattern.toString().includes('\\(')) {
              [company, title] = [title, company];
          }
          
          return { company, title };
      }
  }
  
  return {
      company: '',
      title: fullTitle
  };
}

// Function to make HTTP request with timeout and retries
async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
      try {
          console.log(`🔍 Attempt ${i + 1}/${retries}: ${url}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
          
          const response = await fetch(url, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                  'Accept': 'application/json, application/rss+xml, application/xml, text/xml, */*',
                  'Accept-Language': 'en-US,en;q=0.9',
              },
              signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              const text = await response.text();
              
              console.log(`   ✅ Success! Status: ${response.status}, Content-Type: ${contentType}`);
              console.log(`   📊 Response length: ${text.length} characters`);
              
              return {
                  text,
                  contentType,
                  status: response.status
              };
          } else {
              console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
          }
      } catch (error) {
          console.log(`   ❌ Request failed: ${error.message}`);
          if (i === retries - 1) throw error;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
  }
  
  throw new Error(`Failed after ${retries} attempts`);
}

// Function to try RSS.app endpoints
async function fetchFromRSSApp(feedId) {
  console.log(`📡 Trying RSS.app endpoints for feed: ${feedId}`);
  
  for (const endpoint of CONFIG.RSS_APP_ENDPOINTS) {
      const url = endpoint.replace('{FEED_ID}', feedId);
      
      try {
          const result = await fetchWithRetry(url, 2); // Fewer retries per endpoint
          
          if (result.text.length > 100) { // Must have substantial content
              return {
                  data: result.text,
                  contentType: result.contentType,
                  endpoint: url
              };
          }
      } catch (error) {
          console.log(`   ⏭️ Skipping to next endpoint`);
      }
  }
  
  return null;
}

// Function to try backup RSS feeds
async function fetchFromBackupFeeds() {
  console.log(`📡 Trying backup RSS feeds...`);
  
  for (const url of CONFIG.BACKUP_RSS_URLS) {
      try {
          const result = await fetchWithRetry(url, 2);
          
          if (result.text.length > 100) {
              console.log(`✅ Successfully fetched backup feed: ${url}`);
              return {
                  data: result.text,
                  contentType: result.contentType,
                  endpoint: url
              };
          }
      } catch (error) {
          console.log(`   ❌ Backup feed failed: ${url}`);
      }
  }
  
  return null;
}

// Function to parse XML RSS feed
function parseXMLRSS(xmlText) {
  const jobs = [];
  
  // Extract items using regex (basic approach)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  const items = xmlText.match(itemRegex) || [];
  
  console.log(`📋 Found ${items.length} items in XML`);
  
  items.forEach((item, index) => {
      try {
          // Extract title
          const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const title = titleMatch ? cleanText(titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')) : '';
          
          // Extract link
          const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
          const link = linkMatch ? cleanText(linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')) : '';
          
          // Extract description
          const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
          const description = descMatch ? cleanText(descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, ' ')) : '';
          
          // Extract pub date
          const dateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
          const pubDate = dateMatch ? cleanText(dateMatch[1]) : '';
          
          if (title && title.length >= CONFIG.MIN_TITLE_LENGTH) {
              const job = createJobObject(title, link, description, pubDate);
              jobs.push(job);
              
              // Log first few for debugging
              if (index < 3) {
                  console.log(`📄 XML Job ${index + 1}: "${job.title}" @ "${job.company}"`);
              }
          }
      } catch (error) {
          console.error(`❌ Error parsing XML item ${index}:`, error);
      }
  });
  
  return jobs;
}

// Function to parse JSON RSS feed
function parseJSONRSS(data) {
  const jobs = [];
  let parsedData;
  
  try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (error) {
      console.error('❌ JSON parsing failed:', error);
      return jobs;
  }
  
  // Try different JSON structures
  let items = [];
  
  if (parsedData.items) {
      items = parsedData.items;
  } else if (parsedData.feed && parsedData.feed.items) {
      items = parsedData.feed.items;
  } else if (parsedData.rss && parsedData.rss.channel && parsedData.rss.channel.item) {
      items = Array.isArray(parsedData.rss.channel.item) ? parsedData.rss.channel.item : [parsedData.rss.channel.item];
  } else if (Array.isArray(parsedData)) {
      items = parsedData;
  }
  
  console.log(`📋 Found ${items.length} items in JSON`);
  
  items.forEach((item, index) => {
      try {
          const title = cleanText(item.title || item.name || '');
          const link = item.link || item.url || item.guid || '';
          const description = cleanText(item.description || item.content || item.summary || '');
          const pubDate = item.pubDate || item.published || item.date || '';
          
          if (title && title.length >= CONFIG.MIN_TITLE_LENGTH) {
              const job = createJobObject(title, link, description, pubDate);
              jobs.push(job);
              
              // Log first few for debugging
              if (index < 3) {
                  console.log(`📄 JSON Job ${index + 1}: "${job.title}" @ "${job.company}"`);
              }
          }
      } catch (error) {
          console.error(`❌ Error parsing JSON item ${index}:`, error);
      }
  });
  
  return jobs;
}

// Function to create standardized job object
function createJobObject(title, link, description, pubDate) {
  const { company, title: jobTitle } = extractCompanyAndTitle(title);
  
  const job = {
      title: jobTitle || title,
      company: company,
      location: 'Remote',
      description: description,
      url: link,
      source: CONFIG.SOURCE_NAME,
      posted_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      salary: '',
      job_type: 'Remote',
      category: '',
      tech_stack: extractTechStack(title + ' ' + description),
      company_logo: '',
      scraped_date: new Date().toISOString().split('T')[0]
  };
  
  // Include raw data if configured
  if (CONFIG.INCLUDE_RAW_DATA) {
      job.raw_title = title;
  }
  
  return job;
}

// Function to display statistics
function displayStatistics(jobs) {
  console.log(`\n🎉 Scraping complete!`);
  console.log(`📊 Total jobs found: ${jobs.length}`);
  
  if (jobs.length > 0) {
      const companiesWithJobs = jobs.filter(job => job.company).length;
      const uniqueCompanies = new Set(jobs.map(job => job.company).filter(c => c)).size;
      const jobsWithTech = jobs.filter(job => job.tech_stack.length > 0).length;
      
      console.log(`📈 Statistics:`);
      console.log(`   Jobs with extracted company: ${companiesWithJobs} (${Math.round(companiesWithJobs/jobs.length*100)}%)`);
      console.log(`   Unique companies: ${uniqueCompanies}`);
      console.log(`   Jobs with tech stack: ${jobsWithTech} (${Math.round(jobsWithTech/jobs.length*100)}%)`);
      
      // Show tech stack distribution
      const allTechs = jobs.flatMap(job => job.tech_stack);
      const techCounts = {};
      allTechs.forEach(tech => techCounts[tech] = (techCounts[tech] || 0) + 1);
      const topTechs = Object.entries(techCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
      
      if (topTechs.length > 0) {
          console.log(`🔧 Top technologies mentioned:`);
          topTechs.forEach(([tech, count]) => {
              console.log(`   ${tech}: ${count} jobs`);
          });
      }
      
      return true;
  } else {
      console.log(`❌ No jobs found.`);
      return false;
  }
}

// Main execution function
async function main() {
  try {
      console.log('🚀 Starting configurable RSS job scraper...');
      console.log(`📡 Feed ID: ${CONFIG.FEED_ID}`);
      
      let jobs = [];
      let dataSource = '';
      
      // Try RSS.app endpoints first
      const rssAppResult = await fetchFromRSSApp(CONFIG.FEED_ID);
      
      if (rssAppResult) {
          console.log(`✅ Successfully fetched from RSS.app: ${rssAppResult.endpoint}`);
          dataSource = rssAppResult.endpoint;
          
          if (rssAppResult.contentType.includes('json')) {
              jobs = parseJSONRSS(rssAppResult.data);
          } else {
              jobs = parseXMLRSS(rssAppResult.data);
          }
      }
      
      // If RSS.app failed, try backup feeds
      if (jobs.length === 0 && CONFIG.BACKUP_RSS_URLS.length > 0) {
          const backupResult = await fetchFromBackupFeeds();
          
          if (backupResult) {
              console.log(`✅ Successfully fetched from backup feed`);
              dataSource = backupResult.endpoint;
              jobs = parseXMLRSS(backupResult.data);
          }
      }
      
      // Remove duplicates if configured
      if (CONFIG.REMOVE_DUPLICATES && jobs.length > 0) {
          const uniqueJobs = jobs.filter((job, index, self) => 
              index === self.findIndex(j => j.title === job.title && j.url === job.url)
          );
          console.log(`🔄 Removed ${jobs.length - uniqueJobs.length} duplicates`);
          jobs = uniqueJobs;
      }
      
      const success = displayStatistics(jobs);
      
      if (success) {
          // Save to JSON file
          const filename = `${CONFIG.OUTPUT_FILENAME}.json`;
          const outputPath = path.join(__dirname, filename);
          fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));
          console.log(`\n💾 Saved ${jobs.length} jobs to: ${outputPath}`);
          console.log(`📡 Data source: ${dataSource}`);
          
          // Show sample jobs
          console.log(`\n📋 Sample jobs:`);
          jobs.slice(0, 3).forEach((job, i) => {
              console.log(`\n${i + 1}. ${job.title}`);
              console.log(`   Company: ${job.company || 'N/A'}`);
              console.log(`   Tech: ${job.tech_stack.join(', ') || 'N/A'}`);
              console.log(`   URL: ${job.url}`);
          });
      } else {
          console.log(`\n🔧 Troubleshooting suggestions:`);
          console.log(`   1. Check if the RSS feed ID is correct: ${CONFIG.FEED_ID}`);
          console.log(`   2. Verify the RSS.app feed is publicly accessible`);
          console.log(`   3. Try running the script again (APIs might be temporarily down)`);
          console.log(`   4. Check your internet connection`);
      }
      
      return jobs;
      
  } catch (error) {
      console.error('❌ Error in main function:', error);
      return [];
  }
}

// Install dependencies if not present
function checkAndInstallDependencies() {
  try {
      require('node-fetch');
      console.log('✅ Dependencies are available');
  } catch (err) {
      console.log('📦 Installing required dependencies...');
      const { execSync } = require('child_process');
      
      try {
          if (!fs.existsSync('package.json')) {
              execSync('npm init -y', { stdio: 'inherit' });
          }
          
          execSync('npm install node-fetch@2', { stdio: 'inherit' });
          console.log('✅ Dependencies installed successfully!');
      } catch (installError) {
          console.error('❌ Error installing dependencies:', installError.message);
          console.log('\n🔧 Manual installation required:');
          console.log('   Run: npm install node-fetch@2');
          process.exit(1);
      }
  }
}

// Run the script
console.log('🔧 Checking dependencies...');
checkAndInstallDependencies();

// Execute main function
main().catch(console.error);