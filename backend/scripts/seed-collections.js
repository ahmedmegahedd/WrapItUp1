/**
 * Collections Seed Script
 * 
 * This script seeds the initial collections data into the database.
 * 
 * IMPORTANT NOTES:
 * - This is an IDEMPOTENT script - safe to run multiple times
 * - It uses UPSERT logic based on slug to prevent duplicates
 * - Only collections are seeded here - products will be added later
 * - All collections are created as ACTIVE by default
 * - Display order reflects the exact order listed below
 * 
 * HOW TO RUN:
 * 1. Make sure your .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 2. Run: node scripts/seed-collections.js
 * 3. Verify collections appear in admin panel at /admin/collections
 * 
 * COLLECTIONS TO SEED (in order):
 * 1. Letterlicious Trays
 * 2. Royal Breakfast Trays
 * 3. Birthday Celebration
 * 4. Corporate Gifts
 * 5. Cheese Boxes
 * 6. Breakfast Boxes
 * 7. Graduation 2025
 * 8. Desserts Collection
 * 9. Fruits Boxes
 * 10. Chocolate Basket
 * 11. Kids Boxes
 * 12. Seasonal Gifts
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Collections to seed (in exact order)
const collections = [
  'Letterlicious Trays',
  'Royal Breakfast Trays',
  'Birthday Celebration',
  'Corporate Gifts',
  'Cheese Boxes',
  'Breakfast Boxes',
  'Graduation 2025',
  'Desserts Collection',
  'Fruits Boxes',
  'Chocolate Basket',
  'Kids Boxes',
  'Seasonal Gifts',
];

async function seedCollections() {
  console.log('Starting collections seed...\n');

  for (let i = 0; i < collections.length; i++) {
    const name = collections[i];
    const slug = generateSlug(name);
    const displayOrder = i + 1;

    try {
      // Check if collection exists
      const { data: existing } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        // Update existing collection
        const { error } = await supabase
          .from('collections')
          .update({
            name,
            is_active: true,
            display_order: displayOrder,
            updated_at: new Date().toISOString(),
          })
          .eq('slug', slug);

        if (error) {
          console.error(`Error updating collection "${name}":`, error.message);
        } else {
          console.log(`✓ Updated: ${name} (${slug})`);
        }
      } else {
        // Insert new collection
        const { error } = await supabase
          .from('collections')
          .insert({
            name,
            slug,
            is_active: true,
            display_order: displayOrder,
          });

        if (error) {
          console.error(`Error inserting collection "${name}":`, error.message);
        } else {
          console.log(`✓ Created: ${name} (${slug})`);
        }
      }
    } catch (error) {
      console.error(`Error processing collection "${name}":`, error.message);
    }
  }

  console.log('\n✓ Collections seed completed!');
  console.log('\nVerifying seed...');

  // Verify the seed
  const { data: seededCollections, error: verifyError } = await supabase
    .from('collections')
    .select('name, slug, is_active, display_order')
    .order('display_order', { ascending: true });

  if (verifyError) {
    console.error('Error verifying seed:', verifyError.message);
  } else {
    console.log(`\nFound ${seededCollections.length} collections:`);
    seededCollections.forEach((collection) => {
      console.log(`  ${collection.display_order}. ${collection.name} (${collection.slug}) - ${collection.is_active ? 'Active' : 'Inactive'}`);
    });
  }
}

seedCollections()
  .then(() => {
    console.log('\n✓ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed script failed:', error);
    process.exit(1);
  });
