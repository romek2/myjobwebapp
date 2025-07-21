// scripts/import-mock-internal-job.js
// Based on your working remotive.js script
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (same as your remotive script)
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('Error: SUPABASE_URL is not set');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY is not set');
  process.exit(1);
}

console.log(`Connecting to Supabase URL: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Tech mapping (same as your remotive script)
const TECH_MAPPING = {
  'JavaScript': ['javascript', 'js', 'es6', 'es2015', 'ecmascript'],
  'TypeScript': ['typescript', 'ts'],
  'React': ['react', 'reactjs', 'react.js'],
  'Node.js': ['node', 'nodejs', 'node.js', 'express'],
  'Python': ['python', 'django', 'flask'],
  'PostgreSQL': ['postgresql', 'postgres', 'sql'],
  'AWS': ['aws', 'amazon web services', 'cloud'],
  'Docker': ['docker', 'containers'],
  'REST API': ['rest', 'api', 'restful'],
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

// Simple mock internal job data
const mockJob = {
  title: 'Test Internal Job',
  company: 'Test Company',
  location: 'Remote',
  description: 'This is a test job posting to verify the admin functionality works with JavaScript and React.',
  url: 'https://example.com/test-job',
  source: 'Internal',
  posted_at: new Date().toISOString(),
  salary: '$100,000'
};

async function importMockJob() {
  console.log('🚀 Starting simple mock job import...');
  
  try {
    // Extract tech stack from job description
    const titleAndDescription = `${mockJob.title} ${mockJob.description}`;
    const techStack = extractTechStack(titleAndDescription);
    console.log(`🔧 Detected tech stack: ${techStack.join(', ')}`);
    
    // Check if a similar job already exists
    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('title', mockJob.title)
      .eq('company', mockJob.company)
      .single();
    
    if (existingJob) {
      console.log(`⚠️  Job "${mockJob.title}" already exists (ID: ${existingJob.id})`);
      console.log('Skipping import to avoid duplicates.');
      return;
    }
    
    // Insert the job
    console.log('📝 Creating basic job posting...');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(mockJob)
      .select();

    if (jobError) {
      console.error('❌ Error creating job:', jobError);
      return;
    }

    const jobId = job[0].id;
    console.log(`✅ Job created successfully! ID: ${jobId}`);
    console.log(`   Title: ${job[0].title}`);
    console.log(`   Company: ${job[0].company}`);
    console.log(`   Source: ${job[0].source}`);
    
    // Process tech stack for this job (EXACTLY like your remotive script)
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
          continue;
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
            continue;
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
    
    console.log('\n🎉 Simple mock job import completed!');
    console.log(`   Source: ${job[0].source}`);
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  }
}

// Run the import
importMockJob().catch(error => {
  console.error('Fatal error during import:', error);
  process.exit(1);
});