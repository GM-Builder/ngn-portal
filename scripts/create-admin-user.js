const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf-8');
const env = {};
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
      env[key] = val;
    }
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('❌ Supabase credentials missing in .env.local');
  process.exit(1);
}

// User credentials to create
const adminEmail = 'admin@ngn.com';
const adminPassword = 'PasswordAdmin123';

function createAdmin() {
  return new Promise((resolve, reject) => {
    const reqUrl = new URL('/auth/v1/admin/users', url);
    const bodyData = JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    console.log(`🚀 Creating admin user: ${adminEmail}...`);

    const req = https.request(reqUrl, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(bodyData);
    req.end();
  });
}

async function main() {
  try {
    const user = await createAdmin();
    console.log('\n════════════════════════════════════════');
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('════════════════════════════════════════');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('════════════════════════════════════════');
    console.log('\nGo to http://localhost:3001/admin/login to sign in!');
  } catch (err) {
    if (err.message.includes('400') && err.message.includes('already registered')) {
      console.log('\n⚠️  Admin user is already registered!');
      console.log(`📧 Email:    ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log('\nYou can use these credentials to log in.');
    } else {
      console.error('\n❌ Failed to create admin user:', err.message);
    }
  }
}

main();
