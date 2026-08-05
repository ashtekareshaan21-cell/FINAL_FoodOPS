'use server';

import { getSession } from '@/lib/auth';
import { volunteerRepository } from '@/repositories/volunteerRepository';
import { ngoRepository } from '@/repositories/ngoRepository';

export async function getNgoVolunteers() {
  const session = await getSession();
  if (!session || session.role !== 'NGO') {
    throw new Error('Unauthorized');
  }

  const ngo = await ngoRepository.findByUserId(session.userId);
  if (!ngo) throw new Error('NGO profile not found');

  return volunteerRepository.findMany({
    where: {
      ngoId: ngo.id,
      status: 'ACTIVE',
    },
    orderBy: { name: 'asc' },
  });
}
