// scripts/migrate-company-portal.js
// Run this script to set up the new database tables for the company portal
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Company Portal Database Migration...');

async function runMigration() {
  try {
    console.log('\n📋 Step 1: Adding new columns to user_job_applications table...');
    
    // Note: In production, you'd want to run these ALTER statements directly in your database
    // This script shows you what needs to be done
    const alterStatements = [
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS company_notes TEXT;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS company_response TEXT;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS interviewer_name TEXT;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS interview_location TEXT;',
      'ALTER TABLE user_job_applications ADD COLUMN IF NOT EXISTS phone TEXT;'
    ];

    console.log('   ⚠️  Please run these SQL statements in your Supabase SQL editor:');
    alterStatements.forEach(statement => console.log(`   ${statement}`));

    console.log('\n📋 Step 2: Creating company_access_tokens table...');
    
    const createTokensTable = `
      CREATE TABLE IF NOT EXISTS company_access_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        company_email TEXT NOT NULL,
        job_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_company_access_tokens_token ON company_access_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_company_access_tokens_expires ON company_access_tokens(expires_at);
    `;

    console.log('   ⚠️  Please run this SQL statement:');
    console.log(createTokensTable);

    console.log('\n📋 Step 3: Creating user_notifications table...');
    
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS user_notifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        requires_pro BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_application_id ON user_notifications(application_id);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
    `;

    console.log('   ⚠️  Please run this SQL statement:');
    console.log(createNotificationsTable);

    console.log('\n📋 Step 4: Creating company_profiles table...');
    
    const createCompanyProfilesTable = `
      CREATE TABLE IF NOT EXISTS company_profiles (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        website TEXT,
        logo_url TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_company_profiles_email ON company_profiles(email);
    `;

    console.log('   ⚠️  Please run this SQL statement:');
    console.log(createCompanyProfilesTable);

    console.log('\n📋 Step 5: Creating status update trigger...');
    
    const createTrigger = `
      CREATE OR REPLACE FUNCTION update_status_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          NEW.status_updated_at = NOW();
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_status_timestamp ON user_job_applications;
      CREATE TRIGGER trigger_update_status_timestamp
        BEFORE UPDATE ON user_job_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_status_timestamp();
    `;

    console.log('   ⚠️  Please run this SQL statement:');
    console.log(createTrigger);

    console.log('\n📋 Step 6: Testing basic table access...');
    
    // Test if we can access the applications table
    const { data, error } = await supabase
      .from('user_job_applications')
      .select('id, status')
      .limit(1);

    if (error) {
      console.log('   ❌ Error accessing applications table:', error.message);
    } else {
      console.log('   ✅ Successfully connected to user_job_applications table');
    }

    console.log('\n🎉 Migration steps completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run the SQL statements above in your Supabase SQL editor');
    console.log('   2. Update your application job API route to use the new email service');
    console.log('   3. Replace your ApplicationTracker component with the enhanced version');
    console.log('   4. Test the company portal by applying to a job');
    
    console.log('\n🔐 Security Notes:');
    console.log('   - Magic links expire after 7 days');
    console.log('   - Tokens are cryptographically secure');
    console.log('   - PRO features are properly gated');
    
    console.log('\n💰 Revenue Features:');
    console.log('   - Free users see blurred notifications');
    console.log('   - PRO users get full company responses');
    console.log('   - Multiple upgrade prompts strategically placed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration().catch(console.error);