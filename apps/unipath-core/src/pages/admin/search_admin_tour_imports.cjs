const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, 'AdminTour.tsx');

try {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log("First 80 lines of AdminTour.tsx:");
  lines.slice(0, 80).forEach((line, i) => {
    console.log(`${i+1}: ${line}`);
  });
} catch (e) {
  console.error("Error reading file:", e.message);
}
