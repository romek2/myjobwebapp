// scripts/import-jobs.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

// Tech mapping similar to our TypeScript version but in CommonJS
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
  // ... (same as TypeScript version)
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

async function importJobs() {
  console.log('Starting job import...');

  try {
    const dataPath = path.join(__dirname, '..', 'jobs-data.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const { jobs } = JSON.parse(rawData);

    console.log(`Found ${jobs.length} jobs to import`);

    // Clear existing data
    await prisma.jobTech.deleteMany();
    await prisma.job.deleteMany();
    await prisma.tech.deleteMany();

    console.log('Cleared existing data');

    let importedCount = 0;
    for (const jobData of jobs) {
      // Extract tech stack from both title and description
      const titleAndDescription = `${jobData.title} ${jobData.description}`;
      const techStack = extractTechStack(titleAndDescription);
      
      console.log(`\nProcessing job: ${jobData.title}`);
      console.log('Detected tech stack:', techStack);

      const job = await prisma.job.create({
        data: {
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          url: jobData.url,
          source: jobData.source,
          postedAt: new Date(jobData.postedAt),
          salary: jobData.salary,
        }
      });

      // Create tech stack connections
      for (const techName of techStack) {
        const tech = await prisma.tech.upsert({
          where: { name: techName },
          create: { name: techName },
          update: {}
        });

        await prisma.jobTech.create({
          data: {
            jobId: job.id,
            techId: tech.id
          }
        });
      }

      importedCount++;
      if (importedCount % 10 === 0) {
        console.log(`Imported ${importedCount}/${jobs.length} jobs`);
      }
    }

    console.log('\nImport completed successfully!');
    console.log(`Total jobs imported: ${importedCount}`);

  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importJobs().catch(console.error);