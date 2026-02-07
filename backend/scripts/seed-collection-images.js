/**
 * Seed collection images from a folder of image files.
 *
 * Each file name (without extension) is matched to a collection slug.
 * The image is uploaded to Supabase Storage and the collection's image_url is updated.
 *
 * Folder: flat list of images, e.g.:
 *   Birthday Gifts.webp  -> birthday-celebration
 *   Breakfast Boxes.jpg  -> breakfast-boxes
 *   Royal Gifts.webp     -> royal-breakfast-trays
 *
 * Prerequisites:
 * - backend/.env has SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * - Bucket "product-images" exists and is public
 * - Collections already in DB (run seed-collections.js first)
 *
 * Usage (from backend/):
 *   node scripts/seed-collection-images.js "/path/to/collectionOhotos"
 *   SEED_COLLECTION_IMAGES_FOLDER="/path" npm run seed-collection-images
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const folderPath = process.env.SEED_COLLECTION_IMAGES_FOLDER || process.argv[2];

const BUCKET = 'product-images';
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
  process.exit(1);
}

if (!folderPath) {
  console.error('Usage: node scripts/seed-collection-images.js "/path/to/collectionOhotos"');
  console.error('   or: SEED_COLLECTION_IMAGES_FOLDER="/path" npm run seed-collection-images');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Normalize file base name to a key for lookup (lowercase, trim, single spaces -> hyphen) */
function fileBaseToKey(base) {
  return base
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * Map from normalized file name (no extension) to collection slug in DB.
 * Add or edit entries to match your folder and collections.
 */
const FILE_TO_COLLECTION_SLUG = {
  'birthday-gifts': 'birthday-celebration',
  'breakfast-boxes': 'breakfast-boxes',
  'cheesy-gifts': 'cheese-boxes',
  'chocolate-gifts': 'chocolate-basket',
  'dessert-gifts': 'desserts-collection',
  'fruity-gifts': 'fruits-boxes',
  'healthy-gifts': null, // no matching collection; skip
  'kids-boxes': 'kids-boxes',
  'royal-gifts': 'royal-breakfast-trays',
  'letterlicious-trays': 'letterlicious-trays',
  'corporate-gifts': 'corporate-gifts',
  'graduation-2025': 'graduation-2025',
  'seasonal-gifts': 'seasonal-gifts',
};

function isImageFile(name) {
  return IMAGE_EXT.has(path.extname(name).toLowerCase());
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  return map[ext] || 'image/jpeg';
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`List buckets: ${error.message}`);
  if (!buckets.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ['image/*'],
    });
    if (createErr) throw new Error(`Create bucket: ${createErr.message}`);
    console.log('Created bucket "product-images"');
  }
}

async function main() {
  const resolvedPath = path.resolve(folderPath);
  try {
    await fs.access(resolvedPath);
  } catch {
    console.error('Folder not found:', resolvedPath);
    process.exit(1);
  }

  console.log('Seed collection images from folder → Supabase Storage + DB\n');
  console.log('Folder:', resolvedPath);
  console.log('');

  await ensureBucket();

  const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && isImageFile(e.name)).map((e) => e.name);

  if (files.length === 0) {
    console.error('No image files (.jpg, .jpeg, .png, .webp, .gif) found in folder.');
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    const base = path.basename(filename, path.extname(filename));
    const key = fileBaseToKey(base);
    const slug = FILE_TO_COLLECTION_SLUG[key];

    if (!slug) {
      console.log(`⊘ ${filename} → no collection mapping for "${key}", skip`);
      skipped++;
      continue;
    }

    const { data: collection, error: colError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (colError || !collection) {
      console.log(`✗ ${filename} → collection slug "${slug}" not in DB, skip`);
      skipped++;
      continue;
    }

    const localPath = path.join(resolvedPath, filename);
    const buffer = await fs.readFile(localPath).catch((err) => {
      console.error(`  Read failed ${filename}:`, err.message);
      return null;
    });
    if (!buffer) {
      errors++;
      continue;
    }

    const ext = path.extname(filename).toLowerCase();
    const storagePath = `collections/${slug}${ext}`;
    const contentType = getMimeType(filename);

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

    if (uploadError) {
      console.error(`  Upload failed ${filename}:`, uploadError.message);
      errors++;
      continue;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('collections')
      .update({ image_url: publicUrl })
      .eq('id', collection.id);

    if (updateError) {
      console.error(`  Update DB failed ${filename}:`, updateError.message);
      errors++;
    } else {
      console.log(`✓ ${collection.name} (${slug}) ← ${filename}`);
      updated++;
    }
  }

  console.log('\nDone.');
  console.log(`  Updated: ${updated} collections`);
  if (skipped) console.log(`  Skipped: ${skipped} files`);
  if (errors) console.log(`  Errors: ${errors}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
