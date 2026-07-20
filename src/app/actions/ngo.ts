'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getNgoVolunteers() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  const ngo = await prisma.nGOProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!ngo) throw new Error('NGO profile not found');

  return prisma.volunteer.findMany({
    where: {
      ngoId: ngo.id,
      status: 'ACTIVE',
    },
    orderBy: { name: 'asc' },
  });
}
