/**
 * NGN Portal — Database Setup via Supabase REST API
 * 
 * Since direct PostgreSQL connection is not available,
 * this script uses Supabase's REST API + service role key.
 * 
 * Usage: node scripts/setup-db-rest.js
 */

const https = require('https');
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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || SUPABASE_URL.includes('your-supabase')) {
  console.error('❌  NEXT_PUBLIC_SUPABASE_URL not configured in .env.local');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY not configured in .env.local');
  process.exit(1);
}

// Fetch helper using built-in https
function fetchSupabase(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
        ...options.headers,
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve({ status: res.statusCode, data: parsed });
          }
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
  { id: 1, name: 'Politik', slug: 'politik', description: 'Berita politik nasional, hukum, kebijakan pemerintah, dan hubungan internasional.' },
  { id: 2, name: 'Bisnis', slug: 'bisnis', description: 'Informasi pasar keuangan, investasi, ekonomi makro, dan perkembangan bisnis tanah air.' },
  { id: 3, name: 'Teknologi', slug: 'teknologi', description: 'Perkembangan gadget terbaru, startup, kecerdasan buatan, sains, dan inovasi digital.' },
  { id: 4, name: 'Hiburan', slug: 'hiburan', description: 'Berita musik, film, gaya hidup, festival seni, dan kehidupan selebritas.' },
  { id: 5, name: 'Olahraga', slug: 'olahraga', description: 'Liputan kompetisi sepak bola, bulu tangkis, balapan, olahraga ekstrem, dan gaya hidup sehat.' },
];

