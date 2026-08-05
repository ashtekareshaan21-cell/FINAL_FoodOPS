import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { TxOrPrisma } from './userRepository';

export const volunteerRepository = {
  async findByUserId(userId: string, tx: TxOrPrisma = prisma) {
    return tx.volunteer.findUnique({
      where: { userId },
    });
  },

  async createVolunteer(data: Prisma.VolunteerCreateInput, tx: TxOrPrisma = prisma) {
    return tx.volunteer.create({ data });
  },

  async findMany<T extends Prisma.VolunteerFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.VolunteerFindManyArgs>,
    tx: TxOrPrisma = prisma
  ) {
    return tx.volunteer.findMany(args);
  },

  async count(args?: Prisma.VolunteerCountArgs, tx: TxOrPrisma = prisma) {
    return tx.volunteer.count(args);
  },

  async findAssignmentById(id: string, tx: TxOrPrisma = prisma) {
    return tx.volunteerAssignment.findUnique({
      where: { id },
      include: { donation: true },
    });
  },

  async deleteAssignments(args: Prisma.VolunteerAssignmentDeleteManyArgs, tx: TxOrPrisma = prisma) {
    return tx.volunteerAssignment.deleteMany(args);
  },

  async createAssignment(data: Prisma.VolunteerAssignmentCreateInput, tx: TxOrPrisma = prisma) {
    return tx.volunteerAssignment.create({ data });
  },

  async findManyAssignments<T extends Prisma.VolunteerAssignmentFindManyArgs>(
    args?: Prisma.SelectSubset<T, Prisma.VolunteerAssignmentFindManyArgs>,
    tx: TxOrPrisma = prisma
  ) {
    return tx.volunteerAssignment.findMany(args);
  },

  async updateAssignment(
    id: string, 
    data: Prisma.VolunteerAssignmentUpdateInput, 
    tx: TxOrPrisma = prisma
  ) {
    return tx.volunteerAssignment.update({
      where: { id },
      data,
    });
  },
};
