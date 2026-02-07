/**
 * Seed product images from a Shopify export CSV (or Excel-derived CSV).
 *
 * Reads rows with: product_slug (Handle), image_url (Image Src), display_order (Image Position).
 * For each row:
 *   1. Find product by slug
 *   2. Download image from URL (server-side)
 *   3. Validate image type (jpeg, png, webp, gif only)
 *   4. Upload to Supabase Storage: product-images/{productSlug}/{display_order}.{ext}
 *   5. Insert/update product_images with Supabase public URL (no Shopify URLs stored)
 *
 * Idempotent: skips upload if file already exists in Storage; replaces DB records per product.
 * Uses SUPABASE_SERVICE_ROLE_KEY only (server-side).
 *
 * Usage (from backend/):
 *   npm run seed-images-csv
 *   npm run seed-images-csv -- "../products_export 2.csv"
 *   npm run seed-images-csv -- "/path/to/file.csv" --skip-if-has-images   # skip products that already have images
 *   node scripts/seed-images-from-csv.js /path/to/file.csv --skip-if-has-images
 *
 * Default CSV path: products_export.csv in repo root (WrapItUp/products_export.csv).
 * CSV columns (Shopify export): Handle → product_slug, Image Src → image_url, Image Position → display_order.
 *
 * Prerequisites:
 *   - .env in backend/ with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Products already exist (run seed-products.js first)
 *   - Bucket "product-images" exists and is public (run scripts/setup-storage.js if needed)
 */

const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const argv = process.argv.slice(2).filter(Boolean);
const skipIfHasImages = argv.includes('--skip-if-has-images');
const csvPath = argv.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', '..', 'products_export.csv');

const BUCKET = 'product-images';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_BY_MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function log(msg, level = 'info') {
  const prefix = level === 'error' ? '✗' : level === 'warn' ? '⚠' : '✓';
  console.log(`${prefix} ${msg}`);
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
    log('Created bucket "product-images"');
  }
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
  return rows;
}

function normalizeRows(rows) {
  const bySlug = new Map();
  for (const row of rows) {
    const slug = (row['Handle'] || row['product_slug'] || '').trim().toLowerCase();
    const src = (row['Image Src'] || row['image_url'] || '').trim();
    const pos = parseInt(row['Image Position'] || row['display_order'] || '0', 10) || 0;
    if (!slug || !src || !src.startsWith('http')) continue;
    const key = `${slug}\t${pos}`;
    if (!bySlug.has(key)) bySlug.set(key, { product_slug: slug, image_url: src, display_order: pos });
  }
  return Array.from(bySlug.values()).sort((a, b) => {
    if (a.product_slug !== b.product_slug) return a.product_slug.localeCompare(b.product_slug);
    return a.display_order - b.display_order;
  });
}

async function downloadImage(url) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'WrapItUp-Seed/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) throw new Error(`Invalid type: ${contentType}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = EXT_BY_MIME[contentType] || '.jpg';
  return { buffer, contentType, ext };
}

async function storageExists(storagePath) {
  const parts = storagePath.split('/').filter(Boolean);
  if (parts.length < 2) return false;
  const fileName = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join('/');
  const { data, error } = await supabase.storage.from(BUCKET).list(folder);
  if (error) return false;
  return (data || []).some((f) => f.name === fileName);
}

async function uploadOrGetUrl(productSlug, displayOrder, sourceUrl) {
  const storageDir = `products/${productSlug}`;
  let ext = '.jpg';
  let buffer;
  let contentType;

  for (const e of ['.jpg', '.png', '.webp', '.gif']) {
    const p = `${storageDir}/${displayOrder}${e}`;
    const exists = await storageExists(p);
    if (exists) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(p);
      return data.publicUrl;
    }
  }

  const downloaded = await downloadImage(sourceUrl);
  buffer = downloaded.buffer;
  contentType = downloaded.contentType;
  ext = downloaded.ext;

  const storagePath = `${storageDir}/${displayOrder}${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log('Seed product images from CSV → Supabase Storage + DB\n');
  console.log('CSV:', resolvedPath);
  console.log('');

  await ensureBucket();

  const rows = parseCsv(resolvedPath);
  const normalized = normalizeRows(rows);
  if (normalized.length === 0) {
    console.error('No valid rows (need Handle, Image Src, Image Position).');
    process.exit(1);
  }

  const byProduct = new Map();
  for (const r of normalized) {
    const slug = r.product_slug;
    if (!byProduct.has(slug)) byProduct.set(slug, []);
    byProduct.get(slug).push({ image_url: r.image_url, display_order: r.display_order });
  }

  log(`Found ${byProduct.size} products, ${normalized.length} image rows.`);
  if (skipIfHasImages) log('Mode: skip products that already have images (--skip-if-has-images).');
  console.log('');

  let uploaded = 0;
  let skipped = 0;
  let skippedHasImages = 0;
  let errors = 0;

  for (const [productSlug, images] of byProduct) {
    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('id, title')
      .eq('slug', productSlug)
      .single();

    if (productErr || !product) {
      log(`${productSlug}: product not in DB, skip`, 'warn');
      skipped++;
      continue;
    }

    if (skipIfHasImages) {
      const { data: existingImages, error: countErr } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', product.id)
        .limit(1);
      if (!countErr && existingImages && existingImages.length > 0) {
        log(`${product.title} (${productSlug}): already has images, skip`);
        skippedHasImages++;
        continue;
      }
    }

    const imageRecords = [];
    for (const img of images) {
      try {
        const supabaseUrl = await uploadOrGetUrl(productSlug, img.display_order, img.image_url);
        imageRecords.push({ image_url: supabaseUrl, display_order: img.display_order });
        uploaded++;
      } catch (err) {
        log(`${productSlug} pos ${img.display_order}: ${err.message}`, 'error');
        errors++;
      }
    }

    if (imageRecords.length === 0) continue;

    const { error: delErr } = await supabase.from('product_images').delete().eq('product_id', product.id);
    if (delErr) {
      log(`${productSlug}: delete old images failed: ${delErr.message}`, 'error');
      errors++;
      continue;
    }

    const rowsToInsert = imageRecords.map((r) => ({
      product_id: product.id,
      image_url: r.image_url,
      display_order: r.display_order,
    }));
    const { error: insertErr } = await supabase.from('product_images').insert(rowsToInsert);
    if (insertErr) {
      log(`${productSlug}: insert failed: ${insertErr.message}`, 'error');
      errors++;
    } else {
      log(`${product.title} (${productSlug}): ${imageRecords.length} images`);
    }
  }

  console.log('');
  log(`Done. Uploaded/new: ${uploaded} images, products updated.`);
  if (skipped) log(`Skipped (product not in DB): ${skipped} products.`, 'warn');
  if (skippedHasImages) log(`Skipped (already have images): ${skippedHasImages} products.`);
  if (errors) log(`Errors: ${errors}.`, 'error');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
