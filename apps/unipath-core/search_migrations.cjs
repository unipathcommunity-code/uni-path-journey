const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\user\\.gemini\\antigravity\\scratch\\uni-path-journey-main\\supabase\\migrations';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.sql')) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('profiles') && (content.includes('trigger') || content.includes('auth.users'))) {
      console.log(`Found in migration: ${file}`);
      // Find section with the trigger function
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('raw_user_meta_data') || line.includes('tenant_id') || line.includes('role')) {
          if (index > 0) console.log(`  Line ${index}: ${lines[index-1].trim()}`);
          console.log(`  Line ${index + 1}: ${line.trim()}`);
          if (index < lines.length - 1) console.log(`  Line ${index+2}: ${lines[index+1].trim()}`);
          console.log('---');
        }
      });
    }
  }
}
