// scripts/test-create-alert.js
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;


if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase client initialized');

// Replace with an actual user ID from your database
const TEST_USER_ID = 'cm7w97ruk0000lb037dxg2sox'; 

async function createTestAlert() {
  try {
    console.log('Creating test job alert...');
    
    // First, verify the table exists and check column names
    const { data: tableInfo, error: tableError } = await supabase
      .from('JobAlert')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') { // relation does not exist
        console.error('Error: JobAlert table does not exist. Did you run the migration?');
        return;
      }
      console.error('Error checking JobAlert table:', tableError);
      
      // Try to get column information for debugging
      const { data: columnInfo, error: columnError } = await supabase.rpc('get_table_columns', { 
        table_name: 'JobAlert'
      });
      
      if (!columnError && columnInfo) {
        console.log('Available columns in JobAlert table:', columnInfo);
      } else {
        console.log('Could not retrieve column information');
        // Let's try alternative approaches
        console.log('Inspecting first row to determine column names...');
        
        // Just try to get anything from the table to see what we get
        const { data: anyData, error: anyError } = await supabase
          .from('JobAlert')
          .select('*')
          .limit(1);
          
        if (!anyError && anyData && anyData.length > 0) {
          console.log('Column names in first row:', Object.keys(anyData[0]));
        } else {
          console.log('Could not retrieve sample data');
        }
      }
      
      return;
    }
    
    // Check sample row to determine column names
    if (tableInfo && tableInfo.length > 0) {
      console.log('Available columns in JobAlert:', Object.keys(tableInfo[0]));
    } else {
      console.log('JobAlert table exists but is empty');
    }
    
    console.log('JobAlert table exists, proceeding with test insert');
    
    // Try to determine the correct column name for user ID
    // Common variations: user_id, userId, userid
    const userIdOptions = ['user_id', 'userId', 'userid', 'user'];
    let correctUserIdColumn = 'userId'; // Default guess
    
    if (tableInfo && tableInfo.length > 0) {
      for (const option of userIdOptions) {
        if (option in tableInfo[0]) {
          correctUserIdColumn = option;
          console.log(`Found user ID column: "${correctUserIdColumn}"`);
          break;
        }
      }
    }
    
    // Create a dynamic insert object
    const currentTime = new Date().toISOString();
    const insertData = {
      id: `test-alert-${Date.now()}`, // Generate a unique ID
      name: 'Test Alert Script',
      keywords: 'JavaScript, React, Node.js',
      frequency: 'daily',
      active: true,
      updatedAt: currentTime,
      createdAt: currentTime
    };
    
    // Set the user ID using the determined column name
    insertData[correctUserIdColumn] = TEST_USER_ID;
    
    console.log('Inserting with data:', insertData);
    
    // Insert a test alert
    const { data, error } = await supabase
      .from('JobAlert')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Error creating test alert:', error);
      return;
    }
    
    console.log('Test alert created successfully:', data[0]);
    
    // Optionally, test the process API
    console.log('\nTesting alert processing...');
    const testJob = {
    id: '41',
      title: 'Senior JavaScript Developer',
      company: 'Test Company Inc',
      location: 'Remote',
      description: 'A great job working with React and Node.js',
      url: 'https://example.com/job',
      posted_at: new Date().toISOString(),
      salary: '$120,000 - $150,000'
    };
    
    // Insert a test job
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert(testJob)
      .select();
    
    if (jobError) {
      console.error('Error creating test job:', jobError);
    } else {
      console.log('Test job created:', jobData[0].id);
      
      // Determine correct column names for JobAlertHistory
      const alertIdOptions = ['alert_id', 'alertId', 'alertid'];
      const jobIdOptions = ['job_id', 'jobId', 'jobid'];
      
      let correctAlertIdColumn = 'alertId'; // Default guess
      let correctJobIdColumn = 'jobId'; // Default guess
      
      // Create a dynamic history insert object
      const historyData = {
        id: `history-${Date.now()}`, // Generate a unique ID
        alertId: data[0].id,
        jobId: jobData[0].id,
        sentAt: new Date().toISOString(),
      };
      
      // Set the alert ID and job ID using best guesses
      historyData[correctAlertIdColumn] = data[0].id;
      historyData[correctJobIdColumn] = jobData[0].id;
      
      console.log('Inserting history with data:', historyData);
      
      // Create a test history entry
      const { error: historyError } = await supabase
        .from('JobAlertHistory')
        .insert(historyData);
      
      if (historyError) {
        console.error('Error creating test history:', historyError);
      } else {
        console.log('Test history entry created successfully');
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

createTestAlert().catch(console.error);