# Seed product images from CSV (Shopify export)

This script imports product images from a **Shopify export CSV** into Supabase Storage and the database. Shopify CDN URLs are **not** stored; images are downloaded and re-uploaded to your Supabase bucket.

## Input

- **CSV file** (e.g. `products_export.csv`) with columns:
  - **Handle** → product slug (must match existing `products.slug` in DB)
  - **Image Src** → Shopify CDN image URL (e.g. `https://cdn.shopify.com/...`)
  - **Image Position** → display order (integer)

You can also use a CSV with columns `product_slug`, `image_url`, `display_order` for the same behavior.

## Process

For each row:

1. Find the product by `product_slug` (Handle).
2. **Download** the image from the URL (server-side).
3. **Validate** image type (only `image/jpeg`, `image/png`, `image/webp`, `image/gif`).
4. **Upload** to Supabase Storage: `product-images/products/{productSlug}/{display_order}.{ext}`.
5. **Replace** all `product_images` for that product with the new Supabase public URLs.

## Rules

- **Idempotent**: Safe to run multiple times. If a file already exists at the storage path, the script skips upload and uses the existing public URL.
- **No duplicate DB records**: For each product, existing `product_images` are deleted and re-inserted from the CSV (one source of truth per run).
- **No Shopify URLs in DB**: Only Supabase public URLs are stored in `product_images.image_url`.
- **Server-side only**: Uses `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env`; never expose this key to the client.

## How to run

1. **Prerequisites**
   - `backend/.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   - Bucket `product-images` exists and is public (`node scripts/setup-storage.js` if needed).
   - Products exist in the DB (run `node scripts/seed-products.js` first).
   - Install deps: `npm install` (adds `csv-parse`).

2. **Run**
   ```bash
   cd backend
   npm run seed-images-csv
   ```
   Or with a custom CSV path:
   ```bash
   npm run seed-images-csv -- "/path/to/products_export.csv"
   npm run seed-images-csv -- "../products_export 2.csv"
   ```
   **Skip products that already have images** (e.g. when importing a second CSV without overwriting):
   ```bash
   npm run seed-images-csv -- "/path/to/products_export 2.csv" --skip-if-has-images
   ```
   Default path when no argument is given: `products_export.csv` in the **repo root** (parent of `backend/`).

3. **Result**
   - Images appear in Supabase Storage under `product-images/products/{slug}/`.
   - `product_images` rows point to Supabase URLs.
   - Admin panel and mobile app will show these images.

## Note on `is_primary`

The current `product_images` table has no `is_primary` column. The first image (lowest `display_order`) is typically used as the primary/thumbnail; the script does not add a separate column unless you add a migration.
