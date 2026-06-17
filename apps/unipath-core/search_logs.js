import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tasksDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\c9917f49-7874-4431-a8e0-c1e6233df4b5\\.system_generated\\tasks';

if (!fs.existsSync(tasksDir)) {
  console.log('Tasks directory does not exist!');
  process.exit(0);
}

const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.log'));
console.log(`Searching ${files.length} log files...`);

files.forEach(file => {
  const filePath = path.join(tasksDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('schema') || content.includes('roles') || content.includes('websites')) {
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('schema') || line.includes('roles') || line.includes('websites') || line.includes('error') || line.includes('Error')) {
        console.log(`[${file}] Line ${i + 1}: ${line.trim()}`);
      }
    });
  }
});
