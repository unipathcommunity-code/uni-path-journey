const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, 'AdminTour.tsx');

try {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let found = false;
  lines.forEach((line, i) => {
    if (line.toLowerCase().includes('commission') || line.toLowerCase().includes('markup') || line.toLowerCase().includes('gds') || line.toLowerCase().includes('config')) {
      console.log(`Line ${i+1}: ${line.trim()}`);
      found = true;
    }
  });
  if (!found) {
    console.log("No matches found in AdminTour.tsx");
  }
} catch (e) {
  console.error("Error reading file:", e.message);
}
