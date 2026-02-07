/**
 * Products Seed Script
 * 
 * This script seeds all products into the database and attaches them to
 * their respective collections.
 * 
 * IMPORTANT NOTES:
 * - This is an IDEMPOTENT script - safe to run multiple times
 * - Uses UPSERT logic based on slug to prevent duplicates
 * - Products may appear in MULTIPLE collections (many-to-many)
 * - Each product exists ONLY ONCE in products table
 * - Images are NOT seeded - leave empty for later insertion
 * - Do NOT delete existing products or collections
 * 
 * PRICING LOGIC:
 * - "From LE X" → price_type = 'from', base_price = X
 * - Sale prices → base_price (original), discount_price (sale)
 * - "Sold out" → is_sold_out = true
 * - Regular prices → base_price, price_type = 'fixed'
 * - Currency: EGP (stored as numbers only)
 * 
 * HOW TO RUN:
 * 1. First run: products-schema-extensions.sql (if price_type/is_sold_out don't exist)
 * 2. Make sure your .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 3. Run: node scripts/seed-products.js
 * 4. Verify products appear in admin panel at /admin/products
 * 5. Verify collection assignments in /admin/collections
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


// All products with their data
const products = [
  // Letterlicious Trays
  { name: 'Letterlicious Tray (Large size)', price: 2200, priceType: 'fixed' },
  { name: 'Letterlicious Tray (Medium size)', price: 1350, priceType: 'fixed' },
  { name: 'Letterlicious Floral Tray', price: 2200, priceType: 'fixed' },
  { name: 'Letterlicious Candy Tray', price: 2200, priceType: 'fixed' },
  { name: 'Letterlicious Gluten Free', price: 2300, priceType: 'fixed' },
  { name: 'Nos w Nos Letterlicious Tray (Large size)', price: 2200, priceType: 'fixed' },
  
  // Royal Breakfast Trays
  { name: 'Heaven Tray (Small size)', price: 1550, priceType: 'fixed' },
  { name: 'Royal Cheese Tray with Cake and Donuts', price: 2800, priceType: 'from' },
  { name: 'Gourmet Cheese Platter', price: 1950, priceType: 'fixed' },
  { name: 'Royal Cheese Tray with a Cake', price: 2900, priceType: 'from' },
  { name: 'Royal Tray with a Cake', price: 2400, priceType: 'fixed' },
  { name: 'Royal Cheese Tray', price: 2700, priceType: 'from' },
  { name: 'Royal Tray', price: 2200, priceType: 'from' },
  { name: 'Royal Fruit Tray with a Cake', price: 2300, priceType: 'from' },
  { name: 'Royal Couple Tray', price: 2450, priceType: 'fixed' },
  { name: 'Love-Frame Twin Tray', price: 2600, priceType: 'fixed' },
  { name: 'Gourmet Platter with Cake', price: 2300, priceType: 'fixed' },
  { name: 'Royal Anniversary Tray', price: 2300, priceType: 'fixed' },
  { name: 'Royal Classic Breakfast Tray', price: 2300, priceType: 'fixed' },
  { name: 'Royal Sweet Morning Tray', price: 2200, priceType: 'fixed' },
  { name: 'Royal Fruit Tray', price: 1800, priceType: 'fixed' },
  
  // Birthday Celebration
  { name: 'Birthday Box', price: 1800, priceType: 'from' },
  { name: 'Birthday Box 2', price: 1700, priceType: 'fixed' },
  { name: 'Breakfast Offa', price: 1300, salePrice: 1200, priceType: 'fixed' },
  { name: 'Letterlicious Cupcakes Tray', price: 1600, priceType: 'fixed' },
  { name: 'Festive Box', price: 2800, priceType: 'fixed' },
  { name: 'Dessert Box with a Cake', price: 2100, priceType: 'fixed' },
  
  // Corporate Gifts
  { name: 'Corporate Mini Tray', price: 350, salePrice: 330, priceType: 'fixed' },
  { name: 'Corporate Morning Breakfast Tray', price: 280, priceType: 'fixed' },
  { name: 'Corporate Breakfast Star', price: 220, priceType: 'fixed' },
  { name: 'Breakfast Bites (min 30)', price: 90, priceType: 'fixed' },
  { name: 'Corporate Fanous (min 5)', price: 420, priceType: 'fixed' },
  { name: 'Corporate Treat Box (min 30)', price: 140, priceType: 'fixed' },
  { name: 'Mini Fruit Cup (min 20)', price: 50, priceType: 'fixed' },
  
  // Cheese Boxes
  { name: 'Cheese Box (Large size)', price: 1800, priceType: 'from' },
  { name: 'Gourmet Healthy Cheese Platter (Medium size)', price: 1300, priceType: 'fixed' },
  { name: 'Gourmet Cheese Platter (Medium size)', price: 1300, priceType: 'fixed' },
  { name: 'Cheese Tower', price: 2000, priceType: 'fixed' },
  
  // Breakfast Boxes
  { name: 'Breakfast Box for One', price: 850, priceType: 'from' },
  { name: 'Sunrise Bites for One', price: 1200, priceType: 'fixed' },
  { name: 'Breakfast Box for Two', price: 1500, priceType: 'from' },
  { name: 'Healthy Box', price: 850, priceType: 'fixed' },
  { name: 'Sunrise Bites for Two', price: 1700, priceType: 'fixed' },
  { name: 'Sunrise Light Bites for One', price: 1300, priceType: 'fixed' },
  { name: 'Sunrise Light Bites for Two', price: 1800, priceType: 'fixed' },
  { name: 'Breakfast Bouquet', price: 800, priceType: 'fixed' },
  { name: 'Kids Box 3', price: 1000, priceType: 'fixed' },
  { name: 'Kids Box 2', price: 1000, priceType: 'fixed' },
  { name: 'Kids Box 1', price: 1000, priceType: 'fixed' },
  { name: 'Floral Breakfast Box', price: 1400, priceType: 'fixed' },
  { name: 'Events Box', price: 3500, salePrice: 3300, priceType: 'fixed' },
  
  // Graduation 2025
  { name: 'Letterlicious Graduation Tray', price: 2200, priceType: 'fixed' },
  { name: 'Graduation Gift 🎓', price: 2200, priceType: 'fixed' },
  
  // Desserts Collection
  { name: 'Dessert Box (Large size)', price: 1800, priceType: 'fixed' },
  { name: 'Dessert Box (Medium size) 1', price: 1100, priceType: 'fixed' },
  { name: 'Dessert Bouquet (Small size)', price: 800, priceType: 'fixed' },
  { name: 'Dessert Box (Medium size) 2', price: 1100, priceType: 'fixed' },
  { name: 'Sweet Winter Tray', price: 800, priceType: 'fixed' },
  { name: 'Dessert Box (Medium size) 3', price: 1100, priceType: 'fixed' },
  
  // Fruits Boxes
  { name: 'Fruit Box (Medium size)', price: 1000, priceType: 'fixed' },
  { name: 'Fruits Box (Large size) 1', price: 2000, priceType: 'fixed' },
  
  // Chocolate Basket
  { name: 'Mini Bouquet Gift 🌷', price: 650, priceType: 'fixed', isSoldOut: true },
  { name: 'Bouquet Gift 💐', price: 1800, priceType: 'fixed' },
  { name: 'Floral & Chocolate Basket', price: 1800, priceType: 'fixed' },
  { name: 'Flowers Roche Box', price: 1800, priceType: 'fixed' },
];

// Collection assignments: { collectionSlug: [productNames in order] }
const collectionAssignments = {
  'letterlicious-trays': [
    'Letterlicious Tray (Large size)',
    'Letterlicious Tray (Medium size)',
    'Letterlicious Floral Tray',
    'Letterlicious Candy Tray',
    'Letterlicious Gluten Free',
    'Nos w Nos Letterlicious Tray (Large size)',
  ],
  'royal-breakfast-trays': [
    'Heaven Tray (Small size)',
    'Royal Cheese Tray with Cake and Donuts',
    'Gourmet Cheese Platter',
    'Royal Cheese Tray with a Cake',
    'Royal Tray with a Cake',
    'Royal Cheese Tray',
    'Royal Tray',
    'Royal Fruit Tray with a Cake',
    'Royal Couple Tray',
    'Love-Frame Twin Tray',
    'Gourmet Platter with Cake',
    'Royal Anniversary Tray',
    'Royal Classic Breakfast Tray',
    'Royal Sweet Morning Tray',
    'Royal Fruit Tray',
  ],
  'birthday-celebration': [
    'Letterlicious Tray (Large size)',
    'Birthday Box',
    'Heaven Tray (Small size)',
    'Birthday Box 2',
    'Royal Cheese Tray with Cake and Donuts',
    'Breakfast Offa',
    'Royal Cheese Tray with a Cake',
    'Royal Tray with a Cake',
    'Royal Tray',
    'Royal Fruit Tray with a Cake',
    'Royal Couple Tray',
    'Letterlicious Candy Tray',
    'Gourmet Platter with Cake',
    'Festive Box',
    'Dessert Box with a Cake',
    'Royal Classic Breakfast Tray',
    'Royal Sweet Morning Tray',
    'Letterlicious Cupcakes Tray',
  ],
  'corporate-gifts': [
    'Corporate Mini Tray',
    'Corporate Morning Breakfast Tray',
    'Corporate Breakfast Star',
    'Breakfast Bites (min 30)',
    'Corporate Fanous (min 5)',
    'Corporate Treat Box (min 30)',
    'Mini Fruit Cup (min 20)',
  ],
  'cheese-boxes': [
    'Letterlicious Tray (Large size)',
    'Letterlicious Tray (Medium size)',
    'Cheese Box (Large size)',
    'Gourmet Cheese Platter',
    'Royal Cheese Tray with a Cake',
    'Royal Cheese Tray',
    'Gourmet Platter with Cake',
    'Gourmet Healthy Cheese Platter (Medium size)',
    'Gourmet Cheese Platter (Medium size)',
    'Cheese Tower',
  ],
  'breakfast-boxes': [
    'Breakfast Box for One',
    'Sunrise Bites for One',
    'Breakfast Box for Two',
    'Healthy Box',
    'Sunrise Bites for Two',
    'Sunrise Light Bites for One',
    'Sunrise Light Bites for Two',
    'Breakfast Bouquet',
    'Kids Box 3',
    'Kids Box 2',
    'Kids Box 1',
    'Floral Breakfast Box',
    'Events Box',
    'Breakfast Offa',
  ],
  'graduation-2025': [
    'Letterlicious Tray (Large size)',
    'Letterlicious Graduation Tray',
    'Events Box',
    'Graduation Gift 🎓',
  ],
  'desserts-collection': [
    'Dessert Box (Large size)',
    'Dessert Box (Medium size) 1',
    'Dessert Bouquet (Small size)',
    'Royal Fruit Tray with a Cake',
    'Dessert Box (Medium size) 2',
    'Sweet Winter Tray',
    'Festive Box',
    'Dessert Box with a Cake',
    'Dessert Box (Medium size) 3',
  ],
  'fruits-boxes': [
    'Fruit Box (Medium size)',
    'Fruits Box (Large size) 1',
    'Royal Fruit Tray with a Cake',
    'Royal Fruit Tray',
  ],
  'chocolate-basket': [
    'Mini Bouquet Gift 🌷',
    'Bouquet Gift 💐',
    'Floral & Chocolate Basket',
    'Graduation Gift 🎓',
    'Flowers Roche Box',
  ],
};

async function seedProducts() {
  console.log('Starting products seed...\n');

  // Step 1: Insert/Update all products
  console.log('Step 1: Seeding products...');
  const productMap = new Map(); // name -> product data

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const slug = generateSlug(product.name);

    const productData = {
      title: product.name,
      slug,
      base_price: product.price,
      discount_price: product.salePrice || null,
      price_type: product.priceType || 'fixed',
      is_active: true,
      is_sold_out: product.isSoldOut || false,
      stock_quantity: 0,
    };

    try {
      // Check if product exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            ...productData,
            updated_at: new Date().toISOString(),
          })
          .eq('slug', slug);

        if (error) {
          console.error(`Error updating product "${product.name}":`, error.message);
        } else {
          console.log(`✓ Updated: ${product.name}`);
          productMap.set(product.name, { id: existing.id, slug });
        }
      } else {
        // Insert new product
        const { data: inserted, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();

        if (error) {
          console.error(`Error inserting product "${product.name}":`, error.message);
        } else {
          console.log(`✓ Created: ${product.name}`);
          productMap.set(product.name, { id: inserted.id, slug });
        }
      }
    } catch (error) {
      console.error(`Error processing product "${product.name}":`, error.message);
    }
  }

  // Step 2: Attach products to collections
  console.log('\nStep 2: Attaching products to collections...');

  for (const [collectionSlug, productNames] of Object.entries(collectionAssignments)) {
    // Get collection ID
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .single();

    if (collectionError || !collection) {
      console.error(`Collection "${collectionSlug}" not found. Skipping...`);
      continue;
    }

    console.log(`\n  Processing collection: ${collectionSlug}`);

    for (let i = 0; i < productNames.length; i++) {
      const productName = productNames[i];
      const productInfo = productMap.get(productName);

      if (!productInfo) {
        console.error(`    ✗ Product "${productName}" not found in products map`);
        continue;
      }

      try {
        const { error } = await supabase
          .from('collection_products')
          .upsert(
            {
              collection_id: collection.id,
              product_id: productInfo.id,
              display_order: i + 1,
            },
            {
              onConflict: 'collection_id,product_id',
            }
          );

        if (error) {
          console.error(`    ✗ Error attaching "${productName}":`, error.message);
        } else {
          console.log(`    ✓ Attached: ${productName} (order: ${i + 1})`);
        }
      } catch (error) {
        console.error(`    ✗ Error attaching "${productName}":`, error.message);
      }
    }
  }

  console.log('\n✓ Products seed completed!');
  console.log('\nVerifying seed...');

  // Verify the seed
  const { data: seededProducts, error: verifyError } = await supabase
    .from('products')
    .select('title, slug, base_price, price_type, is_active, is_sold_out')
    .order('title', { ascending: true });

  if (verifyError) {
    console.error('Error verifying seed:', verifyError.message);
  } else {
    console.log(`\nFound ${seededProducts.length} products`);
  }

  // Verify collection assignments
  const { data: collectionStats, error: statsError } = await supabase
    .from('collections')
    .select('name, slug, collection_products(count)')
    .order('display_order', { ascending: true });

  if (!statsError && collectionStats) {
    console.log('\nCollection assignments:');
    collectionStats.forEach((collection) => {
      const count = collection.collection_products?.[0]?.count || 0;
      console.log(`  ${collection.name}: ${count} products`);
    });
  }
}

seedProducts()
  .then(() => {
    console.log('\n✓ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seed script failed:', error);
    process.exit(1);
  });
