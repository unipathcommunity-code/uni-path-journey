import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const rootDist = path.join(rootDir, 'dist');

// Ensure root dist is clean
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.mkdirSync(rootDist, { recursive: true });

// 1. Copy unipath-core dist to root dist (this is the main app)
console.log('Copying unipath-core dist...');
fs.cpSync(path.join(rootDir, 'apps/unipath-core/dist'), rootDist, { recursive: true });

// 2. Copy nova dist to root dist under /nova
console.log('Copying nova dist...');
const novaDist = path.join(rootDist, 'nova');
fs.cpSync(path.join(rootDir, 'apps/nova/dist'), novaDist, { recursive: true });

// 3. Copy unitour dist to root dist under /unitour
console.log('Copying unitour dist...');
const unitourDist = path.join(rootDist, 'unitour');
fs.cpSync(path.join(rootDir, 'apps/unitour/dist'), unitourDist, { recursive: true });

console.log('Successfully merged all dist folders for Vercel!');
