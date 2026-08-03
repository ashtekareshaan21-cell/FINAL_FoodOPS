require('dotenv').config();
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith('postgresql://') || 
  process.env.DATABASE_URL.startsWith('postgres://')
);

if (isPostgres) {
  console.log('PostgreSQL database URL detected. Setting provider to "postgresql" in schema.prisma...');
  schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
} else {
  console.log('SQLite database URL detected or fallback. Setting provider to "sqlite" in schema.prisma...');
  schemaContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
}

fs.writeFileSync(schemaPath, schemaContent, 'utf8');
console.log('Prisma schema updated successfully.');
