import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { TxOrPrisma } from './userRepository';

export const donorRepository = {
  async findByUserId(userId: string, tx: TxOrPrisma = prisma) {
    return tx.donorProfile.findUnique({
      where: { userId },
    });
  },

  async createDonorProfile(data: Prisma.DonorProfileCreateInput, tx: TxOrPrisma = prisma) {
    return tx.donorProfile.create({ data });
  },

  async findMany<T extends Prisma.DonorProfileFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.DonorProfileFindManyArgs>,
    tx: TxOrPrisma = prisma
  ) {
    return tx.donorProfile.findMany(args);
  },

  async count(args?: Prisma.DonorProfileCountArgs, tx: TxOrPrisma = prisma) {
    return tx.donorProfile.count(args);
  },
};
