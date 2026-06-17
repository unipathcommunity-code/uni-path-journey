const fs = require('fs');
const path = require('path');

const mainPath = 'C:/uni-path-journey-main/apps/unipath-core/src/App.tsx';
const scratchPath = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main/apps/unipath-core/src/App.tsx';

const mainContent = fs.readFileSync(mainPath, 'utf8');
const scratchContent = fs.readFileSync(scratchPath, 'utf8');

const mainLines = mainContent.split('\n');
const scratchLines = scratchContent.split('\n');

console.log('Main line count:', mainLines.length);
console.log('Scratch line count:', scratchLines.length);

let i = 0, j = 0;
while (i < mainLines.length || j < scratchLines.length) {
  if (mainLines[i] !== scratchLines[j]) {
    console.log(`\nLine ${i+1}:`);
    console.log(`- M: ${mainLines[i] || '<EOF>'}`);
    console.log(`+ S: ${scratchLines[j] || '<EOF>'}`);
    
    let foundSync = false;
    for (let offset = 1; offset < 10; offset++) {
      if (mainLines[i + offset] === scratchLines[j + offset]) {
        i += offset;
        j += offset;
        foundSync = true;
        break;
      }
    }
    if (!foundSync) {
      i++;
      j++;
    }
  } else {
    i++;
    j++;
  }
}
