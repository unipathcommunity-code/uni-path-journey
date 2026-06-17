const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const token = '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';
const repoUrl = 'https://github.com/unipathcommunity-code/uni-path-journey.git';
const tempCloneDir = 'C:/Users/user/.gemini/antigravity/scratch/temp-git-clone';
const targetDir = 'C:/Users/user/.gemini/antigravity/scratch/uni-path-journey-main';

async function main() {
  console.log('--- Setting up Git Repository ---');

  // Remove tempCloneDir if it exists
  if (fs.existsSync(tempCloneDir)) {
    console.log('Cleaning up existing temp clone dir...');
    fs.rmSync(tempCloneDir, { recursive: true, force: true });
  }

  console.log(`Cloning repository (shallow) to ${tempCloneDir}...`);
  await git.clone({
    fs,
    http,
    dir: tempCloneDir,
    url: repoUrl,
    singleBranch: true,
    depth: 1,
    onAuth: () => ({ username: token })
  });
  console.log('Clone successful!');

  const tempGitDir = path.join(tempCloneDir, '.git');
  const targetGitDir = path.join(targetDir, '.git');

  // Remove target .git if it exists (should not, but just in case)
  if (fs.existsSync(targetGitDir)) {
    console.log('Removing existing target .git...');
    fs.rmSync(targetGitDir, { recursive: true, force: true });
  }

  console.log(`Moving .git from ${tempGitDir} to ${targetGitDir}...`);
  fs.renameSync(tempGitDir, targetGitDir);
  console.log('Move successful!');

  console.log('Cleaning up temp clone directory...');
  fs.rmSync(tempCloneDir, { recursive: true, force: true });

  console.log('--- Git Setup Complete! ---');
}

main().catch(err => {
  console.error('Error during setup:', err);
  process.exit(1);
});
