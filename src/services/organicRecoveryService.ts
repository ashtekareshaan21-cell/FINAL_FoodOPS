import { prisma } from '@/lib/db';
import { auditService } from './auditService';
import { validateStateTransition } from './donationStateMachine';
import { dynamicImpactEngine } from './dynamicImpactEngine';

export interface DispatchOrganicRecoveryInput {
  donationId: string;
  facilityId: string;
  assignedVolunteerId?: string;
  vehicleType?: string;
  divertReason?: string;
  notes?: string;
}

// Default Pune & Metro Biomethanation and Composting Facilities
const INITIAL_PUNE_FACILITIES = [
  {
    name: 'PMC Katraj Biomethanation & Clean Power Plant',
    facilityType: 'BIOMETHANATION_PLANT',
    operatorName: 'Pune Municipal Bio-Energy Corporation',
    address: 'Survey No. 42, Katraj-Kondhwa Road, Katraj, Pune',
    city: 'Pune',
    latitude: 18.4529,
    longitude: 73.8647,
    contactPhone: '+91 20 2437 1100',
    contactEmail: 'katraj.biogas@punecorporation.org',
    dailyCapacityKg: 5000,
    currentLoadKg: 1850,
    acceptedWasteTypes: 'COOKED_FOOD,VEGETABLE_WASTE,CURRY_SLURRY,GRAINS',
    processingMethod: 'ANAEROBIC_DIGESTION',
    outputProduct: 'CLEAN_ELECTRICITY_AND_BIO_SLURRY',
  },
  {
    name: 'Urja CleanTech Bio-CNG Fuel Station',
    facilityType: 'BIO_CNG_STATION',
    operatorName: 'Urja Renewables & Cleantech Ltd',
    address: 'Plot 18, Hadapsar Industrial Area, Pune',
    city: 'Pune',
    latitude: 18.5089,
    longitude: 73.9260,
    contactPhone: '+91 20 6682 9900',
    contactEmail: 'operations@urjabiofuels.in',
    dailyCapacityKg: 10000,
    currentLoadKg: 4200,
    acceptedWasteTypes: 'COOKED_FOOD,COMMERCIAL_BUFFET_WASTE,BAKERY,FRUITS',
    processingMethod: 'HIGH_RATE_ANAEROBIC_BIO_METHANATION',
    outputProduct: 'COMPRESSED_BIO_GAS_AND_MANURE',
  },
  {
    name: 'Mula-Mutha Agro Composting & Fertilizer Park',
    facilityType: 'COMMUNITY_COMPOSTER',
    operatorName: 'Mula-Mutha Ecological Restoration Trust',
    address: 'Near Kalyani Nagar Bridge, Wadgaon Sheri, Pune',
    city: 'Pune',
    latitude: 18.5480,
    longitude: 73.9015,
    contactPhone: '+91 98220 54321',
    contactEmail: 'compost@mula-mutha-trust.org',
    dailyCapacityKg: 4000,
    currentLoadKg: 1200,
    acceptedWasteTypes: 'VEGETABLE_WASTE,FRUITS,DRY_RATION,EXPIRED_BAKERY',
    processingMethod: 'AEROBIC_WINDROW_COMPOSTING',
    outputProduct: 'ORGANIC_HIGH_NITROGEN_FARM_COMPOST',
  },
  {
    name: 'Bhosari MIDC Industrial Biomethanation Plant',
    facilityType: 'BIOMETHANATION_PLANT',
    operatorName: 'PCMC Green Infrastructure Solutions',
    address: 'Sector 7, Bhosari MIDC, Pimpri-Chinchwad, Pune',
    city: 'Pune',
    latitude: 18.6279,
    longitude: 73.8437,
    contactPhone: '+91 20 2712 3456',
    contactEmail: 'pcmc.biogas@punemetro.gov.in',
    dailyCapacityKg: 8000,
    currentLoadKg: 3100,
    acceptedWasteTypes: 'COOKED_FOOD,VEGETABLE_WASTE,DAIRY,PACKAGED_ORGANIC',
    processingMethod: 'THERMOPHILIC_ANAEROBIC_DIGESTION',
    outputProduct: 'BIO_GAS_AND_ORGANIC_SOIL_ENRICHER',
  },
  {
    name: 'Alandi Goshala Animal Feed Repurposing Shelter',
    facilityType: 'ANIMAL_FEED_SHELTER',
    operatorName: 'Alandi Rural Animal Welfare Society',
    address: 'Alandi Road, Charholi Budruk, Pune',
    city: 'Pune',
    latitude: 18.6752,
    longitude: 73.8986,
    contactPhone: '+91 94220 11223',
    contactEmail: 'care@alandigoshala.org',
    dailyCapacityKg: 2500,
    currentLoadKg: 800,
    acceptedWasteTypes: 'FRESH_BAKERY_SURPLUS,GRAINS,RAW_VEGETABLES,FRUITS',
    processingMethod: 'FEED_GRADING_AND_STERILIZATION',
    outputProduct: 'NUTRITIONAL_CATTLE_FEED',
  },
];

