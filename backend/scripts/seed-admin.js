/**
 * Seed Admin User Script
 * 
 * This script creates an admin user in Supabase Auth and adds them to the admins table.
 * 
 * Usage:
 * 1. Set your Supabase credentials in the .env file
 * 2. Run: node scripts/seed-admin.js
 * 
 * Or use the SQL version in seed-admin.sql
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@wrapitup.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!@#';

  console.log('Creating admin user...');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes('already registered')) {
        console.log('User already exists, fetching user...');
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === email);
        
        if (!user) {
          throw new Error('User exists but could not be found');
        }

        // Add to admins table
        const { error: adminError } = await supabase
          .from('admins')
          .upsert({
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (adminError) {
          throw adminError;
        }

        console.log('✅ Admin user already exists and has been added to admins table');
        console.log(`User ID: ${user.id}`);
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Add to admins table
    const { error: adminError } = await supabase
      .from('admins')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        created_at: new Date().toISOString(),
      });

    if (adminError) {
      throw adminError;
    }

    console.log('✅ Admin user created successfully!');
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Email: ${authData.user.email}`);
    console.log('\nYou can now login at: http://localhost:3221/admin/login');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

seedAdmin();
