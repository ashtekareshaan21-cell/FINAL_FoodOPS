process.env.DATABASE_URL = 'file:./test.db';
require('./prepare.js');
const { execSync } = require('child_process');
console.log('Generating Prisma client for testing (SQLite)...');
execSync('npx prisma generate', { stdio: 'inherit' });
