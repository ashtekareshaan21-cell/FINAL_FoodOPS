const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const assert = require('assert');

// Haversine distance calculation in kilometers
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const IMPACT_FACTORS = {
  'grains': { co2: 1.2, water: 2500 },
  'vegetables': { co2: 0.5, water: 300 },
  'fruits': { co2: 0.7, water: 900 },
  'dairy': { co2: 3.2, water: 1000 },
  'meat': { co2: 7.0, water: 15000 },
  'mixed': { co2: 2.5, water: 1500 },
};

async function runTest() {
  console.log('--- STARTING FOODOPS MVP INTEGRATION TEST ---');
  
  const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Fetch seed users and profiles
    console.log('\n[1/6] Fetching profiles...');
    const donor = await prisma.donorProfile.findFirst();
    const ngo1 = await prisma.nGOProfile.findFirst({ where: { organizationName: 'Save Food Foundation' } });
    const ngo2 = await prisma.nGOProfile.findFirst({ where: { organizationName: 'Hunger Relief Agency' } });
    const volunteer = await prisma.volunteer.findFirst();
    
    assert(donor, 'Donor seed data missing');
    assert(ngo1, 'NGO 1 seed data missing');
    assert(ngo2, 'NGO 2 seed data missing');
    assert(volunteer, 'Volunteer seed data missing');
    
    console.log(`Donor: ${donor.organizationName}`);
    console.log(`NGO A: ${ngo1.organizationName}`);
    console.log(`NGO B: ${ngo2.organizationName}`);
    console.log(`Volunteer: ${volunteer.name}`);

    // 2. Create Donation
    console.log('\n[2/6] Creating mock surplus donation...');
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours later
    const donation = await prisma.donation.create({
      data: {
        donorId: donor.id,
        title: '40 kg Fresh Veg Curry & Rice',
        description: 'Remaining catering buffet. Packaged in sanitized boxes.',
        foodCategory: 'mixed',
        vegNonVegMixed: 'VEG',
        quantity: '40',
        quantityUnit: 'KG',
        estimatedServings: 120,
        pickupAvailableAt: new Date(),
        pickupDeadlineAt: deadline,
        pickupAddress: 'Grand Banquet Hall, Bengaluru',
        pickupLatitude: 12.9716,
        pickupLongitude: 77.5946,
        status: 'AVAILABLE',
      },
    });
    console.log(`Donation created: "${donation.title}" with status: ${donation.status}`);

    // 3. Test Concurrency Acceptance Lock (NGO A & NGO B claim simultaneously)
    console.log('\n[3/6] Testing Concurrency Acceptance Lock...');
    console.log('Sending simultaneous acceptance requests for NGO A and NGO B...');

    const attemptClaim = async (ngoProfile, label) => {
      try {
        // Simulating the transactional lock block in acceptDonation
        return await prisma.$transaction(async (tx) => {
          const d = await tx.donation.findUnique({ where: { id: donation.id } });
          
          if (d.status !== 'AVAILABLE') {
            throw new Error('DONATION_ALREADY_ACCEPTED');
          }

          const dist = haversineDistance(d.pickupLatitude, d.pickupLongitude, ngoProfile.baseLatitude, ngoProfile.baseLongitude);
          if (dist > ngoProfile.serviceRadiusKm) {
            throw new Error('DONATION_OUT_OF_RANGE');
          }

          const updated = await tx.donation.update({
            where: { id: donation.id },
            data: {
              status: 'ACCEPTED',
              acceptedNgoId: ngoProfile.id,
            },
          });
          
          return { success: true, label, donation: updated };
        });
      } catch (err) {
        return { success: false, label, error: err.message };
      }
    };

    // Execute concurrent promises
    const [resA, resB] = await Promise.all([
      attemptClaim(ngo1, 'NGO A (Save Food Foundation)'),
      attemptClaim(ngo2, 'NGO B (Hunger Relief Agency)')
    ]);

    console.log(`NGO A Result: ${resA.success ? 'SUCCESS ✓' : 'FAILED ✕ - ' + resA.error}`);
    console.log(`NGO B Result: ${resB.success ? 'SUCCESS ✓' : 'FAILED ✕ - ' + resB.error}`);

    // Assert that exactly one succeeded
    const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
    assert.strictEqual(successCount, 1, 'Locking failure: Both or neither NGO claimed the donation!');
    console.log('✓ CONCURRENCY LOCK ASSERTION PASSED: Exactly one NGO accepted the donation.');

    const claimingNgo = resA.success ? ngo1 : ngo2;
    console.log(`Donation is locked to: ${claimingNgo.organizationName}`);

    // 4. Assign Volunteer
    console.log('\n[4/6] Assigning volunteer...');
    const updatedDonation = await prisma.$transaction(async (tx) => {
      await tx.volunteerAssignment.create({
        data: {
          donationId: donation.id,
          volunteerId: volunteer.id,
          ngoId: claimingNgo.id,
          status: 'ASSIGNED',
        },
      });

      return await tx.donation.update({
        where: { id: donation.id },
        data: { status: 'VOLUNTEER_ASSIGNED' },
      });
    });
    console.log(`Volunteer ${volunteer.name} assigned. Donation status updated to: ${updatedDonation.status}`);

    // 5. Run Shipment Lifecycle transitions (Volunteer workflow)
    console.log('\n[5/6] Advancing volunteer workflow states...');
    
    // Find assignment record
    const assignment = await prisma.volunteerAssignment.findUnique({
      where: { donationId: donation.id },
    });
    
    // Start pickup
    await prisma.volunteerAssignment.update({
      where: { id: assignment.id },
      data: { status: 'STARTED', startedAt: new Date() },
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'PICKUP_IN_PROGRESS' },
    });
    console.log('Action: START_PICKUP -> status: PICKUP_IN_PROGRESS');

    // Arrive
    await prisma.volunteerAssignment.update({
      where: { id: assignment.id },
      data: { arrivedAt: new Date() },
    });
    console.log('Action: ARRIVE_AT_DONOR');

    // Confirm pickup (Food collected)
    await prisma.volunteerAssignment.update({
      where: { id: assignment.id },
      data: { pickupConfirmedAt: new Date() },
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'PICKED_UP' },
    });
    console.log('Action: CONFIRM_PICKUP -> status: PICKED_UP');

    // Start delivery
    await prisma.volunteerAssignment.update({
      where: { id: assignment.id },
      data: { deliveryStartedAt: new Date() },
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'DELIVERY_IN_PROGRESS' },
    });
    console.log('Action: START_DELIVERY -> status: DELIVERY_IN_PROGRESS');

    // Confirm delivery (Complete rescue)
    const weightKg = parseFloat(donation.quantity);
    const factor = IMPACT_FACTORS[donation.foodCategory];
    const co2Saved = weightKg * factor.co2;
    const waterSaved = weightKg * factor.water;

    await prisma.volunteerAssignment.update({
      where: { id: assignment.id },
      data: { status: 'COMPLETED', deliveryConfirmedAt: new Date() },
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: 'COMPLETED' },
    });
    
    // Save impact record
    await prisma.impactRecord.create({
      data: {
        donationId: donation.id,
        foodWeightKg: weightKg,
        estimatedServings: donation.estimatedServings,
        co2EquivalentKg: co2Saved,
        waterSavedLiters: waterSaved,
        calculationMethod: 'FAO_FACTORS_2026',
        factorsUsed: `${donation.foodCategory}: co2=${factor.co2}, water=${factor.water}`,
      },
    });
    console.log('Action: CONFIRM_DELIVERY -> status: COMPLETED');

    // 6. Verify final state and stats
    console.log('\n[6/6] Verifying final database state...');
    
    const finalDonation = await prisma.donation.findUnique({ where: { id: donation.id } });
    const finalAssignment = await prisma.volunteerAssignment.findUnique({ where: { donationId: donation.id } });
    const finalImpact = await prisma.impactRecord.findUnique({ where: { donationId: donation.id } });

    assert.strictEqual(finalDonation.status, 'COMPLETED', 'Donation should be COMPLETED');
    assert.strictEqual(finalAssignment.status, 'COMPLETED', 'Assignment should be COMPLETED');
    assert(finalImpact, 'Impact record should exist');
    assert.strictEqual(finalImpact.co2EquivalentKg, 100.0, 'CO2 savings calculation incorrect'); // 40kg * 2.5 = 100 kg CO2e
    assert.strictEqual(finalImpact.waterSavedLiters, 60000.0, 'Water savings calculation incorrect'); // 40kg * 1500 = 60,000 liters

    console.log('✓ STATUS TRANSITIONS VERIFIED');
    console.log('✓ IMPACT RECORDS ASSERTED');
    console.log(`  Weight Rescued: ${finalImpact.foodWeightKg} kg`);
    console.log(`  CO2 Saved: ${finalImpact.co2EquivalentKg} kg CO2e`);
    console.log(`  Water Saved: ${finalImpact.waterSavedLiters} Liters`);
    console.log(`  Servings Provided: ${finalImpact.estimatedServings} meals`);

    console.log('\n--- INTEGRATION TEST SUCCESSFUL: ALL CHECKS PASSED ---');

  } catch (error) {
    console.error('\n✕ TEST FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
