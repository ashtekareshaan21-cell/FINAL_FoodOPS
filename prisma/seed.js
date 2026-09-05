require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Hash password with native crypto (must match password.ts)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const isPostgres = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.startsWith('postgresql://') || 
  process.env.DATABASE_URL.startsWith('postgres://')
);

async function main() {
  console.log('Seeding database idempotently...');
  
  let prisma;
  if (isPostgres) {
    console.log('Using PostgreSQL driver adapter for seeding...');
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  } else {
    console.log('Using SQLite driver adapter for seeding...');
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const sqliteUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:')
      ? process.env.DATABASE_URL
      : 'file:./dev.db';
    const adapter = new PrismaBetterSqlite3({
      url: sqliteUrl,
    });
    prisma = new PrismaClient({ adapter });
  }

  const demoPasswordHash = hashPassword('password');

  // 1. Create/Upsert Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@foodops.org' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@foodops.org',
      phoneNumber: '+91 9999999999',
      passwordHash: demoPasswordHash,
      role: 'ADMIN',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: { name: 'Admin Coordinator' },
    create: {
      userId: adminUser.id,
      name: 'Admin Coordinator',
      adminLevel: 2,
    },
  });

  // 2. Create/Upsert Donor
  const donorUser = await prisma.user.upsert({
    where: { email: 'donor@foodops.org' },
    update: { role: 'DONOR', verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE' },
    create: {
      email: 'donor@foodops.org',
      phoneNumber: '+91 9876543210',
      passwordHash: demoPasswordHash,
      role: 'DONOR',
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.donorProfile.upsert({
    where: { userId: donorUser.id },
    update: {
      organizationName: 'Grand Banquet Hall',
      organizationType: 'CATERER',
      contactPerson: 'Rahul Sharma',
      address: '45, Residency Road, Bengaluru',
      city: 'Bengaluru',
      latitude: 12.9716,
      longitude: 77.5946,
      verificationStatus: 'VERIFIED',
    },
    create: {
      userId: donorUser.id,
      organizationName: 'Grand Banquet Hall',
      organizationType: 'CATERER',
      contactPerson: 'Rahul Sharma',
      address: '45, Residency Road, Bengaluru',
      city: 'Bengaluru',
      latitude: 12.9716,
      longitude: 77.5946,
      verificationStatus: 'VERIFIED',
    },
  });

  // 3. Create/Upsert NGO 1 (Verified, 1.5 km away)
  const ngo1User = await prisma.user.upsert({
    where: { email: 'ngo1@foodops.org' },
    update: { role: 'NGO', verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE' },
    create: {
      email: 'ngo1@foodops.org',
      phoneNumber: '+91 9876543221',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  const ngo1Profile = await prisma.nGOProfile.upsert({
    where: { userId: ngo1User.id },
    update: {
      organizationName: 'Save Food Foundation',
      registrationNumber: 'FSSAI-29623000000001',
      status: 'VERIFIED',
      baseAddress: '10, MG Road, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9616,
      baseLongitude: 77.5846,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'Preeti Nair',
      contactPhone: '+91 9876543221',
    },
    create: {
      userId: ngo1User.id,
      organizationName: 'Save Food Foundation',
      registrationNumber: 'FSSAI-29623000000001',
      status: 'VERIFIED',
      baseAddress: '10, MG Road, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9616,
      baseLongitude: 77.5846,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'Preeti Nair',
      contactPhone: '+91 9876543221',
    },
  });

  // 4. Create/Upsert NGO 2 (Verified, 1.8 km away)
  const ngo2User = await prisma.user.upsert({
    where: { email: 'ngo2@foodops.org' },
    update: { role: 'NGO', verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE' },
    create: {
      email: 'ngo2@foodops.org',
      phoneNumber: '+91 9876543222',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.nGOProfile.upsert({
    where: { userId: ngo2User.id },
    update: {
      organizationName: 'Hunger Relief Agency',
      registrationNumber: 'FSSAI-29623000000002',
      status: 'VERIFIED',
      baseAddress: '20, Brigade Road, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9816,
      baseLongitude: 77.6046,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'Anwar Ali',
      contactPhone: '+91 9876543222',
    },
    create: {
      userId: ngo2User.id,
      organizationName: 'Hunger Relief Agency',
      registrationNumber: 'FSSAI-29623000000002',
      status: 'VERIFIED',
      baseAddress: '20, Brigade Road, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9816,
      baseLongitude: 77.6046,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'Anwar Ali',
      contactPhone: '+91 9876543222',
    },
  });

  // 5. Create/Upsert NGO 3 (Pending Verification, 3 km away)
  const ngo3User = await prisma.user.upsert({
    where: { email: 'ngo3@foodops.org' },
    update: { role: 'NGO', verificationStatus: 'PENDING_VERIFICATION', accountStatus: 'ACTIVE' },
    create: {
      email: 'ngo3@foodops.org',
      phoneNumber: '+91 9876543223',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      accountStatus: 'ACTIVE',
      verificationStatus: 'PENDING_VERIFICATION',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.nGOProfile.upsert({
    where: { userId: ngo3User.id },
    update: {
      organizationName: 'Care & Share Society',
      registrationNumber: 'FSSAI-29623000000003',
      status: 'PENDING_VERIFICATION',
      baseAddress: '30, Indiranagar, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9916,
      baseLongitude: 77.6146,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'David Miller',
      contactPhone: '+91 9876543223',
    },
    create: {
      userId: ngo3User.id,
      organizationName: 'Care & Share Society',
      registrationNumber: 'FSSAI-29623000000003',
      status: 'PENDING_VERIFICATION',
      baseAddress: '30, Indiranagar, Bengaluru',
      city: 'Bengaluru',
      baseLatitude: 12.9916,
      baseLongitude: 77.6146,
      serviceRadiusKm: 10,
      availability: 'AVAILABLE',
      acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
      contactPerson: 'David Miller',
      contactPhone: '+91 9876543223',
    },
  });

  // 6. Create/Upsert Volunteer associated with NGO 1
  const volunteerUser = await prisma.user.upsert({
    where: { email: 'volunteer@foodops.org' },
    update: { role: 'VOLUNTEER', verificationStatus: 'VERIFIED', accountStatus: 'ACTIVE' },
    create: {
      email: 'volunteer@foodops.org',
      phoneNumber: '+91 9876543231',
      passwordHash: demoPasswordHash,
      role: 'VOLUNTEER',
      accountStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.volunteer.upsert({
    where: { userId: volunteerUser.id },
    update: {
      ngoId: ngo1Profile.id,
      name: 'Rider A',
      phoneNumber: '+91 9876543231',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
    create: {
      userId: volunteerUser.id,
      ngoId: ngo1Profile.id,
      name: 'Rider A',
      phoneNumber: '+91 9876543231',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
    },
  });

  console.log('Database seeded successfully (idempotent)!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
