'use server';

import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { setSession, deleteSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export interface RegisterDonorInput {
  email: string;
  password?: string;
  phoneNumber: string;
  organizationName: string;
  organizationType: string;
  contactPerson: string;
  address: string;
  latitude: string | number;
  longitude: string | number;
}

export async function registerDonor(formData: RegisterDonorInput) {
  const { email, password, phoneNumber, organizationName, organizationType, contactPerson, address, latitude, longitude } = formData;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      return { success: false, error: 'Email or Phone number already registered.' };
    }

    const passwordHash = password ? hashPassword(password) : '';

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash,
          role: 'DONOR',
          isPhoneVerified: true, // Auto-verify for hackathon convenience
          isEmailVerified: true,
        },
      });

      await tx.donorProfile.create({
        data: {
          userId: newUser.id,
          organizationName,
          organizationType,
          contactPerson,
          address,
          latitude: typeof latitude === 'string' ? parseFloat(latitude) : latitude,
          longitude: typeof longitude === 'string' ? parseFloat(longitude) : longitude,
        },
      });

      return newUser;
    });

    await setSession({ userId: user.id, role: user.role, email: user.email });
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Donor registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return { success: false, error: message };
  }
}


export interface RegisterNGOInput {
  email: string;
  password?: string;
  phoneNumber: string;
  organizationName: string;
  registrationNumber?: string;
  baseAddress: string;
  baseLatitude: string | number;
  baseLongitude: string | number;
  serviceRadiusKm?: string | number;
  availability?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  acceptedFoodTypes?: string | string[];
  contactPerson: string;
  contactPhone: string;
}

export async function registerNGO(formData: RegisterNGOInput) {
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
  } = formData;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      return { success: false, error: 'Email or Phone number already registered.' };
    }

    const passwordHash = password ? hashPassword(password) : '';

    const finalRegNum = registrationNumber && registrationNumber.trim() !== ''
      ? registrationNumber
      : `FSSAI-TEMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash,
          role: 'NGO',
          isPhoneVerified: true,
          isEmailVerified: true,
        },
      });

      await tx.nGOProfile.create({
        data: {
          userId: newUser.id,
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
          status: 'VERIFIED', // NGOs start verified directly now
        },
      });

      return newUser;
    });

    await setSession({ userId: user.id, role: user.role, email: user.email });
    return { success: true, role: user.role };
  } catch (error) {
    console.error('NGO registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return { success: false, error: message };
  }
}

export interface RegisterVolunteerInput {
  email: string;
  password?: string;
  phoneNumber: string;
  name: string;
  ngoId: string;
}

export async function registerVolunteer(formData: RegisterVolunteerInput) {
  const { email, password, phoneNumber, name, ngoId } = formData;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      return { success: false, error: 'Email or Phone number already registered.' };
    }

    const passwordHash = password ? hashPassword(password) : '';

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash,
          role: 'VOLUNTEER',
          isPhoneVerified: true,
          isEmailVerified: true,
        },
      });

      await tx.volunteer.create({
        data: {
          userId: newUser.id,
          ngoId,
          name,
          phoneNumber,
          status: 'ACTIVE',
        },
      });

      return newUser;
    });

    await setSession({ userId: user.id, role: user.role, email: user.email });
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Volunteer registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return { success: false, error: message };
  }
}

export interface LoginInput {
  email: string;
  password?: string;
}

export async function login(formData: LoginInput) {
  const { email, password } = formData;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash || !password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await setSession({ userId: user.id, role: user.role, email: user.email });
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed.';
    return { success: false, error: message };
  }
}

export async function logout() {
  await deleteSession();
  revalidatePath('/');
}
