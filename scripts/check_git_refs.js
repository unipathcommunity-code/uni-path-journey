const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');

const rootDir = 'c:/uni-path-journey-main';

async function main() {
  const remotes = await git.listRemotes({ fs, dir: rootDir });
  console.log('Remotes:', remotes);

  const branches = await git.listBranches({ fs, dir: rootDir });
  console.log('Local branches:', branches);

  const remoteBranches = await git.listBranches({ fs, dir: rootDir, remote: 'origin' });
  console.log('Remote branches (origin):', remoteBranches);
}

main().catch(console.error);
