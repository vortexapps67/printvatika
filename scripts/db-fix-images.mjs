// One-off catalogue data fix: the flyers and stickers rows point at the wrong
// photographs (flyers -> business-cards.jpg, stickers -> posters.jpg) because
// the shop had no picture for them when the rows were created. Both images now
// exist in imgs/, so point the rows at the right files.
//
// Reads SUPABASE_URL / SUPABASE_SECRET_KEY from .env.local — no keys in the repo.
// Usage: node scripts/db-fix-images.mjs [--write]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');

function env(name) {
  if (process.env[name]) return process.env[name];
  for (const file of ['.env.local', '.env']) {
    const p = path.join(root, file);
    if (!fs.existsSync(p)) continue;
    const line = fs
      .readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    if (line) return line.slice(name.length + 1).trim();
  }
  return '';
}

const url = env('SUPABASE_URL') || env('NEXT_PUBLIC_SUPABASE_URL');
const key = env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key || /YOUR_|placeholder/i.test(key)) {
  console.error('No usable Supabase credentials found in .env.local');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

const fixes = {
  flyers: 'imgs/flyers.jpg',
  stickers: 'imgs/stickers.svg',
};

for (const [slug, image] of Object.entries(fixes)) {
  const current = await fetch(
    `${url}/rest/v1/products?select=slug,image&slug=eq.${slug}`,
    { headers }
  ).then((r) => r.json());

  const existing = current?.[0]?.image;
  if (existing === image) {
    console.log(`${slug}: already ${image}`);
    continue;
  }
  if (!write) {
    console.log(`${slug}: would change ${existing} -> ${image}`);
    continue;
  }

  const res = await fetch(`${url}/rest/v1/products?slug=eq.${slug}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) {
    console.error(`${slug}: FAILED ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    continue;
  }
  const [row] = await res.json();
  console.log(`${slug}: ${existing} -> ${row.image}`);
}

if (!write) console.log('\nDry run. Re-run with --write to apply.');
