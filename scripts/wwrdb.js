// scripts/weworkremotely.js
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Initialize Supabase client
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_KEY;
let pgConnectionString = process.env.DATABASE_URL;

if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tech mapping and extraction functions from previous script
const TECH_MAPPING = {
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'frontend'],
  'TypeScript': ['typescript', 'ts'],
  'Python': ['python', 'python3', 'django', 'flask', 'backend'],
  'Java': ['java', 'spring', 'backend'],
  'React': ['react', 'reactjs', 'react.js', 'frontend'],
  'Node.js': ['node', 'nodejs', 'node.js', 'express', 'backend'],
  'Cloud': ['aws', 'azure', 'gcp', 'cloud', 'devops'],
  'Full Stack': ['full stack', 'fullstack', 'full-stack'],
  'Data Science': ['data science', 'machine learning', 'ai', 'analytics'],
  'Mobile': ['mobile', 'ios', 'android', 'react native']
};

const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
  variations.forEach(variation => {
    acc[variation] = main;
  });
  return acc;
}, {});

function extractTechStack(text) {
  if (!text) return [];
  
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
      console.error(`Cannot create table ${tableName}. Please create it manually.`);
      console.log(`SQL to create table:\n${createTableSQL}`);
      throw new Error(`Table ${tableName} doesn't exist and cannot be created automatically`);
    }
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
}

// Function to strip HTML tags from text
function stripHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Main import function
async function importWeWorkRemotelyJobs() {
  console.log('Starting WeWorkRemotely job import...');

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

    // Read job data from JSON file
    const dataPath = path.join(__dirname, '..', 'weworkremotely_jobs.json');
    console.log(`Reading data from ${dataPath}`);
    
    const rawData = await fs.readFile(dataPath, 'utf8');
    const jobs = JSON.parse(rawData);

    console.log(`Found ${jobs.length} jobs to import`);

    // Import jobs in batches
    let importedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      for (const jobData of batch) {
        try {
          // Extract tech stack from title and description
          const titleAndDescription = `${jobData.title || ''} ${jobData.description || ''}`;
          const techStack = extractTechStack(titleAndDescription);
          
          console.log(`\nProcessing job: ${jobData.title || 'Untitled'}`);
          console.log('Detected tech stack:', techStack);

          // Prepare job data object
          const jobInsertData = {
            title: jobData.title || 'Untitled',
            company: jobData.company || 'Unknown Company',
            location: jobData.location || 'Remote',
            description: stripHtml(jobData.description || ''),
            url: jobData.url || '',
            source: 'WeWorkRemotely',
            posted_at: jobData.posted_at || new Date().toISOString(),
            salary: '' // No salary info in current extraction
          };

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
          console.error(`Error processing job:`, jobProcessError);
        }
      }
    }

    console.log('\nWeWorkRemotely job import completed successfully!');
    console.log(`Total jobs imported: ${importedCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  }
}

// Run the import
importWeWorkRemotelyJobs().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});