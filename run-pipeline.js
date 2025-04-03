// run-pipeline.js
// This script runs the Python scraper followed by the Node.js import script
// Perfect for testing the full pipeline process

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

// Log function with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Run Python script to fetch jobs
async function runPythonScraper() {
  log('Starting Python scraper to fetch jobs from Remotive API...');
  
  try {
    const pythonScript = path.join(__dirname, 'scripts', 'remotive.py');
    log(`Executing: python ${pythonScript}`);
    
    const { stdout, stderr } = await execPromise(`python ${pythonScript}`);
    
    if (stderr) {
      log(`Python script stderr: ${stderr}`);
    }
    
    log(`Python script output: ${stdout}`);
    log('Python scraper completed successfully');
    
    // Verify the JSON file was created
    const jsonPath = path.join(__dirname, 'remotive_jobs.json');
    if (fs.existsSync(jsonPath)) {
      const stats = fs.statSync(jsonPath);
      log(`JSON file created: ${jsonPath} (${stats.size} bytes)`);
      return true;
    } else {
      log(`Error: JSON file not found at ${jsonPath}`);
      return false;
    }
  } catch (error) {
    log(`Error running Python scraper: ${error.message}`);
    return false;
  }
}

// Run Node.js script to import jobs to database
async function runNodeImporter() {
  log('Starting Node.js importer to add jobs to database...');
  
  try {
    const nodeScript = path.join(__dirname, 'scripts', 'remotive.js');
    log(`Executing: node ${nodeScript}`);
    
    const { stdout, stderr } = await execPromise(`node ${nodeScript}`);
    
    if (stderr) {
      log(`Node.js script stderr: ${stderr}`);
    }
    
    log(`Node.js script output: ${stdout}`);
    log('Node.js importer completed successfully');
    return true;
  } catch (error) {
    log(`Error running Node.js importer: ${error.message}`);
    return false;
  }
}

// Main function to run the pipeline
async function runPipeline() {
  log('Starting job pipeline test...');
  
  try {
    // Step 1: Run Python scraper
    const scraperSuccess = await runPythonScraper();
    
    if (!scraperSuccess) {
      log('Python scraper failed or did not produce a valid output file');
      process.exit(1);
    }
    
    // Step 2: Run Node.js importer
    const importerSuccess = await runNodeImporter();
    
    if (!importerSuccess) {
      log('Node.js importer failed');
      process.exit(1);
    }
    
    log('Pipeline test completed successfully!');
  } catch (error) {
    log(`Pipeline test failed with error: ${error.message}`);
    process.exit(1);
  }
}

// Run the pipeline
runPipeline().catch(error => {
  log(`Unhandled error in pipeline: ${error.message}`);
  process.exit(1);
});