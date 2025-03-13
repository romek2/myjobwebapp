// scripts/import-jobs.js
// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg'); 
const axios = require('axios'); // For API requests

// Initialize Supabase client
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin access
let pgConnectionString = process.env.DATABASE_URL; // For direct PostgreSQL connection

// Check if values are set
if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL is not set');
  console.log('Please set your Supabase URL in the .env file');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set');
  console.log('Please set your Supabase service key in the .env file');
  process.exit(1);
}

// Debug info
console.log(`Connecting to Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Function to extract tech stack from text
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

// Helper function to check if a table exists and create it if not
async function ensureTableExists(tableName, createTableSQL) {
  try {
    // Check if table exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If there's no error, the table exists
    if (!error) {
      console.log(`Table ${tableName} exists`);
      return true;
    }
    
    // If there's an error, the table might not exist
    console.log(`Table ${tableName} doesn't exist. Creating it...`);
    
    // If PostgreSQL connection string is available, use direct connection
    if (pgConnectionString) {
      try {
        const pool = new Pool({ connectionString: pgConnectionString });
        await pool.query(createTableSQL);
        await pool.end();
        console.log(`Table ${tableName} created successfully`);
        return true;
      } catch (pgError) {
        console.error(`Error creating table ${tableName} with direct connection:`, pgError);
        throw pgError;
      }
    } else {
      // Without direct PostgreSQL access, we'll need to use Supabase's SQL execution
      console.error(`Cannot create table ${tableName}. Please create it manually.`);
      console.log(`SQL to create table:\n${createTableSQL}`);
      throw new Error(`Table ${tableName} doesn't exist and cannot be created automatically`);
    }
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
}

// Add the html_description column to the jobs table if it doesn't exist
async function addHtmlDescriptionColumn() {
  try {
    console.log("Checking if html_description column exists...");
    
    if (pgConnectionString) {
      const pool = new Pool({ connectionString: pgConnectionString });
      
      // Check if the column exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'html_description';
      `;
      
      const result = await pool.query(checkColumnQuery);
      
      if (result.rows.length === 0) {
        console.log("html_description column does not exist. Adding it now...");
        
        // Add the column
        const addColumnQuery = `
          ALTER TABLE jobs
          ADD COLUMN html_description TEXT;
        `;
        
        await pool.query(addColumnQuery);
        console.log("html_description column added successfully");
      } else {
        console.log("html_description column already exists");
      }
      
      await pool.end();
      return true;
    } else {
      console.log("No direct PostgreSQL connection available. Please add the html_description column manually with:");
      console.log("ALTER TABLE jobs ADD COLUMN html_description TEXT;");
      return false;
    }
  } catch (error) {
    console.error("Error managing html_description column:", error);
    return false;
  }
}

// Function to strip HTML tags from text
function stripHtml(html) {
  if (!html) return '';
  
  // Basic HTML stripping - for more advanced cases, consider using a library like sanitize-html
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

// Function to fetch jobs from Remotive API
async function fetchRemotiveJobs(category = 'software-development', limit = 100) {
  try {
    console.log(`Fetching jobs from Remotive API with category: ${category}, limit: ${limit}`);
    
    // Build the API URL with parameters
    let apiUrl = 'https://remotive.com/api/remote-jobs';
    const params = [];
    
    if (category) {
      params.push(`category=${encodeURIComponent(category)}`);
    }
    
    if (limit && Number.isInteger(limit) && limit > 0) {
      params.push(`limit=${limit}`);
    }
    
    if (params.length > 0) {
      apiUrl += '?' + params.join('&');
    }
    
    // Make the API request
    const response = await axios.get(apiUrl);
    
    if (response.status !== 200) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = response.data;
    const jobCount = data['job-count'] || 0;
    const jobs = data.jobs || [];
    
    console.log(`Retrieved ${jobCount} jobs from Remotive API`);
    
    // Process each job to standardize the format and clean HTML
    return jobs.map(job => ({
      title: job.title || 'No Title',
      company: job.company_name || 'Unknown Company',
      location: job.candidate_required_location || 'Remote',
      description: stripHtml(job.description || ''), // Strip HTML tags from description
      html_description: job.description || '', // Keep original HTML for reference
      url: job.url || '',
      source: 'Remotive',
      posted_at: job.publication_date || new Date().toISOString(),
      salary: job.salary || '',
      job_type: job.job_type || '',
      category: job.category || '',
    }));
    
  } catch (error) {
    console.error('Error fetching data from Remotive API:', error.message);
    return [];
  }
}

// Main import function
async function importJobs() {
  console.log('Starting job import...');

  try {
    // Ensure tables exist
    console.log('Checking database schema...');
    
    await ensureTableExists('tech', `
      CREATE TABLE public.tech (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await ensureTableExists('jobs', `
      CREATE TABLE public.jobs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        description TEXT,
        url TEXT,
        source TEXT,
        posted_at TIMESTAMP WITH TIME ZONE,
        salary TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await ensureTableExists('job_tech', `
      CREATE TABLE public.job_tech (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES public.jobs(id) ON DELETE CASCADE,
        tech_id INTEGER REFERENCES public.tech(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(job_id, tech_id)
      );
    `);
    
    // Check if html_description column exists and add it if needed
    const columnAdded = await addHtmlDescriptionColumn();
    const hasHtmlDescriptionColumn = columnAdded;
    
    console.log('Database schema verified/created');

    // Fetch jobs from Remotive API
    console.log('Fetching jobs from Remotive API...');
    const jobs = await fetchRemotiveJobs('software-development', 200);
    console.log(`Found ${jobs.length} jobs from Remotive API`);
    
    if (jobs.length === 0) {
      console.log('No jobs found. Exiting...');
      return;
    }

    // Import jobs in batches for better performance
    let importedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      for (const jobData of batch) {
        try {
          // Extract tech stack from both title and cleaned description
          const titleAndDescription = `${jobData.title || ''} ${jobData.description || ''}`;
          const techStack = extractTechStack(titleAndDescription);
          
          console.log(`\nProcessing job: ${jobData.title || 'Untitled'}`);
          console.log('Detected tech stack:', techStack);

          // Prepare job data object
          const jobInsertData = {
            title: jobData.title || 'Untitled',
            company: jobData.company || 'Unknown',
            location: jobData.location || 'Remote',
            description: jobData.description || '', // Cleaned description without HTML
            url: jobData.url || '',
            source: jobData.source || 'Remotive',
            posted_at: jobData.posted_at || new Date().toISOString(),
            salary: jobData.salary || '',
          };
          
          // Only add html_description if the column exists
          if (hasHtmlDescriptionColumn) {
            jobInsertData.html_description = jobData.html_description || '';
          }

          // Insert job
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert(jobInsertData)
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
            console.log(`Imported ${importedCount}/${jobs.length} jobs`);
          }
          
        } catch (jobProcessError) {
          console.error(`Error processing job ${jobData?.title || 'Untitled'}:`, jobProcessError);
        }
      }
    }

    console.log('\nImport completed successfully!');
    console.log(`Total jobs imported: ${importedCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  }
}

importJobs().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});