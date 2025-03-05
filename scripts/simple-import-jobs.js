// scripts/simple-import-jobs.js
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

// Tech mapping
const TECH_MAPPING = {
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
  // Add more as needed...
};

const TECH_VARIATIONS = Object.entries(TECH_MAPPING).reduce((acc, [main, variations]) => {
  variations.forEach(variation => {
    acc[variation] = main;
  });
  return acc;
}, {});

function extractTechStack(text) {
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

async function importJobs() {
  console.log('Starting job import...');

  try {
    const dataPath = path.join(__dirname, '..', 'jobs-data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const { jobs } = JSON.parse(rawData);

    console.log(`Found ${jobs.length} jobs to import`);
    
    let importedCount = 0;
    
    for (const jobData of jobs) {
      try {
        // Extract tech stack
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
            posted_at: new Date(jobData.postedAt).toISOString(),
            salary: jobData.salary,
          })
          .select();

        if (jobError) {
          console.error(`Error inserting job:`, jobError);
          continue;
        }

        const jobId = job[0].id;
        
        // Process tech stack
        for (const techName of techStack) {
          // Check if tech exists
          let { data: existingTech, error: findError } = await supabase
            .from('tech')
            .select('id')
            .eq('name', techName)
            .maybeSingle();
          
          let techId;
          
          if (findError) {
            console.error(`Error finding tech ${techName}:`, findError);
            continue;
          }
          
          if (existingTech) {
            techId = existingTech.id;
          } else {
            // Create tech
            const { data: newTech, error: createError } = await supabase
              .from('tech')
              .insert({ name: techName })
              .select();
            
            if (createError) {
              console.error(`Error creating tech ${techName}:`, createError);
              continue;
            }
            
            techId = newTech[0].id;
          }
          
          // Create job-tech relationship
          const { error: relationError } = await supabase
            .from('job_tech')
            .insert({
              job_id: jobId,
              tech_id: techId
            });
          
          if (relationError) {
            console.error(`Error creating job-tech relationship:`, relationError);
          }
        }
        
        importedCount++;
        if (importedCount % 10 === 0) {
          console.log(`Imported ${importedCount}/${jobs.length} jobs`);
        }
        
      } catch (jobError) {
        console.error(`Error processing job:`, jobError);
      }
    }

    console.log('\nImport completed!');
    console.log(`Total jobs imported: ${importedCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  }
}

importJobs().catch(console.error);