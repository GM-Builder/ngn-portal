/**
 * NGN Portal — Database Setup Script
 * 
 * Connects directly to Supabase PostgreSQL and runs:
 * 1. Migration (creates tables, RLS policies)
 * 2. Seed data (categories, articles, breaking news)
 * 
 * Usage: node scripts/setup-db.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌  .env.local not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        // Strip surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

loadEnv();

// Extract project ref from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const dbPassword = (process.env.DATABASE_PASSWORD || '').trim().replace(/["\n\r]/g, '');

if (!projectRef || projectRef === '') {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL not set or invalid in .env.local');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌  DATABASE_PASSWORD not set in .env.local');
  process.exit(1);
}

const connectionConfig = {
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
};

console.log('');
console.log('🚀  NGN Portal — Database Setup');
console.log('================================');
console.log(`📡  Connecting to: ${connectionConfig.host}`);
console.log('');

async function runSQL(client, label, sql) {
  console.log(`⏳  Running: ${label}...`);
  try {
    // Split by semicolons but keep multi-statement blocks intact
    // We run the whole file at once via multiple statements
    await client.query(sql);
    console.log(`✅  Done: ${label}`);
  } catch (err) {
    // Some errors are OK (e.g. policy already exists)
    if (
      err.message.includes('already exists') ||
      err.message.includes('duplicate key') ||
      err.message.includes('DO NOTHING')
    ) {
      console.log(`⚠️   ${label}: ${err.message.split('\n')[0]} (skipping)`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new Client(connectionConfig);

  try {
    await client.connect();
    console.log('✅  Connected to Supabase PostgreSQL!\n');

    // ─── Step 1: Run Migration ────────────────────────────────────────────
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split into individual statements for better error handling
    const migrationStatements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋  STEP 1: Creating tables & RLS policies...');
    console.log('─────────────────────────────────────────────');
    
    for (const stmt of migrationStatements) {
      const label = stmt.split('\n')[0].replace('-- ', '').substring(0, 60) || stmt.substring(0, 60);
      try {
        await client.query(stmt + ';');
        const action = stmt.toUpperCase().startsWith('CREATE TABLE') ? '📦 Table created' :
                       stmt.toUpperCase().startsWith('CREATE POLICY') ? '🔒 Policy created' :
                       stmt.toUpperCase().startsWith('ALTER TABLE') ? '🔐 RLS enabled' :
                       stmt.toUpperCase().startsWith('CREATE EXTENSION') ? '🔌 Extension enabled' :
                       '✅ Executed';
        console.log(`  ${action}: ${label.trim().substring(0, 70)}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⚠️  Already exists (skip): ${label.trim().substring(0, 60)}`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('\n✅  Migration complete!\n');

    // ─── Step 2: Run Seed Data ───────────────────────────────────────────
    console.log('🌱  STEP 2: Seeding data...');
    console.log('───────────────────────────');
    
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    // Split seed by semicolons
    const seedStatements = seedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of seedStatements) {
      try {
        await client.query(stmt + ';');
        const action = stmt.toUpperCase().startsWith('INSERT INTO CATEGORIES') ? '📂 Categories seeded' :
                       stmt.toUpperCase().startsWith('INSERT INTO ARTICLES') ? '📰 Articles seeded' :
                       stmt.toUpperCase().startsWith('INSERT INTO BREAKING_NEWS') ? '🔴 Breaking news seeded' :
                       stmt.toUpperCase().startsWith('SELECT SETVAL') ? '🔢 Sequence reset' :
                       '✅ Executed';
        console.log(`  ${action}`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
          console.log(`  ⚠️  Data already exists (skip): ${stmt.substring(0, 50)}...`);
        } else {
          throw err;
        }
      }
    }

    console.log('\n✅  Seed data complete!\n');

    // ─── Step 3: Verify ──────────────────────────────────────────────────
    console.log('🔍  STEP 3: Verifying...');
    console.log('─────────────────────────');

    const { rows: categories } = await client.query('SELECT COUNT(*) as count FROM categories;');
    const { rows: articles } = await client.query('SELECT COUNT(*) as count FROM articles;');
    const { rows: breaking } = await client.query('SELECT COUNT(*) as count FROM breaking_news;');

    console.log(`  📂 Categories:    ${categories[0].count} rows`);
    console.log(`  📰 Articles:      ${articles[0].count} rows`);
    console.log(`  🔴 Breaking News: ${breaking[0].count} rows`);

    console.log('\n════════════════════════════════════════');
    console.log('🎉  Database setup COMPLETE!');
    console.log('════════════════════════════════════════');
    console.log('');
    console.log('✨  Your NGN Portal database is ready.');
    console.log('   Open your browser at http://localhost:3001');
    console.log('');

  } catch (err) {
    console.error('\n❌  Error during setup:');
    console.error('   ', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    console.error('');
    console.error('💡  Tips:');
    console.error('   • Make sure DATABASE_PASSWORD in .env.local is correct');
    console.error('   • Check your Supabase project is active (not paused)');
    console.error('   • Try restarting the Supabase project from dashboard');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
