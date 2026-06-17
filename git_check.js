const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

async function checkStatus(dirName, dirPath) {
  console.log(`\n=== Checking Git Status for ${dirName} (${dirPath}) ===`);
  try {
    const statusMatrix = await git.statusMatrix({
      fs,
      dir: dirPath,
      ignored: true
    });
    
    // statusMatrix returns an array of [filepath, head, workdir, stage]
    const modified = [];
    const added = [];
    const deleted = [];
    
    for (const [filepath, head, workdir, stage] of statusMatrix) {
      if (head === 1 && workdir === 2) {
        modified.push(filepath);
      } else if (head === 0 && workdir === 2) {
        added.push(filepath);
      } else if (head === 1 && workdir === 0) {
        deleted.push(filepath);
      }
    }
    
    console.log('Modified files:', modified);
    console.log('Added files:', added);
    console.log('Deleted files:', deleted);
  } catch (err) {
    console.error(`Error checking status for ${dirName}:`, err.message);
  }
}

async function main() {
  await checkStatus('Main Workspace', 'C:/uni-path-journey-main');
  await checkStatus('Scratch Workspace', 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main');
}

main();
