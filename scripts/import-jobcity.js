// scripts/import-jobcity.js
// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized for Jobcity import');

// Tech mapping
const TECH_MAPPING = {
  // Languages
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'vanilla javascript'],
  'TypeScript': ['typescript', 'ts'],
  'Python': ['python', 'python2', 'python3', 'py'],
  'Java': ['java', 'java8', 'java11', 'java17', 'j2ee'],
  'C#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  'C++': ['c++', 'cpp'],
  'PHP': ['php', 'php7', 'php8', 'laravel', 'symfony'],
  'Ruby': ['ruby', 'rails', 'ruby on rails', 'ror'],
  'Go': ['go', 'golang'],
  'Rust': ['rust', 'rustlang'],
  'Swift': ['swift', 'swiftui'],
  'Kotlin': ['kotlin'],
  // Frameworks & Libraries
  'React': ['react', 'reactjs', 'react.js', 'react native'],
  'Angular': ['angular', 'angularjs', 'angular.js'],
  'Vue': ['vue', 'vuejs', 'vue.js', 'vuex'],
  'Node.js': ['node', 'nodejs', 'node.js', 'express', 'expressjs', 'express.js'],
  'Django': ['django'],
  'Flask': ['flask'],
  'Spring': ['spring', 'spring boot', 'springboot'],
  'jQuery': ['jquery'],
  'Redux': ['redux'],
  'GraphQL': ['graphql', 'apollo', 'relay'],
  // Databases
  'SQL': ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb', 'oracle'],
  'MongoDB': ['mongodb', 'mongo', 'nosql'],
  'Firebase': ['firebase', 'firestore'],
  'Redis': ['redis'],
  'PostgreSQL': ['postgresql', 'postgres'],
  'MySQL': ['mysql'],
  // DevOps & Tools
  'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  'Docker': ['docker', 'container', 'containerization'],
  'Kubernetes': ['kubernetes', 'k8s'],
  'Git': ['git', 'github', 'gitlab', 'bitbucket'],
  'CI/CD': ['ci/cd', 'ci', 'cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions'],
  // Other
  'Machine Learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'tensorflow', 'pytorch', 'keras'],
  'Data Science': ['data science', 'data scientist', 'data analysis', 'pandas', 'numpy', 'matplotlib', 'scikit-learn'],
  'Blockchain': ['blockchain', 'bitcoin', 'ethereum', 'solidity', 'web3', 'web3.js'],
  'Mobile': ['mobile', 'ios', 'android', 'swift', 'kotlin', 'react native', 'flutter'],
  'Frontend': ['frontend', 'front-end', 'html', 'css', 'scss', 'sass', 'less', 'bootstrap', 'tailwind'],
  'Backend': ['backend', 'back-end', 'server-side'],
  'Fullstack': ['fullstack', 'full-stack', 'full stack', 'frontend', 'backend'],
};

const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
  variations.forEach(variation => {
    acc[variation] = main;
  });
  return acc;
}, {});

function extractTechStack(text) {
  if (!text) return [];
  
  // Search in both title and description
  const normalizedText = ` ${text.toLowerCase()} `;
  const foundTechs = new Set();

  Object.entries(TECH_VARIATIONS).forEach(([variation, mainTech]) => {
    const escapedVariation = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedVariation}\\b`, 'i');
    
    if (regex.test(normalizedText)) {
      foundTechs.add(mainTech);
    }
  });

  return Array.from(foundTechs);
}

// Function to strip HTML tags from text if necessary
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

// Main import function
async function importJobs() {
  console.log('Starting Jobcity job import...');

  try {
    // Load job data from the Jobcity JSON file
    const dataPath = path.join(__dirname, '..', 'jobicy_jobs.json');
    console.log(`Reading data from ${dataPath}`);
    
    const rawData = await fs.readFile(dataPath, 'utf8');
    
    // Parse JSON - expecting either an array of jobs or an object with a jobs array
    let jobsData;
    try {
      const parsedData = JSON.parse(rawData);
      
      if (Array.isArray(parsedData)) {
        jobsData = parsedData;
      } else if (parsedData.jobs && Array.isArray(parsedData.jobs)) {
        jobsData = parsedData.jobs;
      } else {
        throw new Error('Could not find jobs array in the JSON data');
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw parseError;
    }

    console.log(`Found ${jobsData.length} jobs to import`);

    // Import jobs in batches for better performance
    let importedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < jobsData.length; i += batchSize) {
      const batch = jobsData.slice(i, i + batchSize);
      
      for (const jobData of batch) {
        try {
          // Clean HTML from description if present
          if (jobData.html_description) {
            jobData.description = stripHtml(jobData.html_description);
          }
          
          // Extract tech stack from both title and description
          const titleAndDescription = `${jobData.title || ''} ${jobData.description || ''}`;
          const techStack = extractTechStack(titleAndDescription);
          
          console.log(`\nProcessing job: ${jobData.title || 'Untitled'}`);
          console.log('Detected tech stack:', techStack);

          // Insert job
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
              title: jobData.title || 'Untitled',
              company: jobData.company || 'Unknown Company',
              location: jobData.location || 'Remote',
              description: jobData.description || '',
              url: jobData.url || '',
              source: 'Jobcity', // Set the source to Jobcity
              posted_at: jobData.posted_at || new Date().toISOString(),
              salary: jobData.salary || '',
              html_description: jobData.html_description || '' // If your schema supports it
            })
            .select();

          if (jobError) {
            console.error(`Error inserting job ${jobData.title || 'Untitled'}:`, jobError);
            continue; // Skip to the next job
          }

          const jobId = job[0].id;
          
          // Process tech stack for this job
          for (const techName of techStack) {
            try {
              // Find or create tech
              const { data: techData, error: techError } = await supabase
                .from('tech')
                .select('id')
                .eq('name', techName)
                .maybeSingle();
              
              let techId;
              
              if (techError) {
                console.error(`Error finding tech ${techName}:`, techError);
                continue; // Skip to the next tech
              }
              
              if (techData) {
                techId = techData.id;
              } else {
                // Tech doesn't exist, create it
                const { data: newTech, error: createTechError } = await supabase
                  .from('tech')
                  .insert({ name: techName })
                  .select();
                
                if (createTechError) {
                  console.error(`Error creating tech ${techName}:`, createTechError);
                  continue; // Skip to the next tech
                }
                
                techId = newTech[0].id;
              }
              
              // Create the job-tech relationship
              const { error: relationError } = await supabase
                .from('job_tech')
                .insert({
                  job_id: jobId,
                  tech_id: techId
                });
              
              if (relationError) {
                console.error(`Error creating relationship between job ${jobId} and tech ${techId}:`, relationError);
              }
            } catch (techProcessError) {
              console.error(`Error processing tech ${techName}:`, techProcessError);
            }
          }
          
          importedCount++;
          if (importedCount % 10 === 0) {
            console.log(`Imported ${importedCount}/${jobsData.length} jobs`);
          }
          
        } catch (jobProcessError) {
          console.error(`Error processing job:`, jobProcessError);
        }
      }
    }

    console.log('\nJobcity import completed successfully!');
    console.log(`Total jobs imported: ${importedCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importJobs().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});