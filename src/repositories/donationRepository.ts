import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { TxOrPrisma } from './userRepository';

export const donationRepository = {
  async findById(id: string, tx: TxOrPrisma = prisma) {
    return tx.donation.findUnique({
      where: { id },
      include: {
        donor: {
          include: {
            user: true,
          },
        },
        acceptedNgo: {
          include: {
            user: true,
          },
        },
        assignment: {
          include: {
            volunteer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  },

  async create(data: Prisma.DonationCreateInput, tx: TxOrPrisma = prisma) {
    return tx.donation.create({ data });
  },

  async update(id: string, data: Prisma.DonationUpdateInput, tx: TxOrPrisma = prisma) {
    return tx.donation.update({
      where: { id },
      data,
    });
  },

  async findMany<T extends Prisma.DonationFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.DonationFindManyArgs>,
    tx: TxOrPrisma = prisma
  ) {
    return tx.donation.findMany(args);
  },

  async count(args?: Prisma.DonationCountArgs, tx: TxOrPrisma = prisma) {
    return tx.donation.count(args);
  },

  async createStatusHistory(
    data: Prisma.DonationStatusHistoryCreateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.donationStatusHistory.create({ data });
  },

  async createAuditLog(
    data: Prisma.AuditLogCreateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.auditLog.create({ data });
  },

  async createImpactRecord(
    data: Prisma.ImpactRecordCreateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.impactRecord.create({ data });
  },

  async aggregateImpact(
    args: Prisma.ImpactRecordAggregateArgs, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.impactRecord.aggregate(args);
  },

  async createManyNotifications(
    data: Prisma.NotificationCreateManyInput[], 
    tx: TxOrPrisma = prisma
  ) {
    return tx.notification.createMany({ data });
  },
};
