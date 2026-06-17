import fs from 'fs';
import path from 'path';

const migrationsDir = './supabase/migrations';
const outputFile = './full_database_schema.sql';
const finalSassSchemaFile = './b2b_saas_schema_FINAL.sql';

async function main() {
  console.log('Reading migration files...');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found!');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sorts chronologically because files start with timestamp (e.g. 20251213...)

  console.log(`Found ${files.length} migration files.`);

  let fullSql = `-- ============================================================\n`;
  fullSql += `-- UniPath Full Database Schema (Bundled)\n`;
  fullSql += `-- Created: ${new Date().toISOString()}\n`;
  fullSql += `-- ============================================================\n\n`;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Appending: ${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    fullSql += `-- ------------------------------------------------------------\n`;
    fullSql += `-- Migration: ${file}\n`;
    fullSql += `-- ------------------------------------------------------------\n\n`;
    fullSql += content;
    fullSql += '\n\n';
  }

  // Also append the final B2B SaaS schema
  if (fs.existsSync(finalSassSchemaFile)) {
    console.log('Appending final B2B SaaS schema...');
    const b2bContent = fs.readFileSync(finalSassSchemaFile, 'utf8');
    fullSql += `-- ------------------------------------------------------------\n`;
    fullSql += `-- B2B SaaS Schema & Final Polish\n`;
    fullSql += `-- ------------------------------------------------------------\n\n`;
    fullSql += b2bContent;
    fullSql += '\n\n';
  }

  fs.writeFileSync(outputFile, fullSql);
  console.log(`Success! Full bundled schema written to: ${outputFile}`);
}

main().catch(console.error);
