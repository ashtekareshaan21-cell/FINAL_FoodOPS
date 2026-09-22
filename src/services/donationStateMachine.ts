import { DonationStatus, UserRole } from '@prisma/client';

export type DonationOperation =
  | 'CLAIM'
  | 'ASSIGN_VOLUNTEER'
  | 'START_PICKUP'
  | 'CONFIRM_PICKUP'
  | 'START_DELIVERY'
  | 'CONFIRM_DELIVERY'
  | 'FORCE_EXPIRE'
  | 'DIVERT'
  | 'CANCEL'
  | 'ESCALATE'
  | 'RESOLVE_ORGANIC';

export interface TransitionContext {
  actorRole: UserRole;
  actorId: string; // User ID
  isOwner: boolean; // Computed ownership check (e.g. is the donation's accepted NGO matching the NGO of the user, etc.)
}

// Map of allowed source -> target states
const ALLOWED_TRANSITIONS: Record<DonationStatus, DonationStatus[]> = {
  AVAILABLE: ['ACCEPTED', 'EXPIRED'],
  ACCEPTED: ['VOLUNTEER_ASSIGNED', 'CANCELLED', 'EXPIRED'],
  VOLUNTEER_ASSIGNED: ['PICKUP_IN_PROGRESS', 'ACCEPTED', 'VOLUNTEER_ASSIGNED', 'CANCELLED', 'EXPIRED'], // VOLUNTEER_ASSIGNED allows direct re-assignment
  PICKUP_IN_PROGRESS: ['PICKED_UP', 'CANCELLED', 'EXPIRED'],
  PICKED_UP: ['DELIVERY_IN_PROGRESS', 'EXPIRED'],
  DELIVERY_IN_PROGRESS: ['COMPLETED', 'EXPIRED'],
  DELIVERED: ['COMPLETED'], // Fallback mapping if database has DELIVERED
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: ['RECOVERY_ESCALATED'],
  RECOVERY_ESCALATED: ['ORGANIC_RECOVERY'],
  ORGANIC_RECOVERY: [],
};

// Map of allowed operations per target state and role/ownership constraints
interface AuthConstraint {
  allowedRoles: UserRole[];
  requireOwnership: boolean;
}

const OPERATION_CONSTRAINTS: Record<DonationOperation, AuthConstraint> = {
  CLAIM: {
    allowedRoles: ['NGO', 'ADMIN'],
    requireOwnership: false, // Anyone verified NGO can claim available
  },
  ASSIGN_VOLUNTEER: {
    allowedRoles: ['NGO', 'ADMIN'],
    requireOwnership: true, // Only the accepting NGO (or ADMIN) can assign
  },
  START_PICKUP: {
    allowedRoles: ['VOLUNTEER', 'NGO', 'ADMIN'],
    requireOwnership: true, // Only assigned volunteer (or NGO/Admin)
  },
  CONFIRM_PICKUP: {
    allowedRoles: ['VOLUNTEER', 'NGO', 'ADMIN'],
    requireOwnership: true,
  },
  START_DELIVERY: {
    allowedRoles: ['VOLUNTEER', 'NGO', 'ADMIN'],
    requireOwnership: true,
  },
  CONFIRM_DELIVERY: {
    allowedRoles: ['VOLUNTEER', 'NGO', 'ADMIN'],
    requireOwnership: true,
  },
  FORCE_EXPIRE: {
    allowedRoles: ['ADMIN'],
    requireOwnership: false,
  },
  DIVERT: {
    allowedRoles: ['NGO', 'ADMIN'],
    requireOwnership: true, // Only accepting NGO or ADMIN
  },
  CANCEL: {
    allowedRoles: ['DONOR', 'NGO', 'ADMIN'],
    requireOwnership: true, // Only donor, accepting NGO, or ADMIN
  },
  ESCALATE: {
    allowedRoles: ['NGO', 'ADMIN'],
    requireOwnership: true, // Only accepting NGO (if assigned) or Admin
  },
  RESOLVE_ORGANIC: {
    allowedRoles: ['NGO', 'ADMIN'],
    requireOwnership: true,
  },
};

/**
 * Validates a donation state transition based on the transition rules and actor context.
 * Throws an error with details if the transition or actor operation is invalid.
 */
export function validateStateTransition(
  currentStatus: DonationStatus,
  targetStatus: DonationStatus,
  operation: DonationOperation,
  context: TransitionContext
): void {
  // 1. Transition Validity Check
  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTargets || !allowedTargets.includes(targetStatus)) {
    throw new Error(`INVALID_STATE_TRANSITION: Cannot transition donation from "${currentStatus}" to "${targetStatus}".`);
  }

  // 2. Actor Authorization & Ownership Checks
  const constraint = OPERATION_CONSTRAINTS[operation];
  if (!constraint) {
    throw new Error(`UNKNOWN_OPERATION: Operation "${operation}" is not defined in the state machine.`);
  }

  // Check role eligibility
  if (!constraint.allowedRoles.includes(context.actorRole)) {
    throw new Error(`UNAUTHORIZED_ROLE: Role "${context.actorRole}" is not permitted to perform "${operation}".`);
  }

  // Check ownership constraints (Admins bypass ownership checks)
  if (context.actorRole !== 'ADMIN' && constraint.requireOwnership && !context.isOwner) {
    throw new Error(`UNAUTHORIZED_OWNER: User is not authorized to perform "${operation}" on this resource (ownership required).`);
  }
}
