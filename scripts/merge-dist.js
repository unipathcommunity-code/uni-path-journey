import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const rootDist = path.join(rootDir, 'dist');

// Unified ecosystem: ONE app (unipath-core) serves every vertical (consulting,
// tour=UniTour, academy=NOVA) from a single build, selected at runtime by the
// tenant's business_type. There are no separate /nova or /unitour builds.

// Ensure root dist is clean
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.mkdirSync(rootDist, { recursive: true });

// Copy unipath-core dist to root dist (the whole ecosystem)
console.log('Copying unipath-core dist...');
fs.cpSync(path.join(rootDir, 'apps/unipath-core/dist'), rootDist, { recursive: true });

console.log('Successfully assembled dist for Vercel (single unified app)!');
