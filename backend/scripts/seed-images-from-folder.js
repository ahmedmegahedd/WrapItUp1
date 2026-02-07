/**
 * Seed product images from a local folder into Supabase Storage and DB.
 *
 * Folder structure: each subfolder name = product name (with hyphens for spaces).
 *   Example: "Birthday-Box" → product slug "birthday-box"
 *            "Breakfast-Box-for-One" → "breakfast-box-for-one"
 *
 * Images inside each subfolder are uploaded to Storage and linked to the product.
 *
 * Prerequisites:
 * - Run from backend/: npm run seed-images (or node scripts/seed-images-from-folder.js)
 * - .env has SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * - Bucket "product-images" exists and is public (run setup-storage.js if needed)
 * - Products already seeded (run seed-products.js first)
 *
 * Usage (from backend/):
 *   SEED_IMAGES_FOLDER="/path/to/folder" npm run seed-images
 *   npm run seed-images -- "/path/to/your/product-folders"
 *
 * Example with your folder:
 *   npm run seed-images -- "/Users/Megahed/WrapItUp/wrap-it-up-5862_2026-02-05-01-48_oz20"
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const folderPath = process.env.SEED_IMAGES_FOLDER || process.argv[2];

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const BUCKET = 'product-images';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

if (!folderPath) {
  console.error('Usage: SEED_IMAGES_FOLDER="/path/to/folder" node scripts/seed-images-from-folder.js');
  console.error('   or: node scripts/seed-images-from-folder.js "/path/to/folder"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Folder name (e.g. "Breakfast-Box-for-One") → slug (e.g. "breakfast-box-for-one") */
function folderNameToSlug(folderName) {
  const nameWithSpaces = folderName.replace(/-/g, ' ');
  return generateSlug(nameWithSpaces);
}

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.has(ext);
}

async function ensureBucketExists() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Listing buckets: ${listError.message}`);
  }
  const exists = buckets.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ['image/*'],
    });
    if (error) throw new Error(`Creating bucket: ${error.message}`);
    console.log(`Created bucket "${BUCKET}"`);
  }
}

async function getSubfolders(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function getImageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && isImageFile(e.name))
    .map((e) => e.name)
    .sort();
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  return map[ext] || 'image/jpeg';
}

/** Sanitize filename for storage path (no spaces, safe chars) */
function safeStorageName(filename) {
  const base = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename).toLowerCase();
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return safe + ext;
}

async function uploadFile(localPath, storagePath, mimeType) {
  const buffer = await fs.readFile(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw new Error(`Upload ${storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  const resolvedPath = path.resolve(folderPath);
  try {
    await fs.access(resolvedPath);
  } catch {
    console.error(`Folder not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log('Seed images from folder → Supabase Storage + DB\n');
  console.log('Folder:', resolvedPath);
  console.log('');

  await ensureBucketExists();

  const subfolders = await getSubfolders(resolvedPath);
  if (subfolders.length === 0) {
    console.error('No subfolders found. Expected one folder per product (e.g. Birthday-Box, Breakfast-Box-for-One).');
    process.exit(1);
  }

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const folderName of subfolders) {
    const slug = folderNameToSlug(folderName);
    const productDir = path.join(resolvedPath, folderName);
    const imageFiles = await getImageFiles(productDir);

    if (imageFiles.length === 0) {
      console.log(`⊘ ${folderName} (${slug}) — no images, skip`);
      skipped++;
      continue;
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (productError || !product) {
      console.log(`✗ ${folderName} (${slug}) — product not found in DB, skip`);
      skipped++;
      continue;
    }

    const imageUrls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const localPath = path.join(productDir, filename);
      const safeName = safeStorageName(filename);
      const storagePath = `products/${slug}/${i}_${safeName}`;
      const mimeType = getMimeType(filename);

      try {
        const url = await uploadFile(localPath, storagePath, mimeType);
        imageUrls.push({ url, display_order: i });
      } catch (err) {
        console.error(`  Upload failed ${filename}:`, err.message);
        errors++;
      }
    }

    if (imageUrls.length === 0) {
      console.log(`✗ ${folderName} — no successful uploads`);
      continue;
    }

    const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', product.id);
    if (deleteError) {
      console.error(`  Delete old images failed:`, deleteError.message);
      errors++;
    }

    const rows = imageUrls.map(({ url, display_order }) => ({
      product_id: product.id,
      image_url: url,
      display_order,
    }));
    const { error: insertError } = await supabase.from('product_images').insert(rows);

    if (insertError) {
      console.error(`  Insert product_images failed:`, insertError.message);
      errors++;
    } else {
      console.log(`✓ ${product.title} (${slug}) — ${imageUrls.length} images`);
      uploaded += imageUrls.length;
    }
  }

  console.log('\nDone.');
  console.log(`  Uploaded/linked: ${uploaded} images`);
  if (skipped) console.log(`  Skipped (no product or no images): ${skipped} folders`);
  if (errors) console.log(`  Errors: ${errors}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
