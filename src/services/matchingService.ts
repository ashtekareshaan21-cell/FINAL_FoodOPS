import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  crossesMeridian: boolean;
  minLng2?: number;
  maxLng2?: number;
}

export interface MatchResult {
  donationId: string;
  title: string;
  distanceKm: number;
  checks: {
    statusPassed: boolean;
    distancePassed: boolean;
    categoryPassed: boolean;
    expiryPassed: boolean;
    ngoStatusPassed: boolean;
    ngoAvailabilityPassed: boolean;
  };
  reasons: string[];
  result: boolean;
  score: number;
}

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates a bounding box around a point given a radius in kilometers.
 * Handles latitude clamping and 180th meridian wrap-around.
 */
export function calculateBoundingBox(latitude: number, longitude: number, radiusKm: number): BoundingBox {
  const EARTH_RADIUS_KM = 6371;
  const kmPerDegreeLat = (2 * Math.PI * EARTH_RADIUS_KM) / 360; // ~111.1949
  const latChange = radiusKm / kmPerDegreeLat;

  let minLat = latitude - latChange;
  let maxLat = latitude + latChange;

  // Clamp latitude to [-90, 90]
  if (minLat < -90) minLat = -90;
  if (maxLat > 90) maxLat = 90;

  // Near the poles: return full longitude bounds to avoid issues
  if (Math.abs(latitude) > 89.9) {
    return { minLat, maxLat, minLng: -180, maxLng: 180, crossesMeridian: false };
  }

  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const kmPerDegreeLng = kmPerDegreeLat * cosLat;
  const lngChange = radiusKm / kmPerDegreeLng;

  let minLng = longitude - lngChange;
  let maxLng = longitude + lngChange;

  let crossesMeridian = false;
  let minLng2: number | undefined;
  let maxLng2: number | undefined;

  // Handle wraps
  if (minLng < -180) {
    crossesMeridian = true;
    minLng2 = minLng + 360;
    maxLng2 = 180;
    minLng = -180;
  } else if (maxLng > 180) {
    crossesMeridian = true;
    minLng2 = -180;
    maxLng2 = maxLng - 360;
    maxLng = 180;
  }

  return { minLat, maxLat, minLng, maxLng, crossesMeridian, minLng2, maxLng2 };
}

/**
 * Normalizes input food category strings into canonical keys.
 * Maps casing, plurals, whitespaces, and synonyms correctly.
 */
export function normalizeFoodCategory(category: string): string {
  if (!category) return 'mixed';
  const c = category.trim().toLowerCase();

  // Mixed/Prepared Meals: mixed, mixed/prepared meals, prepared meals, cooked food, cooked meal, biryani, curry, khichdi
  // Evaluated first so prepared meals with rice/grains/meat map to mixed/prepared instead of raw ingredients.
  if (c.includes('mixed') || c.includes('prepared') || c.includes('cooked') || c.includes('meal') || c.includes('biryani') || c.includes('curry') || c.includes('khichdi')) {
    return 'mixed';
  }
  // Bakery: bakery, Bakery, BAKERY, Bakery Items, bread, pastry, pastries, cakes
  if (c.includes('bakery') || c.includes('bread') || c.includes('pastr') || c.includes('cake')) {
    return 'bakery';
  }
  // Grains: grains, rice, grains/rice, dry food, dry ration, wheat, flour
  if (c.includes('grain') || c.includes('rice') || c.includes('dry') || c.includes('ration') || c.includes('wheat') || c.includes('flour')) {
    return 'grains';
  }
  // Vegetables: vegetables, vegetables/salad, salad
  if (c.includes('veg') && (c.includes('table') || c.includes('salad'))) {
    return 'vegetables';
  }
  // Fruits
  if (c.includes('fruit')) {
    return 'fruits';
  }
  // Dairy: dairy, dairy products, milk, cheese, butter, yogurt, curd
  if (c.includes('dairy') || c.includes('milk') || c.includes('cheese') || c.includes('butter') || c.includes('yogurt') || c.includes('curd')) {
    return 'dairy';
  }
  // Meat: meat, meat/protein, protein, chicken, fish, egg, eggs, beef, pork, mutton
  if (c.includes('meat') || c.includes('protein') || c.includes('chicken') || c.includes('fish') || c.includes('egg') || c.includes('beef') || c.includes('pork') || c.includes('mutton')) {
    return 'meat';
  }

  const knownCategories = ['mixed', 'grains', 'bakery', 'vegetables', 'fruits', 'dairy', 'meat'];
  if (knownCategories.includes(c)) return c;

  return 'mixed';
}

