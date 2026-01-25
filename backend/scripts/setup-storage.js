const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupStorage() {
  try {
    console.log('🔧 Setting up Supabase Storage...\n');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'product-images');

    if (bucketExists) {
      console.log('✅ Bucket "product-images" already exists!\n');
      
      // Check if it's public
      const bucket = buckets.find(b => b.name === 'product-images');
      if (bucket.public) {
        console.log('✅ Bucket is already public\n');
      } else {
        console.log('⚠️  Bucket exists but is not public. Making it public...');
        // Note: Supabase JS client doesn't have a direct method to update bucket settings
        // You may need to do this manually in the dashboard or use the Management API
        console.log('   Please make the bucket public in the Supabase dashboard:\n');
        console.log('   1. Go to Storage → product-images');
        console.log('   2. Click "Settings"');
        console.log('   3. Toggle "Public bucket" to ON\n');
      }
    } else {
      console.log('📦 Creating bucket "product-images"...');
      
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*']
      });

      if (error) {
        // If bucket creation fails, it might be a permissions issue
        console.error('❌ Error creating bucket:', error.message);
        console.log('\n📝 Manual setup required:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to Storage → New bucket');
        console.log('   4. Name: product-images');
        console.log('   5. Public bucket: ON');
        console.log('   6. Click Create bucket\n');
        process.exit(1);
      }

      console.log('✅ Bucket "product-images" created successfully!\n');
    }

    // Set up storage policies
    console.log('🔐 Setting up storage policies...\n');
    
    // Note: Storage policies need to be set via SQL
    console.log('📝 Please run this SQL in your Supabase SQL Editor:\n');
    console.log(`
-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload (for admin panel)
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
    `);

    console.log('\n✅ Storage setup instructions provided!\n');
    console.log('💡 Tip: If you want public uploads (simpler for admin), use this policy instead:\n');
    console.log(`
CREATE POLICY IF NOT EXISTS "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');
    `);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

setupStorage();
