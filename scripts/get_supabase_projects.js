const https = require('https');

const token = 'sbp_4cf0597356fa71790abb8c7cbd56d3de422b176b';

function get(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Fetching projects...");
  const projects = await get('https://api.supabase.com/v1/projects');
  console.log("Projects:", JSON.stringify(projects, null, 2));

  if (Array.isArray(projects)) {
    for (const proj of projects) {
      console.log(`\nFetching API keys for project: ${proj.name} (${proj.id})...`);
      const keys = await get(`https://api.supabase.com/v1/projects/${proj.id}/api-keys`);
      console.log("Keys:", JSON.stringify(keys, null, 2));
    }
  }
}

main().catch(console.error);
