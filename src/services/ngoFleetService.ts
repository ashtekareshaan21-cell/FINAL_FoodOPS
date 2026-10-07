import { prisma } from '@/lib/db';
import { ngoRepository } from '@/repositories/ngoRepository';
import { auditService } from './auditService';
import { hashPassword } from '@/lib/password';
import { dynamicImpactEngine } from './dynamicImpactEngine';

export const ngoFleetService = {
  /**
   * Get all volunteers belonging to the authenticated NGO,
   * annotated with live workload stats and active missions.
   */
  async getFleetRosterWithStats(ngoUserId: string) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    const volunteers = await prisma.volunteer.findMany({
      where: { ngoId: ngo.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phoneNumber: true,
            accountStatus: true,
            verificationStatus: true,
          },
        },
        assignments: {
          include: {
            donation: {
              include: {
                donor: {
                  select: {
                    organizationName: true,
                    address: true,
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const activeDonationStatuses = [
      'VOLUNTEER_ASSIGNED',
      'PICKUP_IN_PROGRESS',
      'PICKED_UP',
      'DELIVERY_IN_PROGRESS',
    ];

    const roster = volunteers.map((vol) => {
      const activeAssignments = vol.assignments.filter(
        (a) =>
          activeDonationStatuses.includes(a.donation.status) &&
          a.status !== 'COMPLETED' &&
          a.status !== 'CANCELLED'
      );

      const completedCount = vol.assignments.filter(
        (a) => a.status === 'COMPLETED' || a.donation.status === 'COMPLETED'
      ).length;

      const currentTasks = activeAssignments.map((a) => ({
        assignmentId: a.id,
        donationId: a.donationId,
        title: a.donation.title,
        status: a.donation.status,
        quantity: `${a.donation.quantity} ${a.donation.quantityUnit}`,
        donorName: a.donation.donor.organizationName,
        pickupAddress: a.donation.pickupAddress,
        startedAt: a.startedAt,
        pickupConfirmedAt: a.pickupConfirmedAt,
        deliveryStartedAt: a.deliveryStartedAt,
      }));

      return {
        id: vol.id,
        userId: vol.userId,
        name: vol.name,
        email: vol.user.email,
        phoneNumber: vol.phoneNumber,
        vehicleInfo: vol.vehicleInfo || 'Bike / Two-Wheeler',
        operatingArea: vol.operatingArea || 'Metro Service Area',
        status: vol.status,
        verificationStatus: vol.verificationStatus,
        createdAt: vol.createdAt,
        activeTasksCount: activeAssignments.length,
        completedTasksCount: completedCount,
        isBusy: activeAssignments.length > 0,
        currentTasks,
      };
    });

    const totalVolunteers = roster.length;
    const activeVolunteers = roster.filter((v) => v.status === 'ACTIVE').length;
    const busyCount = roster.filter((v) => v.isBusy).length;
    const idleCount = roster.filter((v) => !v.isBusy && v.status === 'ACTIVE').length;
    const verifiedCount = roster.filter((v) => v.verificationStatus === 'VERIFIED').length;

    return {
      ngo: {
        id: ngo.id,
        organizationName: ngo.organizationName,
        registrationNumber: ngo.registrationNumber,
        status: ngo.status,
        availability: ngo.availability,
        baseAddress: ngo.baseAddress,
        serviceRadiusKm: ngo.serviceRadiusKm,
      },
      volunteers: roster,
      stats: {
        totalVolunteers,
        activeVolunteers,
        busyCount,
        idleCount,
        verifiedCount,
      },
    };
  },

  /**
   * Add / Register a new volunteer attached to this NGO
   */
  async addVolunteerToNgo(
    ngoUserId: string,
    data: {
      name: string;
      email: string;
      phoneNumber: string;
      vehicleInfo?: string;
      operatingArea?: string;
    }
  ) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phoneNumber.trim();

    if (!data.name || !cleanEmail || !cleanPhone) {
      throw new Error('Name, Email, and Phone number are required.');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phoneNumber: cleanPhone }],
      },
    });

    if (existingUser) {
      throw new Error('A user with this email or phone number already exists.');
    }

    const defaultPasswordHash = hashPassword('Password123!');

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          phoneNumber: cleanPhone,
          passwordHash: defaultPasswordHash,
          role: 'VOLUNTEER',
          accountStatus: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          isPhoneVerified: true,
          isEmailVerified: true,
        },
      });

      const volunteer = await tx.volunteer.create({
        data: {
          userId: user.id,
          ngoId: ngo.id,
          name: data.name.trim(),
          phoneNumber: cleanPhone,
          vehicleInfo: data.vehicleInfo?.trim() || 'Two-Wheeler',
          operatingArea: data.operatingArea?.trim() || ngo.city || 'Metro Area',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        },
      });

      await auditService.log(tx, {
        userId: ngoUserId,
        role: 'NGO',
        action: 'VOLUNTEER_REGISTERED_BY_NGO',
        entityType: 'Volunteer',
        entityId: volunteer.id,
        newValues: { name: volunteer.name, ngoId: ngo.id },
      });

      return volunteer;
    });

    return result;
  },

  /**
   * Random or Round-Robin Batch Allotment of unassigned tasks
   * across active verified volunteers of this NGO.
   */
  async autoAllotDonations(
    ngoUserId: string,
    options: {
      mode: 'RANDOM' | 'ROUND_ROBIN';
      donationIds?: string[];
    }
  ) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    // 1. Fetch eligible donations
    let donationsToAssign = [];
    if (options.donationIds && options.donationIds.length > 0) {
      donationsToAssign = await prisma.donation.findMany({
        where: {
          id: { in: options.donationIds },
          acceptedNgoId: ngo.id,
          status: { in: ['ACCEPTED', 'VOLUNTEER_ASSIGNED'] },
        },
        include: {
          donor: { select: { organizationName: true } },
          assignment: true,
        },
      });
    } else {
      // All unassigned accepted donations for this NGO
      donationsToAssign = await prisma.donation.findMany({
        where: {
          acceptedNgoId: ngo.id,
          status: { in: ['ACCEPTED', 'VOLUNTEER_ASSIGNED'] },
        },
        include: {
          donor: { select: { organizationName: true } },
          assignment: true,
        },
      });
    }

    if (donationsToAssign.length === 0) {
      throw new Error(
        'No unassigned or pending surplus donations found to allot. Accept donations from the marketplace or seed demo rescues first.'
      );
    }

    // 2. Fetch active verified volunteers of this NGO
    const volunteers = await prisma.volunteer.findMany({
      where: {
        ngoId: ngo.id,
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
      include: {
        assignments: {
          where: {
            status: { in: ['ASSIGNED', 'STARTED', 'ARRIVED'] },
          },
        },
      },
    });

    if (volunteers.length === 0) {
      throw new Error(
        'No active verified volunteers available for your NGO. Please register or verify volunteers first.'
      );
    }

    // 3. Plan the distribution
    const plannedAssignments: {
      donationId: string;
      donationTitle: string;
      volunteerId: string;
      volunteerName: string;
    }[] = [];

    if (options.mode === 'RANDOM') {
      // Fisher-Yates shuffle volunteers
      const shuffled = [...volunteers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      donationsToAssign.forEach((don, idx) => {
        const assignedVol = shuffled[idx % shuffled.length];
        plannedAssignments.push({
          donationId: don.id,
          donationTitle: don.title,
          volunteerId: assignedVol.id,
          volunteerName: assignedVol.name,
        });
      });
    } else {
      // ROUND_ROBIN based on smallest current workload
      const volunteerLoads = volunteers.map((v) => ({
        volunteer: v,
        currentLoad: v.assignments.length,
      }));

      donationsToAssign.forEach((don) => {
        // Sort ascending by load
        volunteerLoads.sort((a, b) => a.currentLoad - b.currentLoad);
        const target = volunteerLoads[0];
        target.currentLoad += 1;

        plannedAssignments.push({
          donationId: don.id,
          donationTitle: don.title,
          volunteerId: target.volunteer.id,
          volunteerName: target.volunteer.name,
        });
      });
    }

    // 4. Execute all assignments atomically in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of plannedAssignments) {
        // Remove prior assignment if re-allotting
        await tx.volunteerAssignment.deleteMany({
          where: { donationId: item.donationId },
        });

        // Create new assignment
        await tx.volunteerAssignment.create({
          data: {
            donationId: item.donationId,
            volunteerId: item.volunteerId,
            ngoId: ngo.id,
            status: 'ASSIGNED',
            assignedAt: new Date(),
          },
        });

        // Update donation status
        await tx.donation.update({
          where: { id: item.donationId },
          data: { status: 'VOLUNTEER_ASSIGNED' },
        });

        // Log status history
        await tx.donationStatusHistory.create({
          data: {
            donationId: item.donationId,
            previousStatus: 'ACCEPTED',
            newStatus: 'VOLUNTEER_ASSIGNED',
            changedBy: ngoUserId,
            reason: `Batch ${options.mode} allotment assigned to ${item.volunteerName}`,
          },
        });

        // Audit log
        await auditService.log(tx, {
          userId: ngoUserId,
          role: 'NGO',
          action: 'BATCH_VOLUNTEER_ALLOTMENT',
          entityType: 'Donation',
          entityId: item.donationId,
          newValues: {
            mode: options.mode,
            volunteerId: item.volunteerId,
            volunteerName: item.volunteerName,
          },
        });
      }
    });

    return {
      count: plannedAssignments.length,
      mode: options.mode,
      assignments: plannedAssignments,
    };
  },

  /**
   * Advance a rescue's operational stage for live tracking / simulation.
   * VOLUNTEER_ASSIGNED -> PICKUP_IN_PROGRESS -> PICKED_UP -> DELIVERY_IN_PROGRESS -> COMPLETED
   */
  async advanceRescueStage(ngoUserId: string, donationId: string) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        assignment: {
          include: { volunteer: true },
        },
      },
    });

    if (!donation || donation.acceptedNgoId !== ngo.id) {
      throw new Error('Donation not found or not claimed by this NGO.');
    }

    if (!donation.assignment) {
      throw new Error('Cannot advance stage: No volunteer is assigned to this rescue yet.');
    }

    const currentStatus = donation.status;
    let nextStatus: string;
    let assignmentStatus = donation.assignment.status;
    const assignmentUpdates: Record<string, unknown> = {};
    let isCompleted = false;

    if (currentStatus === 'VOLUNTEER_ASSIGNED') {
      nextStatus = 'PICKUP_IN_PROGRESS';
      assignmentStatus = 'STARTED';
      assignmentUpdates.startedAt = new Date();
    } else if (currentStatus === 'PICKUP_IN_PROGRESS') {
      nextStatus = 'PICKED_UP';
      assignmentStatus = 'ARRIVED';
      assignmentUpdates.pickupConfirmedAt = new Date();
    } else if (currentStatus === 'PICKED_UP') {
      nextStatus = 'DELIVERY_IN_PROGRESS';
      assignmentStatus = 'ARRIVED';
      assignmentUpdates.deliveryStartedAt = new Date();
    } else if (currentStatus === 'DELIVERY_IN_PROGRESS') {
      nextStatus = 'COMPLETED';
      assignmentStatus = 'COMPLETED';
      assignmentUpdates.deliveryConfirmedAt = new Date();
      isCompleted = true;
    } else {
      throw new Error(`Rescue is already in final state: ${currentStatus}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.volunteerAssignment.update({
        where: { id: donation.assignment!.id },
        data: {
          status: assignmentStatus as any,
          ...assignmentUpdates,
        },
      });

      await tx.donation.update({
        where: { id: donationId },
        data: {
          status: nextStatus as any,
        },
      });

      await tx.donationStatusHistory.create({
        data: {
          donationId,
          previousStatus: currentStatus,
          newStatus: nextStatus as any,
          changedBy: ngoUserId,
          reason: `Stage advanced to ${nextStatus} via Live Rescue Operations Console`,
        },
      });

      if (isCompleted) {
        const parsedQty = parseFloat(donation.quantity.replace(/[^\d.]/g, ''));
        const rawQty = isNaN(parsedQty) || parsedQty <= 0 ? 15.0 : parsedQty;

        const dynamicImpact = dynamicImpactEngine.calculateRescueImpact({
          foodWeightKg: rawQty,
          title: donation.title,
          description: donation.description,
          category: donation.foodCategory,
          vegNonVeg: donation.vegNonVegMixed,
          estimatedServings: donation.estimatedServings,
          pickupCoords:
            donation.pickupLatitude && donation.pickupLongitude
              ? { latitude: donation.pickupLatitude, longitude: donation.pickupLongitude }
              : null,
          dropoffCoords:
            ngo.baseLatitude && ngo.baseLongitude
              ? { latitude: ngo.baseLatitude, longitude: ngo.baseLongitude }
              : null,
          vehicleType: donation.assignment?.volunteer.vehicleInfo,
        });

        await tx.impactRecord.upsert({
          where: { donationId },
          update: {
            foodWeightKg: dynamicImpact.foodWeightKg,
            estimatedServings: dynamicImpact.estimatedServings,
            co2EquivalentKg: dynamicImpact.netCo2SavedKg,
            waterSavedLiters: dynamicImpact.waterSavedLiters,
            calculationMethod: dynamicImpact.calculationMethod,
            factorsUsed: dynamicImpact.factorsUsed,
          },
          create: {
            donationId,
            foodWeightKg: dynamicImpact.foodWeightKg,
            estimatedServings: dynamicImpact.estimatedServings,
            co2EquivalentKg: dynamicImpact.netCo2SavedKg,
            waterSavedLiters: dynamicImpact.waterSavedLiters,
            calculationMethod: dynamicImpact.calculationMethod,
            factorsUsed: dynamicImpact.factorsUsed,
          },
        });
      }

      await auditService.log(tx, {
        userId: ngoUserId,
        role: 'NGO',
        action: `RESCUE_STAGE_ADVANCED_${nextStatus}`,
        entityType: 'Donation',
        entityId: donationId,
        previousValues: { status: currentStatus },
        newValues: { status: nextStatus },
      });
    });

    return {
      donationId,
      previousStatus: currentStatus,
      nextStatus,
      volunteerName: donation.assignment.volunteer.name,
    };
  },

  /**
   * Seed 2-3 realistic surplus donations accepted by this NGO,
   * so the user can immediately test batch random allotment
   * and live concurrent tracking without manual steps!
   */
  async seedDemoRescuesForNgo(ngoUserId: string) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    // Find any donor profile
    let donor = await prisma.donorProfile.findFirst();
    if (!donor) {
      // Find any donor user or create one
      let donorUser = await prisma.user.findFirst({ where: { role: 'DONOR' } });
      if (!donorUser) {
        donorUser = await prisma.user.create({
          data: {
            email: `demo_donor_${Date.now()}@foodops.org`,
            phoneNumber: `+91 91000${Math.floor(10000 + Math.random() * 90000)}`,
            passwordHash: hashPassword('password'),
            role: 'DONOR',
            accountStatus: 'ACTIVE',
            verificationStatus: 'VERIFIED',
            isPhoneVerified: true,
            isEmailVerified: true,
          },
        });
      }

      donor = await prisma.donorProfile.create({
        data: {
          userId: donorUser.id,
          organizationName: 'Grand Hyatt Catering & Banquets',
          organizationType: 'CATERER',
          contactPerson: 'Arun Varma',
          address: '88, Outer Ring Road, Bellandur, Bengaluru',
          city: 'Bengaluru',
          latitude: ngo.baseLatitude + 0.015,
          longitude: ngo.baseLongitude + 0.012,
          verificationStatus: 'VERIFIED',
        },
      });
    }

    const now = new Date();
    const deadline1 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const deadline2 = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const deadline3 = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    const demoItems = [
      {
        title: '50kg Royal Dum Biryani & Mirchi Salan',
        description: 'Fresh prepared banquet feast surplus. Packed in insulated food containers.',
        foodCategory: 'COOKED_NON_VEG',
        vegNonVegMixed: 'NON_VEG',
        quantity: '50',
        quantityUnit: 'KG',
        estimatedServings: 150,
        deadline: deadline1,
        latOffset: 0.012,
        lngOffset: 0.008,
      },
      {
        title: '35kg Paneer Butter Masala & Steamed Rice',
        description: 'Corporate dinner buffet surplus. Freshly cooled and sealed.',
        foodCategory: 'COOKED_VEG',
        vegNonVegMixed: 'VEG',
        quantity: '35',
        quantityUnit: 'KG',
        estimatedServings: 100,
        deadline: deadline2,
        latOffset: -0.014,
        lngOffset: 0.015,
      },
      {
        title: '25kg Bakery Assorted Breads, Rolls & Croissants',
        description: 'Fresh evening bakery production surplus. Dry, room-temperature stable.',
        foodCategory: 'BAKERY',
        vegNonVegMixed: 'VEG',
        quantity: '25',
        quantityUnit: 'KG',
        estimatedServings: 80,
        deadline: deadline3,
        latOffset: 0.009,
        lngOffset: -0.011,
      },
    ];

    const createdDonations = [];
    for (const item of demoItems) {
      const donation = await prisma.donation.create({
        data: {
          donorId: donor.id,
          title: item.title,
          description: item.description,
          foodCategory: item.foodCategory,
          vegNonVegMixed: item.vegNonVegMixed,
          quantity: item.quantity,
          quantityUnit: item.quantityUnit,
          estimatedServings: item.estimatedServings,
          pickupAvailableAt: now,
          pickupDeadlineAt: item.deadline,
          pickupAddress: `${donor.organizationName}, Bengaluru`,
          pickupLatitude: ngo.baseLatitude + item.latOffset,
          pickupLongitude: ngo.baseLongitude + item.lngOffset,
          status: 'ACCEPTED',
          acceptedNgoId: ngo.id,
        },
      });

      await prisma.donationStatusHistory.create({
        data: {
          donationId: donation.id,
          previousStatus: 'AVAILABLE',
          newStatus: 'ACCEPTED',
          changedBy: ngoUserId,
          reason: 'Accepted by NGO for immediate volunteer dispatch',
        },
      });

      createdDonations.push(donation);
    }

    return createdDonations;
  },

  /**
   * Lightweight payload for polling live concurrent operations.
   */
  async getLiveMonitoringFeed(ngoUserId: string) {
    const ngo = await ngoRepository.findByUserId(ngoUserId);
    if (!ngo) throw new Error('NGO profile not found');

    const activeDonations = await prisma.donation.findMany({
      where: {
        acceptedNgoId: ngo.id,
        status: {
          in: [
            'ACCEPTED',
            'VOLUNTEER_ASSIGNED',
            'PICKUP_IN_PROGRESS',
            'PICKED_UP',
            'DELIVERY_IN_PROGRESS',
          ],
        },
      },
      include: {
        donor: {
          select: {
            organizationName: true,
            address: true,
            contactPerson: true,
          },
        },
        assignment: {
          include: {
            volunteer: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                vehicleInfo: true,
                operatingArea: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const donationIds = activeDonations.map((d) => d.id);

    const recentHistory = await prisma.donationStatusHistory.findMany({
      where: {
        donationId: { in: donationIds },
      },
      include: {
        donation: {
          select: { title: true },
        },
      },
      orderBy: { changedAt: 'desc' },
      take: 12,
    });

    return {
      activeDonations,
      recentEvents: recentHistory.map((h) => ({
        id: h.id,
        donationId: h.donationId,
        donationTitle: h.donation.title,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        changedAt: h.changedAt,
        reason: h.reason,
      })),
      timestamp: new Date().toISOString(),
    };
  },
};
