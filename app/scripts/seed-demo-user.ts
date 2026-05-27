/**
 * Seed the demo user + profile into Upstash Redis.
 *
 * Run once after provisioning the Redis integration:
 *   npx tsx scripts/seed-demo-user.ts
 *
 * Env vars (from .env.local or after vercel env pull):
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *   OR KV_REST_API_URL / KV_REST_API_TOKEN (Vercel + Upstash integration)
 */

import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from .env, .env.local, or .env.development.local (root or frontend dir)
const cwd = process.cwd();
const root = resolve(cwd, '..');
[
  resolve(cwd, '.env'),
  resolve(cwd, '.env.local'),
  resolve(cwd, '.env.development.local'),
  resolve(root, '.env'),
  resolve(root, '.env.local'),
].forEach((p) => config({ path: p }));

async function main() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.error(
      'Missing Redis env vars. Set UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or run: vercel env pull .env.development.local',
    );
    process.exit(1);
  }

  const kv = new Redis({ url, token });

  const email = 'admin@example.com';
  const hashedPassword = await bcrypt.hash('demo', 12);

  // Store user record
  await kv.hset(`user:${email}`, {
    id: 'user-demo',
    email,
    name: 'Demo User',
    password: hashedPassword,
  });

  // Store organization profile
  await kv.hset(`profile:${email}`, {
    full_name: '',
    organization_name: 'Example Organization',
    organization_type: 'Education',
    focus_areas: JSON.stringify(['Education', 'Community Development', 'Technology']),
    keywords: JSON.stringify(['grants', 'education', 'community', 'technology']),
    location_state: 'United States',
    location_county: '',
    grant_amount_min: '',
    grant_amount_max: '',
  });

  // Add to the all-users set (used by cron deadline checker)
  await kv.sadd('all-users', email);

  console.log(`✓ Seeded user: ${email}`);
  console.log('✓ Seeded profile: Example Organization');
  console.log('✓ Added to all-users set');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