/**
 * Checks if a donation's category and dietary requirements match the NGO's accepted food types.
 */
export function matchFoodCategory(
  donationCategory: string,
  donationDietary: string,
  ngoAcceptedTypesStr: string
): boolean {
  if (!ngoAcceptedTypesStr) return false;

  const acceptedTypes = ngoAcceptedTypesStr
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const normalizedCategory = normalizeFoodCategory(donationCategory);
  const dietary = (donationDietary || '').toUpperCase();

  if (normalizedCategory === 'mixed') {
    if (dietary === 'VEG') {
      return acceptedTypes.includes('COOKED_VEG');
    } else {
      return acceptedTypes.includes('COOKED_NON_VEG');
    }
  }

  if (normalizedCategory === 'grains') {
    return acceptedTypes.includes('DRY_RATION') || acceptedTypes.includes('PACKAGED_FOOD');
  }

  if (normalizedCategory === 'vegetables' || normalizedCategory === 'fruits') {
    return acceptedTypes.includes('FRUITS_VEG');
  }

  if (normalizedCategory === 'dairy') {
    return acceptedTypes.includes('PACKAGED_FOOD') || acceptedTypes.includes('COOKED_VEG') || acceptedTypes.includes('COOKED_NON_VEG');
  }

  if (normalizedCategory === 'meat') {
    return acceptedTypes.includes('COOKED_NON_VEG');
  }

  if (normalizedCategory === 'bakery') {
    return acceptedTypes.includes('BAKERY') || acceptedTypes.includes('PACKAGED_FOOD');
  }

  return false;
}

/**
 * Validates basic donation status and expiry.
 */
export function validateDonation(donation: { status: string; pickupDeadlineAt: Date }): { isValid: boolean; reason?: string } {
  if (donation.status !== 'AVAILABLE') {
    return { isValid: false, reason: `Donation is not AVAILABLE (status: ${donation.status})` };
  }
  const isExpired = new Date() > new Date(donation.pickupDeadlineAt);
  if (isExpired) {
    return { isValid: false, reason: `Donation expired at ${donation.pickupDeadlineAt.toISOString()}` };
  }
  return { isValid: true };
}

/**
 * Validates NGO status and availability.
 */
export function validateNgo(ngo: { status: string; availability: string }): { isValid: boolean; reason?: string } {
  if (ngo.status !== 'VERIFIED') {
    return { isValid: false, reason: `NGO account is not VERIFIED (status: ${ngo.status})` };
  }
  if (ngo.availability !== 'AVAILABLE') {
    return { isValid: false, reason: `NGO status is not AVAILABLE (availability: ${ngo.availability})` };
  }
  return { isValid: true };
}

/**
 * Evaluates all matching criteria between a donation and an NGO, returning full details.
 */