export const organicRecoveryService = {
  /**
   * Ensure standard Pune facilities exist in the database.
   */
  async ensureFacilitiesSeeded() {
    const count = await prisma.organicFacility.count();
    if (count > 0) return;

    for (const fac of INITIAL_PUNE_FACILITIES) {
      await prisma.organicFacility.create({ data: fac });
    }
  },

  /**
   * Fetch all registered organic processing facilities.
   */
  async getFacilities() {
    await this.ensureFacilitiesSeeded();
    return prisma.organicFacility.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Dispatch an expired or rejected food listing to an organic recovery facility.
   */
  async dispatchOrganicRecovery(userId: string, input: DispatchOrganicRecoveryInput) {
    await this.ensureFacilitiesSeeded();

    const { donationId, facilityId, assignedVolunteerId, vehicleType, divertReason, notes } = input;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'NGO' && user.role !== 'ADMIN')) {
      throw new Error('Not found');
    }

    const ngo =
      user.role === 'NGO'
        ? await prisma.nGOProfile.findUnique({ where: { userId } })
        : null;
    if (user.role === 'NGO' && !ngo) {
      throw new Error('NGO profile not found');
    }

    const facility = await prisma.organicFacility.findUnique({ where: { id: facilityId } });
    if (!facility) throw new Error('Organic facility not found');

    let volunteerName: string | null = null;
    if (assignedVolunteerId) {
      const vol = await prisma.volunteer.findUnique({ where: { id: assignedVolunteerId } });
      if (!vol || (ngo && vol.ngoId !== ngo.id)) {
        throw new Error('Volunteer not found');
      }
      volunteerName = vol.name;
    }

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
        include: { donor: true },
      });
      if (!donation) throw new Error('Donation not found');
      if (ngo && donation.acceptedNgoId !== ngo.id) {
        throw new Error('Donation not found');
      }

      // State transition validation: allow moving from EXPIRED or RECOVERY_ESCALATED or ACCEPTED (spoil divert)
      if (donation.status === 'EXPIRED') {
        // Direct jump to ORGANIC_RECOVERY or through RECOVERY_ESCALATED
        validateStateTransition('EXPIRED', 'RECOVERY_ESCALATED', 'ESCALATE', {
          actorRole: user.role,
          actorId: userId,
          isOwner: true,
        });
      }

      // Calculate weight in KG
      const parsedQty = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
      const foodWeightKg = isNaN(parsedQty) || parsedQty <= 0 ? 20.0 : parsedQty;

      // Dynamic Life Cycle & Bio-Kinetic Assessment
      const recoveryCalc = dynamicImpactEngine.calculateRecoveryImpact({
        foodWeightKg,
        facilityType: facility.facilityType,
        facilityName: facility.name,
        facilityEfficiency: 0.90,
        title: donation.title,
        description: donation.description,
        wasteCategory: donation.foodCategory,
        vegNonVeg: donation.vegNonVegMixed,
        pickupCoords:
          donation.pickupLatitude && donation.pickupLongitude
            ? { latitude: donation.pickupLatitude, longitude: donation.pickupLongitude }
            : null,
        facilityCoords:
          facility.latitude && facility.longitude
            ? { latitude: facility.latitude, longitude: facility.longitude }
            : null,
        vehicleType: vehicleType || 'Cargo Auto (Sealed)',
      });

      const cleanEnergyKwh = recoveryCalc.cleanEnergyKwh;
      const biogasM3 = recoveryCalc.biogasM3;
      const bioFertilizerKg = recoveryCalc.bioFertilizerKg;
      const landfillMethaneAvoidedKg = recoveryCalc.landfillMethaneAvoidedKg;

      // Generate 6-digit gate entry OTP for facility weighbridge handover
      const gateEntryOtp = Math.floor(100000 + Math.random() * 900000).toString();

      // Upsert the OrganicRecoveryMission
      const mission = await tx.organicRecoveryMission.upsert({
        where: { donationId },
        update: {
          facilityId,
          initiatedById: userId,
          assignedVolunteerId: assignedVolunteerId || null,
          assignedVolunteerName: volunteerName,
          vehicleType: vehicleType || 'Cargo Auto (Sealed)',
          status: 'DISPATCHED',
          divertReason: divertReason || 'SLA Expiration & Spoilage Prevention',
          foodWeightKg,
          wasteCategory: donation.foodCategory || 'MIXED_ORGANIC',
          gateEntryOtp,
          cleanEnergyKwh,
          biogasM3,
          bioFertilizerKg,
          landfillMethaneAvoidedKg,
          notes: notes || null,
        },
        create: {
          donationId,
          facilityId,
          initiatedById: userId,
          assignedVolunteerId: assignedVolunteerId || null,
          assignedVolunteerName: volunteerName,
          vehicleType: vehicleType || 'Cargo Auto (Sealed)',
          status: 'DISPATCHED',
          divertReason: divertReason || 'SLA Expiration & Spoilage Prevention',
          foodWeightKg,
          wasteCategory: donation.foodCategory || 'MIXED_ORGANIC',
          gateEntryOtp,
          cleanEnergyKwh,
          biogasM3,
          bioFertilizerKg,
          landfillMethaneAvoidedKg,
          notes: notes || null,
        },
      });

      // Update facility load
      await tx.organicFacility.update({
        where: { id: facilityId },
        data: { currentLoadKg: { increment: foodWeightKg } },
      });

      // Update donation status to ORGANIC_RECOVERY
      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: 'ORGANIC_RECOVERY',
          cancelReason: `Diverted to ${facility.name} (${facility.processingMethod})`,
        },
      });

      // Record in status history
      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: donation.status,
          newStatus: 'ORGANIC_RECOVERY',
          changedBy: userId,
          reason: `Dispatched to organic recovery facility: ${facility.name}. Route OTP: ${gateEntryOtp}`,
        },
      });

      // Upsert ImpactRecord with Dynamic Organic Recovery details
      await tx.impactRecord.upsert({
        where: { donationId },
        update: {
          foodWeightKg,
          estimatedServings: 0,
          co2EquivalentKg: recoveryCalc.netCo2SavedKg,
          waterSavedLiters: recoveryCalc.waterSavedLiters,
          calculationMethod: recoveryCalc.calculationMethod,
          factorsUsed: recoveryCalc.factorsUsed,
        },
        create: {
          donationId,
          foodWeightKg,
          estimatedServings: 0,
          co2EquivalentKg: recoveryCalc.netCo2SavedKg,
          waterSavedLiters: recoveryCalc.waterSavedLiters,
          calculationMethod: recoveryCalc.calculationMethod,
          factorsUsed: recoveryCalc.factorsUsed,
        },
      });

      // Audit log
      await auditService.log(tx, {
        userId,
        role: user.role,
        action: 'ORGANIC_RECOVERY_DISPATCHED',
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: donation.status },
        newValues: {
          status: 'ORGANIC_RECOVERY',
          facilityId,
          facilityName: facility.name,
          gateEntryOtp,
          cleanEnergyKwh,
          landfillMethaneAvoidedKg,
        },
      });

      return mission;
    });

    return {
      success: true,
      mission: result,
      facilityName: facility.name,
      processingMethod: facility.processingMethod,
      gateEntryOtp: result.gateEntryOtp,
    };
  },

  /**
   * Confirm arrival and weighbridge acceptance at the processing facility.
   */
  async confirmFacilityArrival(userId: string, missionId: string, otp?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'NGO' && user.role !== 'ADMIN')) {
      throw new Error('Mission not found');
    }

    const mission = await prisma.organicRecoveryMission.findUnique({
      where: { id: missionId },
      include: { facility: true, donation: true },
    });
    if (!mission) throw new Error('Mission not found');

    const isAdmin = user.role === 'ADMIN';
    const isInitiator = mission.initiatedById === userId;
    const ngo =
      !isAdmin && !isInitiator
        ? await prisma.nGOProfile.findUnique({ where: { userId } })
        : null;
    const isAssignedNgo = Boolean(
      ngo && mission.donation.acceptedNgoId === ngo.id
    );
    if (!isAdmin && !isInitiator && !isAssignedNgo) {
      throw new Error('Mission not found');
    }

    if (otp && mission.gateEntryOtp && otp.trim() !== mission.gateEntryOtp.trim()) {
      throw new Error('Invalid Gate Entry OTP for facility weighbridge.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.organicRecoveryMission.update({
        where: { id: missionId },
        data: {
          status: 'PROCESSED',
          gateEntryConfirmedAt: new Date(),
          processingCompletedAt: new Date(),
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId: mission.donationId,
          previousStatus: 'ORGANIC_RECOVERY',
          newStatus: 'ORGANIC_RECOVERY',
          changedBy: userId,
          reason: `Weighbridge verified at ${mission.facility.name}. Digestion into ${mission.facility.outputProduct} initiated.`,
        },
      });

      await auditService.log(tx, {
        userId,
        role: user.role,
        action: 'ORGANIC_RECOVERY_PROCESSED',
        entityType: 'OrganicRecoveryMission',
        entityId: missionId,
        newValues: {
          status: 'PROCESSED',
          facilityName: mission.facility.name,
          cleanEnergyKwh: mission.cleanEnergyKwh,
        },
      });
    });

    return {
      success: true,
      missionId,
      status: 'PROCESSED',
      facilityName: mission.facility.name,
    };
  },

  /**
   * Fetch complete data for Organic Recovery views (scoped by caller NGO or Admin).
   */
  async getOrganicRecoveryDashboardData(userId?: string, role?: string) {
    await this.ensureFacilitiesSeeded();

    const isAdmin = role === 'ADMIN';
    let ngoId: string | null = null;
    if (!isAdmin) {
      if (!userId) {
        return {
          facilities: [],
          missions: [],
          candidateDonations: [],
          metrics: {
            totalMissions: 0,
            totalWasteKg: 0,
            totalCleanEnergyKwh: 0,
            totalBioFertilizerKg: 0,
            totalMethaneAvoidedKg: 0,
          },
        };
      }
      const ngo = await prisma.nGOProfile.findUnique({ where: { userId } });
      if (!ngo) {
        return {
          facilities: [],
          missions: [],
          candidateDonations: [],
          metrics: {
            totalMissions: 0,
            totalWasteKg: 0,
            totalCleanEnergyKwh: 0,
            totalBioFertilizerKg: 0,
            totalMethaneAvoidedKg: 0,
          },
        };
      }
      ngoId = ngo.id;
    }

    const [facilities, missions, candidateDonations] = await Promise.all([
      prisma.organicFacility.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              missions: isAdmin
                ? true
                : {
                    where: {
                      OR: [
                        { initiatedById: userId },
                        { donation: { acceptedNgoId: ngoId } },
                      ],
                    },
                  },
            },
          },
        },
        orderBy: { dailyCapacityKg: 'desc' },
      }),
      prisma.organicRecoveryMission.findMany({
        where: isAdmin
          ? undefined
          : {
              OR: [
                { initiatedById: userId },
                { donation: { acceptedNgoId: ngoId } },
              ],
            },
        include: {
          facility: true,
          donation: {
            include: {
              donor: { select: { organizationName: true, address: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.findMany({
        where: {
          ...(isAdmin ? {} : { acceptedNgoId: ngoId }),
          status: { in: ['EXPIRED', 'RECOVERY_ESCALATED', 'CANCELLED'] },
          organicMission: null, // Not yet dispatched
        },
        include: {
          donor: { select: { organizationName: true, address: true } },
          acceptedNgo: { select: { organizationName: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // Aggregate metrics
    let totalWasteKg = 0;
    let totalCleanEnergyKwh = 0;
    let totalBioFertilizerKg = 0;
    let totalMethaneAvoidedKg = 0;

    for (const m of missions) {
      totalWasteKg += m.foodWeightKg || 0;
      totalCleanEnergyKwh += m.cleanEnergyKwh || 0;
      totalBioFertilizerKg += m.bioFertilizerKg || 0;
      totalMethaneAvoidedKg += m.landfillMethaneAvoidedKg || 0;
    }

    return {
      facilities,
      missions,
      candidateDonations,
      metrics: {
        totalMissions: missions.length,
        totalWasteKg: Number(totalWasteKg.toFixed(1)),
        totalCleanEnergyKwh: Number(totalCleanEnergyKwh.toFixed(1)),
        totalBioFertilizerKg: Number(totalBioFertilizerKg.toFixed(1)),
        totalMethaneAvoidedKg: Number(totalMethaneAvoidedKg.toFixed(1)),
      },
    };
  },

  /**
   * 1-Click test seeder for expired/diverted listings so users can immediately
   * test the Organic Recovery flow.
   */
  async seedDemoExpiredDonations(userId: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
      throw new Error('Demo seeding is disabled outside demo mode.');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const donor = await prisma.donorProfile.findFirst();
    if (!donor) {
      throw new Error('Donor profile required to seed donations.');
    }

    const ngo = await prisma.nGOProfile.findFirst({ where: { status: 'VERIFIED' } });

    const now = new Date();
    const expiredAt = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    const items = [
      {
        title: '60kg Cooked Vegetable Rice & Sambar (SLA Expired)',
        description: 'Large community lunch surplus that passed safe food recovery window (2 hours over deadline).',
        foodCategory: 'COOKED_VEG',
        quantity: '60',
        quantityUnit: 'KG',
        status: 'EXPIRED' as const,
        cancelReason: 'SLA Expiration: Exceeded 4-hour room temperature limit',
      },
      {
        title: '45kg Over-Ripened Fruit & Bakery Waste',
        description: 'Over-ripened bananas, bruised papaya, and expired artisanal bread unsuitable for human consumption.',
        foodCategory: 'FRUITS_VEG',
        quantity: '45',
        quantityUnit: 'KG',
        status: 'RECOVERY_ESCALATED' as const,
        cancelReason: 'Visual AI Quality Inspection Failed: Bruising & Fermentation',
      },
    ];

    const created = [];
    for (const item of items) {
      const don = await prisma.donation.create({
        data: {
          donorId: donor.id,
          acceptedNgoId: ngo ? ngo.id : null,
          title: item.title,
          description: item.description,
          foodCategory: item.foodCategory,
          vegNonVegMixed: 'VEG',
          quantity: item.quantity,
          quantityUnit: item.quantityUnit,
          estimatedServings: 0,
          pickupAvailableAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          pickupDeadlineAt: expiredAt,
          pickupAddress: `${donor.organizationName}, Pune City Area`,
          pickupLatitude: 18.5204,
          pickupLongitude: 73.8567,
          status: item.status,
          cancelReason: item.cancelReason,
        },
      });

      await prisma.donationStatusHistory.create({
        data: {
          donationId: don.id,
          previousStatus: 'AVAILABLE',
          newStatus: item.status,
          changedBy: userId,
          reason: item.cancelReason,
        },
      });

      created.push(don);
    }

    return created;
  },
};