const now = new Date();
const minus = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const articles = [
  { id: 1, title: 'Pembangunan IKN Nusantara Tahap 2 Resmi Dimulai, Fokus Pusat Olahraga dan Hunian', slug: 'pembangunan-ikn-nusantara-tahap-2-resmi-dimulai-fokus-pusat-olahraga-dan-hunian', excerpt: 'Pemerintah resmi memulai proyek pembangunan Ibu Kota Nusantara (IKN) tahap kedua dengan alokasi anggaran Rp25 Triliun yang berfokus pada infrastruktur publik dan hunian ASN.', content: '<p><strong>Nusantara, NGN Portal</strong> — Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR) secara resmi mengumumkan dimulainya pembangunan Ibu Kota Nusantara (IKN) Tahap 2.</p><p>Fase kedua ini akan sangat berfokus pada pembangunan kompleks olahraga terpadu (sports center), gedung-gedung perkantoran baru, serta hunian berkelanjutan untuk para Aparatur Sipil Negara (ASN) yang akan mulai dipindahkan secara masif akhir tahun ini.</p><p>Menteri PUPR menjelaskan bahwa pembangunan ini ditargetkan rampung pada awal tahun 2027 dengan melibatkan lebih dari 50 kontraktor lokal dan internasional yang berkomitmen menjaga lingkungan hidup sekitar IKN.</p>', image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200', category_id: 1, author: 'Andi Wijaya', published_at: now.toISOString(), view_count: 1250, is_featured: true, is_breaking: false, reading_time_minutes: 3 },
  { id: 2, title: 'Rupiah Menguat Tajam ke Rp15.200 per Dolar AS Pasca Penurunan Suku Bunga Fed', slug: 'rupiah-menguat-tajam-ke-rp15200-per-dolar-as-pasca-penurunan-suku-bunga-fed', excerpt: 'Mata uang Rupiah mencatat penguatan signifikan terhadap dolar AS menyusul keputusan The Fed menurunkan suku bunga sebesar 50 basis poin.', content: '<p><strong>Jakarta, NGN Portal</strong> — Nilai tukar rupiah terhadap dolar AS ditutup menguat tajam pada perdagangan sore ini di level Rp15.200 per dolar AS. Penguatan ini dipicu oleh sentimen positif pasar global setelah bank sentral Amerika Serikat, Federal Reserve (The Fed), menurunkan suku bunga acuan sebesar 50 basis poin.</p><p>Gubernur Bank Indonesia (BI) menyatakan bahwa penguatan rupiah ini juga didukung oleh kondisi fundamental ekonomi domestik yang sangat solid, tingkat inflasi yang terjaga, serta cadangan devisa yang melimpah.</p>', image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800', category_id: 2, author: 'Rina Susanti', published_at: minus(2), view_count: 840, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 3, title: 'Meluncur di Indonesia, Ponsel Lipat NGN Pro Hadirkan Teknologi Layar Gulung Pertama', slug: 'meluncur-di-indonesia-ponsel-lipat-ngn-pro-hadirkan-teknologi-layar-gulung-pertama', excerpt: 'NGN meluncurkan smartphone flagship NGN Pro dengan inovasi layar gulung (rollable display) tercanggih di kelasnya.', content: '<p><strong>Jakarta, NGN Portal</strong> — Industri teknologi tanah air kembali bergairah dengan peluncuran resmi ponsel flagship terbaru NGN Pro. Perangkat ini menjadi pelopor di Indonesia dengan mengintegrasikan teknologi layar gulung (rollable) dan lipat secara bersamaan.</p><p>Menggunakan panel OLED fleksibel generasi terbaru, NGN Pro mampu meregangkan layarnya dari ukuran 6,7 inci menjadi tablet ringkas berukuran 8,2 inci hanya dengan menekan satu tombol navigasi di bagian samping perangkat.</p>', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800', category_id: 3, author: 'Budi Pratama', published_at: minus(4), view_count: 2100, is_featured: false, is_breaking: true, reading_time_minutes: 3 },
  { id: 4, title: 'Konser Akbar Band Indonesia di Gelora Bung Karno Sedot 80 Ribu Penonton', slug: 'konser-akbar-band-indonesia-di-gelora-bung-karno-sedot-80-ribu-penonton', excerpt: 'Konser reuni spektakuler salah satu band legendaris Indonesia berhasil memukau puluhan ribu penggemar di Stadion GBK.', content: '<p><strong>Jakarta, NGN Portal</strong> — Stadion Utama Gelora Bung Karno (GBK) bergemuruh hebat pada Sabtu malam lalu. Konser reuni band legendaris tanah air berhasil menarik perhatian lebih dari 80.000 penonton dari seluruh penjuru Indonesia.</p><p>Dengan tata panggung megah berukuran raksasa dan permainan visual lampu laser yang dramatis, band ini membawakan total 25 lagu hits terbaik mereka selama hampir 3 jam tanpa henti.</p>', image_url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800', category_id: 4, author: 'Siti Aminah', published_at: minus(12), view_count: 980, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 5, title: 'Timnas Sepak Bola Indonesia Lolos ke Semifinal Piala Asia 2026, Sejarah Baru!', slug: 'timnas-sepak-bola-indonesia-lolos-ke-semifinal-piala-asia-2026-sejarah-baru', excerpt: 'Perjuangan luar biasa skuad Garuda membuahkan hasil dengan lolos pertama kalinya ke semifinal Piala Asia setelah mengalahkan lawan kuat.', content: '<p><strong>Doha, NGN Portal</strong> — Skuad Garuda sukses mengukir tinta emas dalam sejarah sepak bola tanah air. Tim Nasional Indonesia berhasil lolos ke babak semifinal Piala Asia 2026 setelah menaklukkan salah satu raksasa sepak bola Asia melalui adu penalti yang dramatis.</p>', image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800', category_id: 5, author: 'Feri Irawan', published_at: minus(24), view_count: 3450, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 6, title: 'Kementerian BUMN Resmikan Program Inkubator Startup Teknologi Hijau', slug: 'kementerian-bumn-resmikan-program-inkubator-startup-teknologi-hijau', excerpt: 'Program inkubator ini ditujukan untuk mendukung startup lokal yang berfokus pada solusi ramah lingkungan dan energi terbarukan.', content: '<p><strong>Jakarta, NGN Portal</strong> — Kementerian BUMN meresmikan program inkubator baru khusus untuk startup di bidang teknologi hijau (green tech). Program ini dirancang guna mendukung target Indonesia mencapai emisi nol bersih pada tahun 2060.</p>', image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800', category_id: 2, author: 'Rina Susanti', published_at: minus(36), view_count: 450, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 7, title: 'Apple Vision Pro 2 Resmi Diumumkan dengan Sensor Baru, Lebih Ringan', slug: 'apple-vision-pro-2-resmi-diumumkan-dengan-sensor-baru-lebih-ringan', excerpt: 'Apple resmi meluncurkan headset spasial generasi kedua mereka dengan peningkatan kenyamanan dan harga yang lebih terjangkau.', content: '<p><strong>California, NGN Portal</strong> — Apple secara mengejutkan merilis lini produk terbaru mereka, Vision Pro 2. Mengatasi keluhan utama generasi pertama, headset ini 20% lebih ringan berkat material komposit terbaru.</p>', image_url: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=800', category_id: 3, author: 'Budi Pratama', published_at: minus(48), view_count: 1890, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 8, title: 'Film Drama Keluarga Karya Sutradara Lokal Tembus Festival Film Cannes', slug: 'film-drama-keluarga-karya-sutradara-lokal-tembus-festival-film-cannes', excerpt: 'Prestasi membanggakan kembali diraih dunia perfilman Indonesia, satu film drama keluarga masuk kompetisi utama Cannes.', content: '<p><strong>Cannes, NGN Portal</strong> — Karya sinema anak bangsa kembali mendapat pengakuan internasional di panggung bergengsi Festival Film Cannes. Film drama keluarga yang mengangkat isu sosial di pedalaman Indonesia terpilih masuk dalam kategori utama.</p>', image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800', category_id: 4, author: 'Siti Aminah', published_at: minus(72), view_count: 560, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 9, title: 'Juara Dunia Bulu Tangkis Indonesia Pertahankan Gelar di All England 2026', slug: 'juara-dunia-bulu-tangkis-indonesia-pertahankan-gelar-di-all-england-2026', excerpt: 'Ganda putra andalan Indonesia kembali naik podium tertinggi setelah menaklukkan pasangan unggulan asal Tiongkok.', content: '<p><strong>Birmingham, NGN Portal</strong> — Tradisi emas bulu tangkis Indonesia di turnamen All England terus berlanjut. Ganda putra andalan Indonesia sukses mempertahankan gelar juara mereka setelah memenangkan laga final yang menegangkan.</p>', image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800', category_id: 5, author: 'Feri Irawan', published_at: minus(96), view_count: 1120, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
  { id: 10, title: 'Rapat Paripurna DPR RI Sahkan Undang-Undang Perlindungan Data Pribadi Baru', slug: 'rapat-paripurna-dpr-ri-sahkan-undang-undang-perlindungan-data-pribadi-baru', excerpt: 'DPR RI resmi mengetok palu pengesahan regulasi baru perlindungan data pribadi demi menekan angka kebocoran data di ruang digital.', content: '<p><strong>Jakarta, NGN Portal</strong> — Dewan Perwakilan Rakyat (DPR) RI secara resmi menyetujui pengesahan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang baru. Regulasi ini memuat sanksi denda yang jauh lebih berat bagi korporasi yang terbukti lalai mengamankan data pengguna.</p>', image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800', category_id: 1, author: 'Andi Wijaya', published_at: minus(120), view_count: 1050, is_featured: false, is_breaking: false, reading_time_minutes: 2 },
];

const breakingNews = [
  { id: 1, text: 'BREAKING: Skuad Garuda cetak sejarah lolos ke semifinal Piala Asia 2026 setelah drama adu penalti!', is_active: true, article_id: 5 },
  { id: 2, text: 'INFO: Nilai tukar rupiah melesat tajam hari ini, sentuh Rp15.200 per dolar AS.', is_active: true, article_id: 2 },
  { id: 3, text: 'NEW: Smartphone layar gulung premium NGN Pro resmi dirilis di Indonesia!', is_active: true, article_id: 3 },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function insertRows(table, rows, label) {
  console.log(`  ⏳ Inserting ${rows.length} ${label}...`);
  try {
    const result = await fetchSupabase(`/rest/v1/${table}`, {
      method: 'POST',
      headers: { 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
      body: JSON.stringify(rows),
    });
    console.log(`  ✅ ${label} inserted (status ${result.status})`);
    return true;
  } catch (err) {
    if (err.message.includes('42P01') || err.message.includes('does not exist')) {
      return false; // Table doesn't exist yet
    }
    console.error(`  ❌ Error inserting ${label}:`, err.message);
    return false;
  }
}

async function checkTable(table) {
  try {
    const result = await fetchSupabase(`/rest/v1/${table}?select=count&limit=1`, {
      headers: { 'Prefer': 'count=exact' },
    });
    return result.status < 400;
  } catch {
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🚀  NGN Portal — Database Setup (REST API Mode)');
  console.log('═══════════════════════════════════════════════');
  console.log(`📡  Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // ── Step 1: Check if tables exist ───────────────────────────────────────
  console.log('🔍  STEP 1: Checking database status...');
  const tablesExist = await checkTable('categories');

  if (!tablesExist) {
    console.log('');
    console.log('⚠️   Tables do NOT exist yet in Supabase!');
    console.log('');
    console.log('📋  Please run the SQL migration manually in Supabase:');
    console.log('');
    console.log('    1. Go to: https://supabase.com/dashboard');
    console.log('    2. Open your project → SQL Editor');
    console.log('    3. Paste the contents of: supabase/migrations/001_initial.sql');
    console.log('    4. Click "Run" ▶');
    console.log('    5. Then run this script again: node scripts/setup-db-rest.js');
    console.log('');
    console.log('💡  The migration file is at:');
    console.log(`    ${path.join(__dirname, '..', 'supabase', 'migrations', '001_initial.sql')}`);
    console.log('');
    process.exit(0);
  }

  console.log('  ✅ Tables found in Supabase!\n');

  // ── Step 2: Seed Data ─────────────────────────────────────────────────
  console.log('🌱  STEP 2: Seeding data...');
  console.log('────────────────────────────');

  const catOk = await insertRows('categories', categories, 'categories');
  if (!catOk) {
    console.log('  ❌ Could not seed categories. Check if migration was run.');
    process.exit(1);
  }

  const artOk = await insertRows('articles', articles, 'articles');
  if (!artOk) {
    console.log('  ❌ Could not seed articles.');
    process.exit(1);
  }

  const bnOk = await insertRows('breaking_news', breakingNews, 'breaking_news');
  if (!bnOk) {
    console.log('  ❌ Could not seed breaking_news.');
    process.exit(1);
  }

  // ── Step 3: Verify ───────────────────────────────────────────────────
  console.log('');
  console.log('🔍  STEP 3: Verifying data...');
  console.log('──────────────────────────────');

  try {
    const catRes = await fetchSupabase('/rest/v1/categories?select=*');
    const artRes = await fetchSupabase('/rest/v1/articles?select=id');
    const bnRes = await fetchSupabase('/rest/v1/breaking_news?select=id');

    const catCount = Array.isArray(catRes.data) ? catRes.data.length : 0;
    const artCount = Array.isArray(artRes.data) ? artRes.data.length : 0;
    const bnCount = Array.isArray(bnRes.data) ? bnRes.data.length : 0;

    console.log(`  📂 Categories:    ${catCount} rows`);
    console.log(`  📰 Articles:      ${artCount} rows`);
    console.log(`  🔴 Breaking News: ${bnCount} rows`);

    console.log('');
    console.log('════════════════════════════════════════════════');
    console.log('🎉  Database setup COMPLETE!');
    console.log('════════════════════════════════════════════════');
    console.log('');
    console.log('✨  Your NGN Portal database is ready!');
    console.log('   Refresh your browser → data will load from Supabase.');
    console.log('');
  } catch (err) {
    console.error('❌  Verification failed:', err.message);
  }
}

main();
