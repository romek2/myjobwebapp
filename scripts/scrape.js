// scripts/scrape.js
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const fs = require('fs').promises;  // Using fs.promises
const path = require('path');

dotenv.config();

// Improved tech mapping with variations
const TECH_MAPPING = {
  // Frontend Frameworks & Libraries
  'Angular': ['angular', 'angularjs', 'angular.js', 'angular 2+', 'ng'],
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'client-side scripting'],
  'Node.js': ['node', 'node.js', 'nodejs'],
  'NPM': ['npm', 'node package manager'],
  'Bower': ['bower'],
  'Gulp': ['gulp', 'gulpjs'],
  'Grunt': ['grunt', 'gruntjs'],
  'Wireframing': ['balsamiq', 'gliffy', 'omnigraffle', 'wireframe', 'mockup', 'mock-up', 'ux design'],
  'Testing Frameworks': ['jasmine', 'karma', 'tdd', 'bdd', 'test automation', 'unit testing'],
  'Agile': ['agile', 'scrum', 'kanban', 'xp', 'extreme programming'],
  'Git': ['git', 'github', 'version control'],
  'CI/CD': ['ci', 'continuous integration', 'jenkins', 'ci workflows'],
  'Linux': ['linux', 'unix', 'unix / linux'],
  'Ruby': ['ruby', 'rails', 'ruby on rails'],
  'PHP': ['php'],
  'Java': ['java'],
  'Python': ['python'],
  'C++': ['c++', 'cpp'],
  'Flash': ['flash', 'actionscript'],
  'MySQL': ['mysql', 'relational database', 'sql'],
  'NoSQL': ['nosql', 'non-relational database', 'non relational database'],
  'TypeScript': ['typescript', 'ts'],
  'C#': ['c#', 'csharp', '.net', 'dotnet'],
  'React': ['react', 'react.js', 'reactjs'],
  'Vue': ['vue', 'vue.js', 'vuejs'],
  'HTML/CSS': ['html', 'css', 'sass', 'scss', 'less'],
  'AWS': ['aws', 'amazon web services'],
  'Azure': ['azure', 'microsoft azure'],
  'Docker': ['docker', 'containerization'],
  'Kubernetes': ['kubernetes', 'k8s']
};

// Create variations map
const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
  variations.forEach(variation => {
    acc[variation] = main;
  });
  return acc;
}, {});

function containsKeyword(text, keyword) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|[\\s,./()\\-+])(${escapedKeyword})($|[\\s,./()\\-+])`, 'i');
  return regex.test(text);
}

function extractTechKeywords(text) {
  const normalizedText = ` ${text.toLowerCase()} `;
  const foundTechs = new Set();

  Object.entries(TECH_VARIATIONS).forEach(([variation, mainTech]) => {
    if (containsKeyword(normalizedText, variation)) {
      foundTechs.add(mainTech);
    }
  });

  // Context-based checks
  if (normalizedText.includes('test') && 
      (normalizedText.includes('automation') || normalizedText.includes('automated'))) {
    foundTechs.add('Testing Frameworks');
  }

  if (normalizedText.includes('database')) {
    if (normalizedText.includes('relational') || normalizedText.includes('sql')) {
      foundTechs.add('MySQL');
    }
    if (normalizedText.includes('non-relational') || normalizedText.includes('nosql')) {
      foundTechs.add('NoSQL');
    }
  }

  return Array.from(foundTechs);
}

async function fetchJobs(query, page = 1) {
  const baseUrl = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}`;
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_API_KEY,
    what: query,
    results_per_page: '50'
  });

  const url = `${baseUrl}?${params.toString()}`;
  console.log(`\nFetching page ${page} for "${query}"...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Found ${data.results.length} results`);
  return data;
}

async function saveToFile(data, filename) {
  try {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`Saved to ${filename}`);
  } catch (error) {
    console.error(`Error saving file: ${error.message}`);
  }
}

async function scrapeJobs() {
  console.log('Starting comprehensive job scraping...');

  const queries = [
    'javascript developer',
    'python developer',
    'software engineer',
    'frontend developer',
    'backend developer',
    'full stack developer'
  ];

  const jobs = [];
  const processedUrls = new Set();

  for (const query of queries) {
    console.log(`\nProcessing query: ${query}`);
    let page = 1;
    let totalProcessed = 0;
    const maxPerQuery = 100; // Limit per query

    while (totalProcessed < maxPerQuery) {
      try {
        const data = await fetchJobs(query, page);
        
        if (!data.results.length) {
          console.log('No more results for this query');
          break;
        }

        for (const result of data.results) {
          if (totalProcessed >= maxPerQuery) break;
          if (processedUrls.has(result.redirect_url)) continue;

          processedUrls.add(result.redirect_url);
          // Extract tech stack from both title and description
          const combinedText = `${result.title} ${result.description}`;
          const techStack = extractTechKeywords(combinedText);

          if (techStack.length > 0) {
            const job = {
              id: result.id,
              title: result.title,
              company: result.company.display_name,
              location: result.location.display_name,
              description: result.description,
              url: result.redirect_url,
              source: 'adzuna',
              postedAt: new Date(result.created),
              techStack,
              salary: result.salary_min ? `£${result.salary_min} - £${result.salary_max}` : 'Not specified',
              category: result.category.label,
              contract_type: result.contract_type || 'Not specified',
              queryFound: query
            };

            jobs.push(job);
            totalProcessed++;
            console.log(`Added: ${job.title} (${techStack.length} technologies)`);
            console.log('Technologies found:', techStack.join(', '));

            // Save progress every 20 jobs
            if (jobs.length % 20 === 0) {
              await saveToFile({ jobs }, 'jobs-data-progress.json');
            }
          }
        }

        page++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting

      } catch (error) {
        console.error(`Error on page ${page}:`, error.message);
        break;
      }
    }
  }

  // Calculate tech stats
  const techStats = {};
  jobs.forEach(job => {
    job.techStack.forEach(tech => {
      techStats[tech] = (techStats[tech] || 0) + 1;
    });
  });

  const techPercentages = Object.entries(techStats)
    .map(([tech, count]) => ({
      technology: tech,
      count,
      percentage: Math.round((count / jobs.length) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate popular combinations
  const combinations = {};
  jobs.forEach(job => {
    job.techStack.forEach((tech1, i) => {
      job.techStack.slice(i + 1).forEach(tech2 => {
        const pair = [tech1, tech2].sort().join(' + ');
        combinations[pair] = (combinations[pair] || 0) + 1;
      });
    });
  });

  const popularCombinations = Object.entries(combinations)
    .map(([pair, count]) => ({
      combination: pair,
      count,
      percentage: Math.round((count / jobs.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Final output
  const output = {
    metadata: {
      totalJobs: jobs.length,
      scrapedAt: new Date().toISOString(),
      uniqueCompanies: new Set(jobs.map(job => job.company)).size,
      queries: queries,
      averageTechPerJob: jobs.reduce((acc, job) => acc + job.techStack.length, 0) / jobs.length
    },
    techStats: techPercentages,
    popularCombinations,
    jobs
  };

  await saveToFile(output, 'jobs-data.json');

  console.log('\nMost requested technologies:');
  console.table(techPercentages.slice(0, 15));

  console.log('\nPopular technology combinations:');
  console.table(popularCombinations.slice(0, 10));

  console.log(`\nSaved ${jobs.length} jobs to jobs-data.json`);
}

scrapeJobs().catch(console.error);