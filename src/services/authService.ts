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
    const { email, password, phoneNumber, organizationName, organizationType, contactPerson, address, latitude, longitude } = input;

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
        isPhoneVerified: true,
        isEmailVerified: true,
      }, tx);

      await donorRepository.createDonorProfile({
        user: { connect: { id: newUser.id } },
        organizationName,
        organizationType,
        contactPerson,
        address,
        latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
        longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
      }, tx);

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'DONOR',
        action: 'REGISTER',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role },
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
        isPhoneVerified: true,
        isEmailVerified: true,
      }, tx);

      await ngoRepository.createNGOProfile({
        user: { connect: { id: newUser.id } },
        organizationName,
        registrationNumber: finalRegNum,
        baseAddress,
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
      }, tx);

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'NGO',
        action: 'REGISTER',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role },
      });

      return newUser;
    });

    return user;
  },

  async registerVolunteer(input: RegisterVolunteerInput) {
    const { email, password, phoneNumber, name, ngoId } = input;

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
        isPhoneVerified: true,
        isEmailVerified: true,
      }, tx);

      await volunteerRepository.createVolunteer({
        user: { connect: { id: newUser.id } },
        ngo: { connect: { id: ngoId } },
        name,
        phoneNumber,
        status: 'ACTIVE',
      }, tx);

      await auditService.log(tx, {
        userId: newUser.id,
        role: 'VOLUNTEER',
        action: 'REGISTER',
        entityType: 'User',
        entityId: newUser.id,
        newValues: { email: newUser.email, role: newUser.role },
      });

      return newUser;
    });

    return user;
  },

  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await userRepository.findByEmail(email);
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
