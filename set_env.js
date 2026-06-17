const { execSync } = require('child_process');

const envs = {
  VITE_SUPABASE_PROJECT_ID: "bpokyebvwhigpjrembcg",
  VITE_SUPABASE_URL: "https://bpokyebvwhigpjrembcg.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwb2t5ZWJ2d2hpZ3BqcmVtYmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1ODgwNjEsImV4cCI6MjA5MzE2NDA2MX0.1Bn_0WxXccpzutvIh2gPqdVagZhAC7xiekbZzwxpCvU"
};

for (const [key, value] of Object.entries(envs)) {
  console.log(`Setting ${key}...`);
  try {
    execSync(`npx vercel env add ${key} production --yes`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch(e) {
    console.error("Error setting", key);
  }
}
