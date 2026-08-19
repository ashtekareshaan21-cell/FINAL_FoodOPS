import { prisma } from '@/lib/db';
import { calculateDistance, matchFoodCategory } from './matchingService';

export interface NgoMatchDiagnostic {
  ngoId: string;
  ngoName: string;
  ngoCoordinates: { latitude: number; longitude: number };
  donationCoordinates: { latitude: number; longitude: number };
  calculatedDistanceKm: number;
  serviceRadiusKm: number;
  distanceStatus: 'PASS' | 'FAIL';
  verificationStatus: string;
  availability: string;
  foodCompatibility: 'MATCH' | 'MISMATCH';
  capacity: string; // Returns 'N/A' since there is no capacity field in the DB schema
  deadlineStatus: 'VALID' | 'EXPIRED';
  finalEligibility: 'ELIGIBLE' | 'REJECTED';
  rejectionReason: string;
}

export const matchingDiagnosticsService = {
  async traceDonationMatches(donationId: string): Promise<NgoMatchDiagnostic[]> {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      throw new Error(`Donation not found: ${donationId}`);
    }

    const ngos = await prisma.nGOProfile.findMany({
      include: { user: true },
    });

    const now = new Date();
    const isExpired = now > new Date(donation.pickupDeadlineAt);
    const deadlineStatus = isExpired ? 'EXPIRED' : 'VALID';

    return ngos.map((ngo) => {
      // 1. Calculate Distance
      const distanceKm = calculateDistance(
        donation.pickupLatitude,
        donation.pickupLongitude,
        ngo.baseLatitude,
        ngo.baseLongitude
      );
      const distancePassed = distanceKm <= ngo.serviceRadiusKm;
      const distanceStatus = distancePassed ? 'PASS' : 'FAIL';

      // 2. Verification status check
      const verificationPassed = ngo.status === 'VERIFIED';

      // 3. Availability check
      const availabilityPassed = ngo.availability === 'AVAILABLE';

      // 4. Food compatibility check
      const foodPassed = matchFoodCategory(
        donation.foodCategory,
        donation.vegNonVegMixed,
        ngo.acceptedFoodTypes
      );

      // Determine final eligibility and reason
      const reasons: string[] = [];
      if (!verificationPassed) {
        reasons.push('NGO_NOT_VERIFIED');
      }
      if (!availabilityPassed) {
        reasons.push('NGO_OFFLINE_OR_BUSY');
      }
      if (!distancePassed) {
        reasons.push('NGO_OUTSIDE_SERVICE_RADIUS');
      }
      if (!foodPassed) {
        reasons.push('FOOD_CATEGORY_MISMATCH');
      }
      if (isExpired) {
        reasons.push('DONATION_EXPIRED');
      }

      const finalEligibility = reasons.length === 0 ? 'ELIGIBLE' : 'REJECTED';
      const rejectionReason = reasons.length === 0 ? 'NONE' : reasons.join('; ');

      return {
        ngoId: ngo.id,
        ngoName: ngo.organizationName,
        ngoCoordinates: { latitude: ngo.baseLatitude, longitude: ngo.baseLongitude },
        donationCoordinates: { latitude: donation.pickupLatitude, longitude: donation.pickupLongitude },
        calculatedDistanceKm: parseFloat(distanceKm.toFixed(2)),
        serviceRadiusKm: ngo.serviceRadiusKm,
        distanceStatus,
        verificationStatus: ngo.status,
        availability: ngo.availability,
        foodCompatibility: foodPassed ? 'MATCH' : 'MISMATCH',
        capacity: 'N/A', // No field in DB schema
        deadlineStatus,
        finalEligibility,
        rejectionReason,
      };
    });
  },
};
