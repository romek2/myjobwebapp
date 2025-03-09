// scripts/import-jobs.js
// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg'); // Add PostgreSQL client for direct table creation

// Initialize Supabase client
// Try to get values from environment variables
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

// Tech mapping similar to original version
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
  // ... (add the rest of your mappings)
};

const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
  variations.forEach(variation => {
    acc[variation] = main;
  });
  return acc;
}, {});

function extractTechStack(text) {
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
      // This might not be available in all Supabase plans
      console.error(`Cannot create table ${tableName}. Please create it manually.`);
      console.log(`SQL to create table:\n${createTableSQL}`);
      throw new Error(`Table ${tableName} doesn't exist and cannot be created automatically`);
    }
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
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
    
    console.log('Database schema verified/created');

    // Load job data
    const dataPath = path.join(__dirname, '..', 'jobs-data2.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const { jobs } = JSON.parse(rawData);

    console.log(`Found ${jobs.length} jobs to import`);

    // Import jobs in batches for better performance
    let importedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      for (const jobData of batch) {
        try {
          // Extract tech stack from both title and description
          const titleAndDescription = `${jobData.title} ${jobData.description}`;
          const techStack = extractTechStack(titleAndDescription);
          
          console.log(`\nProcessing job: ${jobData.title}`);
          console.log('Detected tech stack:', techStack);

          // Insert job
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
              title: jobData.title,
              company: jobData.company,
              location: jobData.location,
              description: jobData.description,
              url: jobData.url,
              source: jobData.source,
              posted_at: new Date().toISOString(), // Current time instead of jobData.postedAt
              salary: jobData.salary,
            })
            .select();

          if (jobError) {
            console.error(`Error inserting job ${jobData.title}:`, jobError);
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
          console.error(`Error processing job ${jobData.title}:`, jobProcessError);
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