export function matchDonationToNgo(
  donation: {
    id: string;
    title: string;
    status: string;
    foodCategory: string;
    vegNonVegMixed: string;
    pickupDeadlineAt: Date;
    pickupLatitude: number;
    pickupLongitude: number;
    estimatedServings?: number | null;
    createdAt?: Date;
  },
  ngo: {
    status: string;
    availability: string;
    acceptedFoodTypes: string;
    baseLatitude: number;
    baseLongitude: number;
    serviceRadiusKm: number;
  }
): MatchResult {
  const statusPassed = donation.status === 'AVAILABLE';
  const hasExpiry = donation.pickupDeadlineAt instanceof Date || (typeof donation.pickupDeadlineAt === 'string' && !isNaN(Date.parse(donation.pickupDeadlineAt)));
  const expiryPassed = hasExpiry ? new Date() <= new Date(donation.pickupDeadlineAt) : false;
  const ngoStatusPassed = ngo.status === 'VERIFIED';
  const ngoAvailabilityPassed = ngo.availability === 'AVAILABLE';

  let distanceKm = 0;
  let distancePassed = false;
  if (
    donation.pickupLatitude !== null &&
    donation.pickupLongitude !== null &&
    ngo.baseLatitude !== null &&
    ngo.baseLongitude !== null
  ) {
    distanceKm = calculateDistance(
      donation.pickupLatitude,
      donation.pickupLongitude,
      ngo.baseLatitude,
      ngo.baseLongitude
    );
    distancePassed = distanceKm <= ngo.serviceRadiusKm;
  }

  const categoryPassed = matchFoodCategory(
    donation.foodCategory,
    donation.vegNonVegMixed,
    ngo.acceptedFoodTypes
  );

  const reasons: string[] = [];
  if (!statusPassed) reasons.push(`Donation is not AVAILABLE (status: ${donation.status})`);
  if (!expiryPassed) {
    const timeStr = donation.pickupDeadlineAt instanceof Date 
      ? donation.pickupDeadlineAt.toISOString() 
      : donation.pickupDeadlineAt 
        ? String(donation.pickupDeadlineAt) 
        : 'N/A';
    reasons.push(`Donation deadline has expired (expired at ${timeStr})`);
  }
  if (!ngoStatusPassed) reasons.push(`NGO is not VERIFIED (status: ${ngo.status})`);
  if (!ngoAvailabilityPassed) reasons.push(`NGO is not AVAILABLE (availability: ${ngo.availability})`);
  if (!distancePassed) {
    reasons.push(
      `Outside service radius: distance ${distanceKm.toFixed(2)} km > radius ${ngo.serviceRadiusKm} km`
    );
  }
  if (!categoryPassed) {
    reasons.push(
      `Category mismatch: category "${donation.foodCategory}" (${donation.vegNonVegMixed}) is not accepted by accepted food types "${ngo.acceptedFoodTypes}"`
    );
  }

  const result =
    statusPassed &&
    expiryPassed &&
    ngoStatusPassed &&
    ngoAvailabilityPassed &&
    distancePassed &&
    categoryPassed;

  // Compute matching score out of 100 if eligible, else 0
  let score = 0;
  if (result) {
    // 1. Proximity score (Max 25 points)
    const distanceScore = ngo.serviceRadiusKm > 0 
      ? Math.max(0, 25 * (1 - distanceKm / ngo.serviceRadiusKm)) 
      : 25;

    // 2. Compatibility score (Max 25 points)
    const compatibilityScore = categoryPassed ? 25 : 0;

    // 3. Availability score (Max 20 points)
    const availabilityScore = ngo.availability === 'AVAILABLE' ? 20 : 0;

    // 4. Capacity score (Max 15 points) - default limit 200 servings
    const defaultCapacity = 200;
    const servings = donation.estimatedServings || 30;
    const capacityScore = servings <= defaultCapacity 
      ? 15 
      : Math.max(0, 15 * (1 - (servings - defaultCapacity) / defaultCapacity));

    // 5. Urgency score (Max 15 points) - higher score for closer deadlines (under 12 hours)
    const timeLeftMs = new Date(donation.pickupDeadlineAt).getTime() - Date.now();
    const timeLeftHours = Math.max(0, timeLeftMs / (1000 * 60 * 60));
    const urgencyScore = timeLeftHours <= 1 
      ? 15 
      : Math.max(0, 15 * (1 - (timeLeftHours - 1) / 11));

    score = Math.round(distanceScore + compatibilityScore + availabilityScore + capacityScore + urgencyScore);
  }

  if (!result) {
    console.log(
      `[MatchingService] Match REJECTED - Donation: "${donation.title}" (${donation.id}), NGO: "${ngo.status === 'VERIFIED' ? 'Verified NGO' : 'Unverified'}" (status: ${ngo.status}, availability: ${ngo.availability}). Distance: ${distanceKm.toFixed(2)} km (radius limit: ${ngo.serviceRadiusKm} km). Category: "${donation.foodCategory}" (${donation.vegNonVegMixed}). Reasons: [${reasons.join('; ')}]`
    );
  } else {
    console.log(
      `[MatchingService] Match SUCCESS - Donation: "${donation.title}" (${donation.id}), NGO: (status: ${ngo.status}, availability: ${ngo.availability}). Distance: ${distanceKm.toFixed(2)} km. Score: ${score}`
    );
  }

  return {
    donationId: donation.id,
    title: donation.title,
    distanceKm,
    checks: {
      statusPassed,
      distancePassed,
      categoryPassed,
      expiryPassed,
      ngoStatusPassed,
      ngoAvailabilityPassed,
    },
    reasons,
    result,
    score,
  };
}

