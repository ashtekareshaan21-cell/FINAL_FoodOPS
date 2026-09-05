'use server';

import { authService } from '@/services/authService';
import { setSession, deleteSession, getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { auditService } from '@/services/auditService';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export interface RegisterDonorInput {
  email: string;
  password?: string;
  phoneNumber: string;
  organizationName: string;
  organizationType: string;
  contactPerson: string;
  address: string;
  city?: string;
  latitude: string | number;
  longitude: string | number;
}

export async function registerDonor(formData: RegisterDonorInput) {
  try {
    const user = await authService.registerDonor(formData);
    await setSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
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
  city?: string;
  baseLatitude: string | number;
  baseLongitude: string | number;
  serviceRadiusKm?: string | number;
  availability?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  acceptedFoodTypes?: string | string[];
  contactPerson: string;
  contactPhone: string;
}

export async function registerNGO(formData: RegisterNGOInput) {
  try {
    const user = await authService.registerNGO(formData);
    await setSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
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
  city?: string;
  operatingArea?: string;
  vehicleInfo?: string;
  emergencyContact?: string;
}

export async function registerVolunteer(formData: RegisterVolunteerInput) {
  try {
    const user = await authService.registerVolunteer(formData);
    await setSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
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
  try {
    const user = await authService.login(formData);
    await setSession({
      userId: user.id,
      role: user.role,
      email: user.email,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed.';
    return { success: false, error: message };
  }
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await auditService.log(prisma, {
      userId: session.userId,
      role: session.role as UserRole,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: session.userId,
    });
  }
  await deleteSession();
  revalidatePath('/');
}
