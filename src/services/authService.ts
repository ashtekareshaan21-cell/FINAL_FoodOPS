import { userRepository } from '@/repositories/userRepository';
import { donorRepository } from '@/repositories/donorRepository';
import { ngoRepository } from '@/repositories/ngoRepository';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { hashPassword, verifyPassword } from '@/lib/password';
import { prisma } from '@/lib/db';
import { RegisterDonorInput, RegisterNGOInput, RegisterVolunteerInput, LoginInput } from '@/app/actions/auth';
import { auditService } from './auditService';

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
        isPhoneVerified: true,
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
    const demoPasswordHash = hashPassword('password');

    // 1. Admin
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
      create: { userId: adminUser.id, name: 'Admin Coordinator', adminLevel: 2 },
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
          organizationName: `Care & Share Society (${pendingEmail})`,
          registrationNumber: `FSSAI-${pendingEmail}`,
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
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    const demoEmails = [
      'donor@foodops.org',
      'ngo1@foodops.org',
      'ngo2@foodops.org',
      'ngo3@foodops.org',
      'ngo_pending@foodops.org',
      'volunteer@foodops.org',
      'admin@foodops.org',
    ];

    let user = await userRepository.findByEmail(email);
    if (!user && demoEmails.includes(email)) {
      try {
        await this.seedDemoAccounts();
        user = await userRepository.findByEmail(email);
      } catch (err) {
        console.error('Auto seed demo accounts failed:', err);
      }
    }

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
};
