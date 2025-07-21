// scripts/import-internal-jobs.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function importInternalJobs() {
  console.log('Importing internal job postings...');
  
  try {
    // Read internal jobs from JSON file
    const internalJobs = await fs.readFile('./internal-jobs.json', 'utf8');
    const jobs = JSON.parse(internalJobs);
    
    for (const jobData of jobs) {
      // Extract tech stack
      const techStack = extractTechStack(`${jobData.title} ${jobData.description}`);
      
      // Insert job with internal application type
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url || `https://jobmatcher.com/jobs/${jobData.slug}`,
          source: 'Internal',
          posted_at: new Date().toISOString(),
          salary: jobData.salary || '',
          application_type: 'direct',  // 👈 KEY DIFFERENCE
          employer_email: jobData.employer_email,  // For notifications
          application_deadline: jobData.deadline,
          job_type: jobData.job_type || 'Full-time',
          experience_level: jobData.experience_level || 'Mid',
          benefits: jobData.benefits || []
        })
        .select();
      
      if (jobError) {
        console.error(`Error inserting job ${jobData.title}:`, jobError);
        continue;
      }
      
      const jobId = job[0].id;
      
      // Process tech stack relationships
      for (const techName of techStack) {
        await createJobTechRelationship(jobId, techName);
      }
      
      console.log(`✅ Imported: ${jobData.title} at ${jobData.company}`);
    }
    
    console.log('Internal jobs import completed!');
    
  } catch (error) {
    console.error('Error importing internal jobs:', error);
  }
}

// Helper function to create tech relationships (same as existing scripts)
async function createJobTechRelationship(jobId, techName) {
  // Find or create tech
  let { data: techData, error } = await supabase
    .from('tech')
    .select('id')
    .eq('name', techName)
    .maybeSingle();
  
  let techId;
  
  if (techData) {
    techId = techData.id;
  } else {
    const { data: newTech, error: createError } = await supabase
      .from('tech')
      .insert({ name: techName })
      .select();
    
    if (createError) return;
    techId = newTech[0].id;
  }
  
  // Create relationship
  await supabase
    .from('job_tech')
    .insert({ job_id: jobId, tech_id: techId });
}

importInternalJobs().catch(console.error);