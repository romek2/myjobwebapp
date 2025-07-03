// app/api/pipeline/daily-jobs.js
const path = require('path');

export async function GET(request) {
  const results = [];
  
  try {
    console.log('Starting daily jobs...');
    
    // Get project root (3 levels up from app/api/pipeline/)
    const projectRoot = process.cwd();
    
    console.log('Project root:', projectRoot);
    console.log('Current file location:', __dirname);
    
    // Correct paths based on your structure
    const jobCityPipPath = path.join(projectRoot, 'jobcitypip.js');
    const remotivePath = path.join(projectRoot, 'scripts', 'remotive.js');
    
    console.log('Looking for jobcitypip at:', jobCityPipPath);
    console.log('Looking for remotive at:', remotivePath);
    
    // Run jobcitypip.js
    try {
      // Dynamic import for ES modules or require for CommonJS
      let jobCityPipModule;
      try {
        jobCityPipModule = await import(jobCityPipPath);
      } catch (importError) {
        console.log('Import failed, trying require:', importError.message);
        jobCityPipModule = require(jobCityPipPath);
      }
      
      // Call the main function (adjust based on how your script exports)
      if (jobCityPipModule.runJobCityPip) {
        await jobCityPipModule.runJobCityPip();
      } else if (jobCityPipModule.default) {
        await jobCityPipModule.default();
      } else {
        // If it's just a script that runs immediately, execute it
        console.log('Running jobcitypip script...');
      }
      
      results.push({ script: 'jobcitypip', status: 'success' });
      console.log('✓ jobcitypip completed successfully');
    } catch (error) {
      results.push({ script: 'jobcitypip', status: 'error', error: error.message });
      console.error('✗ jobcitypip failed:', error);
    }
    
    // Run remotive.js
    try {
      let remotiveModule;
      try {
        remotiveModule = await import(remotivePath);
      } catch (importError) {
        console.log('Import failed, trying require:', importError.message);
        remotiveModule = require(remotivePath);
      }
      
      // Call the main function (adjust based on how your script exports)
      if (remotiveModule.runRemotive) {
        await remotiveModule.runRemotive();
      } else if (remotiveModule.default) {
        await remotiveModule.default();
      } else {
        console.log('Running remotive script...');
      }
      
      results.push({ script: 'remotive', status: 'success' });
      console.log('✓ remotive completed successfully');
    } catch (error) {
      results.push({ script: 'remotive', status: 'error', error: error.message });
      console.error('✗ remotive failed:', error);
    }
    
    const hasErrors = results.some(r => r.status === 'error');
    
    return Response.json({
      success: !hasErrors,
      message: 'Daily jobs completed',
      results: results,
      timestamp: new Date().toISOString(),
      paths: {
        projectRoot,
        jobCityPipPath,
        remotivePath
      }
    }, { 
      status: hasErrors ? 207 : 200 
    });
    
  } catch (error) {
    console.error('Fatal error in daily jobs:', error);
    return Response.json({
      success: false,
      error: 'Fatal error running daily jobs',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { 
      status: 500 
    });
  }
}