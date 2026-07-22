'use server';

import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { setSession, deleteSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function registerDonor(formData: any) {
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

    const passwordHash = hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
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
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });

      return newUser;
    });

    await setSession({ userId: user.id, role: user.role, email: user.email });
    return { success: true, role: user.role };
  } catch (error: any) {
    console.error('Donor registration error:', error);
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

export async function registerNGO(formData: any) {
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

    const passwordHash = hashPassword(password);

    const finalRegNum = registrationNumber && registrationNumber.trim() !== ''
      ? registrationNumber
      : `FSSAI-TEMP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await prisma.$transaction(async (tx) => {
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
          baseLatitude: parseFloat(baseLatitude),
          baseLongitude: parseFloat(baseLongitude),
          serviceRadiusKm: parseInt(serviceRadiusKm) || 10,
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
  } catch (error: any) {
    console.error('NGO registration error:', error);
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

export async function registerVolunteer(formData: any) {
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

    const passwordHash = hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
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
  } catch (error: any) {
    console.error('Volunteer registration error:', error);
    return { success: false, error: error.message || 'Registration failed.' };
  }
}

export async function login(formData: any) {
  const { email, password } = formData;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
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
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Login failed.' };
  }
}

export async function logout() {
  await deleteSession();
  revalidatePath('/');
}
