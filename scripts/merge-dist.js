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

// Copy unipath-core dist to root dist — the single consulting app. Output
// contract (root dist/) is unchanged so the Vercel build/output settings stay
// the same.
console.log('Copying unipath-core dist...');
fs.cpSync(path.join(rootDir, 'apps/unipath-core/dist'), rootDist, { recursive: true });

console.log('Successfully prepared root dist for Vercel!');
