const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local first if it exists, then fallback to .env
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config({ path: envPath });

const schemaPath = path.join(__dirname, 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith('postgresql://') || 
  process.env.DATABASE_URL.startsWith('postgres://')
) && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]');

const postgresDatasource = `datasource db {
  provider = "postgresql"
}`;

const sqliteDatasource = `datasource db {
  provider = "sqlite"
}`;

if (isPostgres) {
  console.log('PostgreSQL database URL detected. Setting datasource to "postgresql" in schema.prisma...');
  schemaContent = schemaContent.replace(/datasource db\s*\{[^}]*\}/s, postgresDatasource);
} else {
  console.log('SQLite database URL detected or fallback. Setting datasource to "sqlite" in schema.prisma...');
  schemaContent = schemaContent.replace(/datasource db\s*\{[^}]*\}/s, sqliteDatasource);
}

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Prisma schema updated successfully.');
