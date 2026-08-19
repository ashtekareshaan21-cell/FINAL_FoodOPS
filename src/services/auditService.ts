import { prisma } from '@/lib/db';
import { Prisma, UserRole } from '@prisma/client';

export const auditService = {
  async log(
    tx: Prisma.TransactionClient | typeof prisma,
    params: {
      userId: string | null;
      role: UserRole | null;
      action: string;
      entityType: string;
      entityId: string | null;
      previousValues?: unknown;
      newValues?: unknown;
      metadata?: string;
    }
  ) {
    const { userId, role, action, entityType, entityId, previousValues, newValues, metadata } = params;

    return tx.auditLog.create({
      data: {
        userId,
        role: role || null,
        action,
        entityType,
        entityId,
        previousValues: previousValues ? JSON.stringify(previousValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        metadata: metadata || null,
      },
    });
  },
};
