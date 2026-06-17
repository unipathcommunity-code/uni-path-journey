const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

// GitHub Credentials from environment variable
const token = process.env.GITHUB_TOKEN;
const repoUrl = 'https://github.com/unipathcommunity-code/uni-path-journey.git';

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable is required.');
  process.exit(1);
}

async function main() {
  console.log('--- Commencing GitHub Push via isomorphic-git ---');
  
  const rootDir = path.resolve(__dirname, '..');
  console.log('Root directory:', rootDir);

  // 1. Initialize repository (or ensure it is initialized)
  console.log('Ensuring git repository is initialized...');
  await git.init({ fs, dir: rootDir });

  // 2. Add remote origin (if not present)
  console.log('Configuring remote origin...');
  try {
    await git.addRemote({ fs, dir: rootDir, remote: 'origin', url: repoUrl });
  } catch (err) {
    console.log('Remote origin already exists or configured, continuing...');
  }

  // 3. Scan files recursively (skipping ignored folders)
  console.log('Scanning files...');
  const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.vercel', '.agents', '.npm', 'scratch', '.gemini', 'temp-git-clone']);
  const ignoredFiles = new Set(['.env.development.local', '.env.production.local', '.env.local']);

  function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
      
      if (stat.isDirectory()) {
        if (!ignoredDirs.has(file)) {
          walk(filePath, fileList);
        }
      } else {
        if (!ignoredFiles.has(file)) {
          fileList.push(relativePath);
        }
      }
    }
    return fileList;
  }

  const filesToStage = walk(rootDir);
  console.log(`Found ${filesToStage.length} files to stage.`);

  // 4. Stage files
  console.log('Staging files...');
  let count = 0;
  for (const filepath of filesToStage) {
    // Add file to git index
    await git.add({ fs, dir: rootDir, filepath });
    count++;
    if (count % 200 === 0) {
      console.log(`Staged ${count}/${filesToStage.length} files...`);
    }
  }
  console.log('All files staged successfully.');

  // 5. Commit
  console.log('Committing changes...');
  try {
    const sha = await git.commit({
      fs,
      dir: rootDir,
      author: {
        name: 'Antigravity AI',
        email: 'antigravity@gemini.ai',
      },
      message: 'Remove hardcoded tokens and clean up scripts',
    });
    console.log(`Committed successfully. Commit SHA: ${sha}`);
  } catch (err) {
    if (err.code === 'NothingToCommitError') {
      console.log('Nothing to commit, repository is clean. Proceeding to push anyway.');
    } else {
      throw err;
    }
  }

  // 6. Push to GitHub
  console.log('Pushing to GitHub (main)...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: rootDir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({ username: token }),
    });
    console.log('Push result:', pushResult);
    console.log('--- SUCCESS: Pushed to main branch ---');
  } catch (err) {
    console.log('Pushing to main failed, trying master branch...', err.message);
    const pushResultMaster = await git.push({
      fs,
      http,
      dir: rootDir,
      remote: 'origin',
      ref: 'master',
      force: true,
      onAuth: () => ({ username: token }),
    });
    console.log('Push result (master):', pushResultMaster);
    console.log('--- SUCCESS: Pushed to master branch ---');
  }
}

main().catch(err => {
  console.error('Fatal error during Git operation:', err);
  process.exit(1);
});
