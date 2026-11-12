import { userRepository } from '@/repositories/userRepository';
import { donorRepository } from '@/repositories/donorRepository';
import { ngoRepository } from '@/repositories/ngoRepository';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { hashPassword, verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/db';
import { RegisterDonorInput, RegisterNGOInput, RegisterVolunteerInput, LoginInput } from '@/app/actions/auth';
import { auditService } from './auditService';
import crypto from 'crypto';

export const authService = {
  async registerDonor(input: RegisterDonorInput) {
    const { email, password, phoneNumber, organizationName, organizationType, contactPerson, address, city, latitude, longitude } = input;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email or Phone number already registered.');
    }

    const passwordHash = password ? hashPassword(password) : '';

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await userRepository.createUser({
        email,
        phoneNumber,
        passwordHash,
        role: 'DONOR',
        accountStatus: 'ACTIVE',
        verificationStatus: 'PENDING_VERIFICATION',
        isPhoneVerified: false,
        isEmailVerified: true,
      }, tx);

      await donorRepository.createDonorProfile({
        user: { connect: { id: newUser.id } },
        organizationName,
        organizationType,
        contactPerson,
        address,
        city: city || null,
        latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
        longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
        verificationStatus: 'PENDING_VERIFICATION',
        verificationSubmittedAt: new Date(),
      }, tx);

      await tx.verificationRequest.create({
        data: {
          userId: newUser.id,
          verificationType: 'DONOR',
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date(),
          notes: `Registration submitted for ${organizationName} (${organizationType})`,
        },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'DONOR',
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role, verificationStatus: 'PENDING_VERIFICATION' },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'DONOR',
        action: 'VERIFICATION_SUBMITTED',
        entityType: 'VerificationRequest',
        entityId: newUser.id,
      });

      return newUser;
    });

    return user;
  },

  async registerNGO(input: RegisterNGOInput) {
    const {
      email,
      password,
      phoneNumber,
      organizationName,
      registrationNumber,
      baseAddress,
      city,
      baseLatitude,
      baseLongitude,
      serviceRadiusKm,
      availability,
      acceptedFoodTypes,
      contactPerson,
      contactPhone,
    } = input;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email or Phone number already registered.');
    }

    const passwordHash = password ? hashPassword(password) : '';

    const finalRegNum = registrationNumber && registrationNumber.trim() !== ''
      ? registrationNumber
      : `FSSAI-TEMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await userRepository.createUser({
        email,
        phoneNumber,
        passwordHash,
        role: 'NGO',
        accountStatus: 'ACTIVE',
        verificationStatus: 'PENDING_VERIFICATION',
        isPhoneVerified: true,
        isEmailVerified: true,
      }, tx);

      await ngoRepository.createNGOProfile({
        user: { connect: { id: newUser.id } },
        organizationName,
        registrationNumber: finalRegNum,
        baseAddress,
        city: city || null,
        baseLatitude: typeof baseLatitude === 'string' ? parseFloat(baseLatitude) : baseLatitude,
        baseLongitude: typeof baseLongitude === 'string' ? parseFloat(baseLongitude) : baseLongitude,
        serviceRadiusKm: typeof serviceRadiusKm === 'string' ? parseInt(serviceRadiusKm) || 10 : serviceRadiusKm || 10,
        availability: availability || 'AVAILABLE',
        availabilityUpdatedAt: new Date(),
        acceptedFoodTypes: Array.isArray(acceptedFoodTypes)
          ? acceptedFoodTypes.join(',')
          : (acceptedFoodTypes || ''),
        contactPerson,
        contactPhone,
        status: 'PENDING_VERIFICATION',
        verificationSubmittedAt: new Date(),
      }, tx);

      await tx.verificationRequest.create({
        data: {
          userId: newUser.id,
          verificationType: 'NGO',
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date(),
          notes: `NGO Registration submitted for ${organizationName} (Reg: ${finalRegNum})`,
        },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'NGO',
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role, verificationStatus: 'PENDING_VERIFICATION' },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'NGO',
        action: 'VERIFICATION_SUBMITTED',
        entityType: 'VerificationRequest',
        entityId: newUser.id,
      });

      return newUser;
    });

    return user;
  },

  async registerVolunteer(input: RegisterVolunteerInput) {
    const { email, password, phoneNumber, name, ngoId, city, operatingArea, vehicleInfo, emergencyContact } = input;

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email or Phone number already registered.');
    }

    const passwordHash = password ? hashPassword(password) : '';

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await userRepository.createUser({
        email,
        phoneNumber,
        passwordHash,
        role: 'VOLUNTEER',
        accountStatus: 'ACTIVE',
        verificationStatus: 'PENDING_VERIFICATION',
        isPhoneVerified: true,
        isEmailVerified: true,
      }, tx);

      await volunteerRepository.createVolunteer({
        user: { connect: { id: newUser.id } },
        ngo: { connect: { id: ngoId } },
        name,
        phoneNumber,
        city: city || null,
        operatingArea: operatingArea || null,
        vehicleInfo: vehicleInfo || null,
        emergencyContact: emergencyContact || null,
        status: 'ACTIVE',
        verificationStatus: 'PENDING_VERIFICATION',
      }, tx);

      await tx.verificationRequest.create({
        data: {
          userId: newUser.id,
          verificationType: 'VOLUNTEER',
          status: 'PENDING_VERIFICATION',
          submittedAt: new Date(),
          notes: `Volunteer Registration submitted for ${name}`,
        },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'VOLUNTEER',
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role, verificationStatus: 'PENDING_VERIFICATION' },
      });

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'VOLUNTEER',
        action: 'VERIFICATION_SUBMITTED',
        entityType: 'VerificationRequest',
        entityId: newUser.id,
      });

      return newUser;
    });

    return user;
  },

  async seedDemoAccounts() {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
      throw new Error('Demo seeding is disabled outside demo mode.');
    }

    const demoPasswordHash = hashPassword(
      process.env.DEMO_SEED_PASSWORD || crypto.randomBytes(24).toString('hex')
    );
    const adminPasswordHash = hashPassword(
      process.env.ADMIN_SEED_PASSWORD || crypto.randomBytes(24).toString('hex')
    );

    // 1. Admin
    const adminUser = await prisma.user.upsert({
      where: { email: 'ADMIN_FOODOPS' },
      update: { role: 'ADMIN', passwordHash: adminPasswordHash },
      create: {
        email: 'ADMIN_FOODOPS',
        phoneNumber: '+91 9999999999',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });
    await prisma.adminProfile.upsert({
      where: { userId: adminUser.id },
      update: { name: 'Admin Coordinator' },
      create: { userId: adminUser.id, name: 'Admin Coordinator', adminLevel: 2 },
    });

    // Also upsert legacy admin email
    await prisma.user.upsert({
      where: { email: 'admin@foodops.org' },
      update: { role: 'ADMIN', passwordHash: adminPasswordHash },
      create: {
        email: 'admin@foodops.org',
        phoneNumber: '+91 9999999998',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    // 2. Donor
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
    const donorProfile = await prisma.donorProfile.upsert({
      where: { userId: donorUser.id },
      update: {
        organizationName: 'Sample Banquet Kitchen',
        organizationType: 'CATERER',
        contactPerson: 'Rahul Sharma',
        address: 'Sector 1, Pune, Maharashtra',
        city: 'Pune',
        latitude: 18.5204,
        longitude: 73.8567,
        verificationStatus: 'VERIFIED',
      },
      create: {
        userId: donorUser.id,
        organizationName: 'Sample Banquet Kitchen',
        organizationType: 'CATERER',
        contactPerson: 'Rahul Sharma',
        address: 'Sector 1, Pune, Maharashtra',
        city: 'Pune',
        latitude: 18.5204,
        longitude: 73.8567,
        verificationStatus: 'VERIFIED',
      },
    });

    // 3. NGO 1
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
        baseAddress: 'Shivajinagar Area, Pune, Maharashtra',
        city: 'Pune',
        baseLatitude: 18.5308,
        baseLongitude: 73.8475,
        serviceRadiusKm: 15,
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
        baseAddress: 'Shivajinagar Area, Pune, Maharashtra',
        city: 'Pune',
        baseLatitude: 18.5308,
        baseLongitude: 73.8475,
        serviceRadiusKm: 15,
        availability: 'AVAILABLE',
        acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
        contactPerson: 'Preeti Nair',
        contactPhone: '+91 9876543221',
      },
    });

    // 4. NGO 2
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
        baseAddress: 'Nigdi Area, Pimpri-Chinchwad, Maharashtra',
        city: 'Pimpri-Chinchwad',
        baseLatitude: 18.6492,
        baseLongitude: 73.7707,
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
        baseAddress: 'Nigdi Area, Pimpri-Chinchwad, Maharashtra',
        city: 'Pimpri-Chinchwad',
        baseLatitude: 18.6492,
        baseLongitude: 73.7707,
        serviceRadiusKm: 10,
        availability: 'AVAILABLE',
        acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
        contactPerson: 'Anwar Ali',
        contactPhone: '+91 9876543222',
      },
    });

    // 5. NGO 3 / NGO Pending
    for (const pendingEmail of ['ngo3@foodops.org', 'ngo_pending@foodops.org']) {
      const ngo3User = await prisma.user.upsert({
        where: { email: pendingEmail },
        update: { role: 'NGO', verificationStatus: 'PENDING_VERIFICATION', accountStatus: 'ACTIVE' },
        create: {
          email: pendingEmail,
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
          organizationName: `Care & Share Society (${pendingEmail})`,
          registrationNumber: `FSSAI-${pendingEmail}`,
          status: 'PENDING_VERIFICATION',
          baseAddress: 'Kothrud Area, Pune, Maharashtra',
          city: 'Pune',
          baseLatitude: 18.5074,
          baseLongitude: 73.8077,
          serviceRadiusKm: 10,
          availability: 'AVAILABLE',
          acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
          contactPerson: 'David Miller',
          contactPhone: '+91 9876543223',
        },
        create: {
          userId: ngo3User.id,
          organizationName: `Care & Share Society (${pendingEmail})`,
          registrationNumber: `FSSAI-${pendingEmail}`,
          status: 'PENDING_VERIFICATION',
          baseAddress: 'Kothrud Area, Pune, Maharashtra',
          city: 'Pune',
          baseLatitude: 18.5074,
          baseLongitude: 73.8077,
          serviceRadiusKm: 10,
          availability: 'AVAILABLE',
          acceptedFoodTypes: 'COOKED_VEG,COOKED_NON_VEG,PACKAGED_FOOD,DRY_RATION,BAKERY,FRUITS_VEG',
          contactPerson: 'David Miller',
          contactPhone: '+91 9876543223',
        },
      });
    }

    // 6. Volunteer
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

    // 7. Seed active demo surplus donation so emulation is immediately ready
    const existingActiveDonation = await prisma.donation.findFirst({
      where: {
        donorId: donorProfile.id,
        status: 'AVAILABLE',
      },
    });

    if (!existingActiveDonation) {
      await prisma.donation.create({
        data: {
          donorId: donorProfile.id,
          title: 'Veg Biryani - Sample Catering Surplus',
          description: 'Freshly prepared vegetarian catering surplus in sealed containers (sample walkthrough listing).',
          foodCategory: 'COOKED_VEG',
          vegNonVegMixed: 'VEG',
          quantity: '25',
          quantityUnit: 'kg',
          estimatedServings: 50,
          status: 'AVAILABLE',
          pickupAddress: donorProfile.address,
          pickupLatitude: donorProfile.latitude,
          pickupLongitude: donorProfile.longitude,
          pickupAvailableAt: new Date(),
          pickupDeadlineAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });
    }
  },

  async demoLogin(email: string) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      throw new Error('Demo login is disabled.');
    }
    const allowedDemoEmails = ['donor@foodops.org', 'ngo1@foodops.org', 'volunteer@foodops.org'];
    const trimmedInput = (email || '').trim();
    if (!allowedDemoEmails.includes(trimmedInput)) {
      throw new Error('Sample account is not available for walkthrough sign-in.');
    }

    let user = await userRepository.findByEmail(trimmedInput);
    if (!user) {
      await this.seedDemoAccounts();
      user = await userRepository.findByEmail(trimmedInput);
    }
    if (!user) {
      throw new Error('Sample account unavailable.');
    }

    await userRepository.updateLastLogin(user.id);
    await auditService.log(prisma, {
      userId: user.id,
      role: user.role,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      newValues: { lastLoginAt: new Date(), mode: 'demo' },
    });

    return user;
  },

  async login(input: LoginInput) {
    const { email, password } = input;
    const trimmedInput = (email || '').trim();

    const user = await userRepository.findByEmail(trimmedInput);

    if (!user || !user.passwordHash || !password) {
      throw new Error('Invalid email or password.');
    }

    const isValid = verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    await userRepository.updateLastLogin(user.id);
    
    await auditService.log(prisma, {
      userId: user.id,
      role: user.role,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      newValues: { lastLoginAt: new Date() },
    });

    return user;
  },

  async sendDonorPhoneOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    // Check rate limiting: existing active OTP within last 60 seconds
    const existing = await prisma.oTPAttempt.findFirst({
      where: {
        userId,
        purpose: 'DONOR_PHONE_VERIFICATION',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      throw new Error('Please wait 60 seconds before requesting another OTP.');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    await prisma.oTPAttempt.create({
      data: {
        userId,
        otp,
        purpose: 'DONOR_PHONE_VERIFICATION',
        expiresAt,
      },
    });

    await auditService.log(prisma, {
      userId,
      role: user.role,
      action: 'DONOR_PHONE_OTP_SENT',
      entityType: 'User',
      entityId: userId,
    });

    return {
      success: true,
      message: `OTP code sent to ${user.phoneNumber}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  },

  async verifyDonorPhoneOtp(userId: string, otpInput: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const attempt = await prisma.oTPAttempt.findFirst({
      where: {
        userId,
        purpose: 'DONOR_PHONE_VERIFICATION',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!attempt) {
      throw new Error('OTP expired or not found. Please request a new code.');
    }

    if (attempt.attemptCount >= 5) {
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    // Increment attempt count
    await prisma.oTPAttempt.update({
      where: { id: attempt.id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    if (attempt.otp !== otpInput.trim()) {
      throw new Error('Invalid OTP code.');
    }

    // Mark attempt as used and verify user's phone
    await prisma.oTPAttempt.update({
      where: { id: attempt.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true },
    });

    await auditService.log(prisma, {
      userId,
      role: user.role,
      action: 'DONOR_PHONE_VERIFIED',
      entityType: 'User',
      entityId: userId,
    });

    return { success: true };
  },
};
