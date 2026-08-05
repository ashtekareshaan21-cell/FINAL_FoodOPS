import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { TxOrPrisma } from './userRepository';

export const ngoRepository = {
  async findByUserId(userId: string, tx: TxOrPrisma = prisma) {
    return tx.nGOProfile.findUnique({
      where: { userId },
    });
  },

  async findById(id: string, tx: TxOrPrisma = prisma) {
    return tx.nGOProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  async createNGOProfile(data: Prisma.NGOProfileCreateInput, tx: TxOrPrisma = prisma) {
    return tx.nGOProfile.create({ data });
  },

  async updateSettings(
    userId: string, 
    data: Prisma.NGOProfileUpdateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.nGOProfile.update({
      where: { userId },
      data,
    });
  },

  async updateStatus(
    ngoId: string, 
    data: Prisma.NGOProfileUpdateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.nGOProfile.update({
      where: { id: ngoId },
      data,
    });
  },

  async findMany<T extends Prisma.NGOProfileFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.NGOProfileFindManyArgs>,
    tx: TxOrPrisma = prisma
  ) {
    return tx.nGOProfile.findMany(args);
  },

  async count(args?: Prisma.NGOProfileCountArgs, tx: TxOrPrisma = prisma) {
    return tx.nGOProfile.count(args);
  },
};
