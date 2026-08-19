require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1') || dbUrl.startsWith('file:');

if (isPostgres && !isLocal) {
  console.error('CRITICAL WARNING: Database URL appears to be a remote/production PostgreSQL database.');
  console.error('Resetting is strictly prohibited on non-local instances.');
  process.exit(1);
}

async function main() {
  console.log('Resetting development database...');
  let prisma;
  if (isPostgres) {
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({
      url: 'file:./dev.db',
    });
    prisma = new PrismaClient({ adapter });
  }

  // Clear existing data in correct dependency order
  await prisma.auditLog.deleteMany();
  await prisma.impactRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.volunteerAssignment.deleteMany();
  await prisma.donationStatusHistory.deleteMany();
  await prisma.donationImage.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.nGOProfile.deleteMany();
  await prisma.donorProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Development database cleared successfully.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
