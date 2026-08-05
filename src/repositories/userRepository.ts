import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export type TxOrPrisma = Prisma.TransactionClient | typeof prisma;

export const userRepository = {
  async findById(id: string, tx: TxOrPrisma = prisma) {
    return tx.user.findUnique({
      where: { id },
      include: {
        donor: true,
        ngo: true,
        volunteer: true,
        admin: true,
      },
    });
  },

  async findByEmail(email: string, tx: TxOrPrisma = prisma) {
    return tx.user.findUnique({
      where: { email },
      include: {
        donor: true,
        ngo: true,
        volunteer: true,
        admin: true,
      },
    });
  },

  async findByPhone(phoneNumber: string, tx: TxOrPrisma = prisma) {
    return tx.user.findUnique({
      where: { phoneNumber },
    });
  },

  async createUser(data: Prisma.UserCreateInput, tx: TxOrPrisma = prisma) {
    return tx.user.create({ data });
  },

  async updateLastLogin(userId: string, tx: TxOrPrisma = prisma) {
    return tx.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  async findMany(args?: Prisma.UserFindManyArgs, tx: TxOrPrisma = prisma) {
    return tx.user.findMany(args);
  },
};
