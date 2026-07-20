const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const crypto = require('crypto');

// Hash password with native crypto (must match password.ts)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database...');
  
  // Set up Prisma Client with SQLite adapter correctly
  const adapter = new PrismaBetterSqlite3({
    url: 'file:./dev.db',
  });
  const prisma = new PrismaClient({ adapter });

  // Clear existing data
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

  const demoPasswordHash = hashPassword('password');

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@foodops.org',
      phoneNumber: '+91 9999999999',
      passwordHash: demoPasswordHash,
      role: 'ADMIN',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.adminProfile.create({
    data: {
      userId: adminUser.id,
      name: 'Admin Coordinator',
      adminLevel: 2,
    },
  });

  // 2. Create Donor
  const donorUser = await prisma.user.create({
    data: {
      email: 'donor@foodops.org',
      phoneNumber: '+91 9876543210',
      passwordHash: demoPasswordHash,
      role: 'DONOR',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  const donorProfile = await prisma.donorProfile.create({
    data: {
      userId: donorUser.id,
      organizationName: 'Grand Banquet Hall',
      organizationType: 'CATERER',
      contactPerson: 'Rahul Sharma',
      address: '45, Residency Road, Bengaluru',
      latitude: 12.9716, // Bengaluru center
      longitude: 77.5946,
    },
  });

  // 3. Create NGO 1 (Verified, 1.5 km away)
  const ngo1User = await prisma.user.create({
    data: {
      email: 'ngo1@foodops.org',
      phoneNumber: '+91 9876543221',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  const ngo1Profile = await prisma.nGOProfile.create({
    data: {
      userId: ngo1User.id,
      organizationName: 'Save Food Foundation',
      registrationNumber: 'FSSAI-29623000000001',
      status: 'VERIFIED',
      baseAddress: '10, MG Road, Bengaluru',
      baseLatitude: 12.9616, // Near center
      baseLongitude: 77.5846,
      serviceRadiusKm: 10,
      contactPerson: 'Preeti Nair',
      contactPhone: '+91 9876543221',
    },
  });

  // 4. Create NGO 2 (Verified, 1.8 km away)
  const ngo2User = await prisma.user.create({
    data: {
      email: 'ngo2@foodops.org',
      phoneNumber: '+91 9876543222',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.nGOProfile.create({
    data: {
      userId: ngo2User.id,
      organizationName: 'Hunger Relief Agency',
      registrationNumber: 'FSSAI-29623000000002',
      status: 'VERIFIED',
      baseAddress: '20, Brigade Road, Bengaluru',
      baseLatitude: 12.9816,
      baseLongitude: 77.6046,
      serviceRadiusKm: 10,
      contactPerson: 'Anwar Ali',
      contactPhone: '+91 9876543222',
    },
  });

  // 5. Create NGO 3 (Pending Verification, 3 km away)
  const ngoPendingUser = await prisma.user.create({
    data: {
      email: 'ngo_pending@foodops.org',
      phoneNumber: '+91 9876543223',
      passwordHash: demoPasswordHash,
      role: 'NGO',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.nGOProfile.create({
    data: {
      userId: ngoPendingUser.id,
      organizationName: 'Care & Share Society',
      registrationNumber: 'FSSAI-29623000000003',
      status: 'VERIFIED',
      baseAddress: '30, Indiranagar, Bengaluru',
      baseLatitude: 12.9916,
      baseLongitude: 77.6146,
      serviceRadiusKm: 10,
      contactPerson: 'David Miller',
      contactPhone: '+91 9876543223',
    },
  });

  // 6. Create Volunteer associated with NGO 1
  const volunteerUser = await prisma.user.create({
    data: {
      email: 'volunteer@foodops.org',
      phoneNumber: '+91 9876543231',
      passwordHash: demoPasswordHash,
      role: 'VOLUNTEER',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  await prisma.volunteer.create({
    data: {
      userId: volunteerUser.id,
      ngoId: ngo1Profile.id,
      name: 'Rider A',
      phoneNumber: '+91 9876543231',
      status: 'ACTIVE',
    },
  });

  console.log('Database seeded successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