export const matchingService = {
  calculateDistance,
  calculateBoundingBox,
  normalizeFoodCategory,
  matchFoodCategory,
  validateDonation,
  validateNgo,
  matchDonationToNgo,

  /**
   * Returns a list of nearby, available matching donations for an NGO.
   */
  async getNearbyAvailableDonations(ngoUserId: string) {
    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: ngoUserId },
    });
    if (!ngo) throw new Error('NGO profile not found');
    if (ngo.status !== 'VERIFIED' || ngo.availability !== 'AVAILABLE') {
      return [];
    }

    const bbox = calculateBoundingBox(ngo.baseLatitude, ngo.baseLongitude, ngo.serviceRadiusKm);

    const whereClause: Prisma.DonationWhereInput = {
      status: 'AVAILABLE',
      pickupDeadlineAt: { gt: new Date() },
      pickupLatitude: { gte: bbox.minLat, lte: bbox.maxLat },
    };

    if (!bbox.crossesMeridian) {
      whereClause.pickupLongitude = { gte: bbox.minLng, lte: bbox.maxLng };
    } else if (bbox.minLng2 !== undefined && bbox.maxLng2 !== undefined) {
      whereClause.OR = [
        { pickupLongitude: { gte: bbox.minLng, lte: bbox.maxLng } },
        { pickupLongitude: { gte: bbox.minLng2, lte: bbox.maxLng2 } },
      ];
    }

    const availableDonations = await prisma.donation.findMany({
      where: whereClause,
      include: {
        donor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return availableDonations
      .map((donation) => {
        const matchRes = matchDonationToNgo(donation, ngo);
        return { ...donation, distance: matchRes.distanceKm, matched: matchRes.result, score: matchRes.score };
      })
      .filter((d) => d.matched)
      .sort((a, b) => b.score - a.score);
  },

  /**
   * Diagnostic Mode: Evaluates matching criteria for all nearby active donations.
   * Scoped to 2x service radius for privacy, and authenticated for caller safety.
   */
  async getNearbyDonationsDiagnostics(ngoUserId: string): Promise<MatchResult[]> {
    const ngo = await prisma.nGOProfile.findUnique({
      where: { userId: ngoUserId },
    });
    if (!ngo) throw new Error('NGO profile not found');

    const outerRadius = ngo.serviceRadiusKm * 2;
    const bbox = calculateBoundingBox(ngo.baseLatitude, ngo.baseLongitude, outerRadius);

    const whereClause: Prisma.DonationWhereInput = {
      pickupLatitude: { gte: bbox.minLat, lte: bbox.maxLat },
    };

    if (!bbox.crossesMeridian) {
      whereClause.pickupLongitude = { gte: bbox.minLng, lte: bbox.maxLng };
    } else if (bbox.minLng2 !== undefined && bbox.maxLng2 !== undefined) {
      whereClause.OR = [
        { pickupLongitude: { gte: bbox.minLng, lte: bbox.maxLng } },
        { pickupLongitude: { gte: bbox.minLng2, lte: bbox.maxLng2 } },
      ];
    }

    // Retrieve recent donations within the privacy-scoped geographic bounds
    const candidateDonations = await prisma.donation.findMany({
      where: whereClause,
      include: {
        donor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return candidateDonations.map((donation) => {
      return matchDonationToNgo(donation, ngo);
    });
  },
};
