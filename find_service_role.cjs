const fs = require('fs');
const path = require('path');

const envFiles = [
  '.env',
  '.env.development.local',
  '.env.production.local',
  '.env.production.pulled',
  '.env.pulled.production',
  '.env.vercel',
  '.env.vercel.pulled',
  '.env.pulled'
];

const rootDir = 'c:/uni-path-journey-main';

for (const file of envFiles) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    if (line.includes('SERVICE_ROLE') || line.includes('SERVICE_KEY') || line.includes('SUPABASE_SERVICE_ROLE_KEY') || line.includes('SUPABASE_BYPASS_RLS_KEY')) {
      console.log(`Found in ${file}: ${line.trim().substring(0, 40)}...`);
    }
  });
}
