import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateBoundingBox,
  normalizeFoodCategory,
  matchFoodCategory,
  validateDonation,
  validateNgo,
  matchDonationToNgo
} from '../services/matchingService';

describe('MatchingService Geolocation & Math', () => {
  it('calculates distance correctly between two points', () => {
    // Bengaluru center to Save Food Foundation MG Road (~1.55 km away)
    const dist = calculateDistance(12.9716, 77.5946, 12.9616, 77.5846);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(1.6);
  });

  it('calculates bounding box correctly without wrap-around', () => {
    const lat = 12.9716;
    const lng = 77.5946;
    const radius = 10;
    const bbox = calculateBoundingBox(lat, lng, radius);
    expect(bbox.crossesMeridian).toBe(false);
    expect(bbox.minLat).toBeLessThan(lat);
    expect(bbox.maxLat).toBeGreaterThan(lat);
    expect(bbox.minLng).toBeLessThan(lng);
    expect(bbox.maxLng).toBeGreaterThan(lng);
  });

  it('handles coordinate wrap-around at 180th meridian', () => {
    const lat = 0;
    const lng = 179.9;
    const radius = 25; // crosses meridian
    const bbox = calculateBoundingBox(lat, lng, radius);
    expect(bbox.crossesMeridian).toBe(true);
    expect(bbox.minLng).toBeCloseTo(179.675, 2);
    expect(bbox.maxLng).toBe(180);
    expect(bbox.minLng2).toBe(-180);
    expect(bbox.maxLng2).toBeCloseTo(-179.875, 2);
  });

  it('clamps latitude coordinates at the poles', () => {
    const lat = 89.95;
    const lng = 0;
    const radius = 20;
    const bbox = calculateBoundingBox(lat, lng, radius);
    expect(bbox.maxLat).toBe(90);
    expect(bbox.minLat).toBeLessThan(90);
  });
});

describe('MatchingService Category Normalization', () => {
  it('normalizes mixed case and variations correctly', () => {
    expect(normalizeFoodCategory('Bakery Items')).toBe('bakery');
    expect(normalizeFoodCategory('BAKERY')).toBe('bakery');
    expect(normalizeFoodCategory('bakery')).toBe('bakery');
    expect(normalizeFoodCategory('bread and pastry')).toBe('bakery');
    expect(normalizeFoodCategory('Fresh Rice & Grains')).toBe('grains');
    expect(normalizeFoodCategory('rice')).toBe('grains');
    expect(normalizeFoodCategory('vegetables/salad')).toBe('vegetables');
    expect(normalizeFoodCategory('Mixed Curry & Rice')).toBe('mixed');
    expect(normalizeFoodCategory('invalid_category')).toBe('mixed'); // default fallback
  });

  it('matches normalized food categories correctly with NGO types', () => {
    // Cooked Veg
    expect(matchFoodCategory('mixed', 'VEG', 'COOKED_VEG,PACKAGED_FOOD')).toBe(true);
    expect(matchFoodCategory('mixed', 'VEG', 'COOKED_NON_VEG')).toBe(false);

    // Cooked Non-Veg
    expect(matchFoodCategory('mixed', 'NON_VEG', 'COOKED_NON_VEG')).toBe(true);
    expect(matchFoodCategory('meat', 'NON_VEG', 'COOKED_NON_VEG')).toBe(true);
    expect(matchFoodCategory('meat', 'NON_VEG', 'COOKED_VEG')).toBe(false);

    // Grains
    expect(matchFoodCategory('grains', 'VEG', 'DRY_RATION')).toBe(true);
    expect(matchFoodCategory('grains', 'VEG', 'PACKAGED_FOOD')).toBe(true);
    expect(matchFoodCategory('grains', 'VEG', 'BAKERY')).toBe(false);

    // Bakery
    expect(matchFoodCategory('Bakery Items', 'VEG', 'BAKERY')).toBe(true);
    expect(matchFoodCategory('bakery', 'VEG', 'PACKAGED_FOOD')).toBe(true);
    expect(matchFoodCategory('bakery', 'VEG', 'DRY_RATION')).toBe(false);
  });
});

describe('MatchingService Validation', () => {
  it('validates donation status and expiry correctly', () => {
    const validDonation = { status: 'AVAILABLE', pickupDeadlineAt: new Date(Date.now() + 3600000) };
    const expiredDonation = { status: 'AVAILABLE', pickupDeadlineAt: new Date(Date.now() - 3600000) };
    const acceptedDonation = { status: 'ACCEPTED', pickupDeadlineAt: new Date(Date.now() + 3600000) };

    expect(validateDonation(validDonation).isValid).toBe(true);
    expect(validateDonation(expiredDonation).isValid).toBe(false);
    expect(validateDonation(acceptedDonation).isValid).toBe(false);
  });

  it('validates NGO status and availability correctly', () => {
    const validNgo = { status: 'VERIFIED', availability: 'AVAILABLE' };
    const busyNgo = { status: 'VERIFIED', availability: 'BUSY' };
    const offlineNgo = { status: 'VERIFIED', availability: 'OFFLINE' };
    const pendingNgo = { status: 'PENDING_VERIFICATION', availability: 'AVAILABLE' };

    expect(validateNgo(validNgo).isValid).toBe(true);
    expect(validateNgo(busyNgo).isValid).toBe(false);
    expect(validateNgo(offlineNgo).isValid).toBe(false);
    expect(validateNgo(pendingNgo).isValid).toBe(false);
  });
});

describe('MatchingService End-to-End matching & diagnostics', () => {
  const verifiedNgo = {
    status: 'VERIFIED',
    availability: 'AVAILABLE',
    acceptedFoodTypes: 'COOKED_VEG,BAKERY',
    baseLatitude: 12.9716,
    baseLongitude: 77.5946,
    serviceRadiusKm: 10
  };

  it('succeeds when all conditions are met', () => {
    const donation = {
      id: 'd_1',
      title: 'Fresh Veg Biryani',
      status: 'AVAILABLE',
      foodCategory: 'mixed',
      vegNonVegMixed: 'VEG',
      pickupDeadlineAt: new Date(Date.now() + 3600000),
      pickupLatitude: 12.9720,
      pickupLongitude: 77.5950
    };

    const matchRes = matchDonationToNgo(donation, verifiedNgo);
    expect(matchRes.result).toBe(true);
    expect(matchRes.reasons.length).toBe(0);
  });

  it('fails and returns reasons if donation is outside radius', () => {
    const donation = {
      id: 'd_2',
      title: 'Fresh Veg Biryani',
      status: 'AVAILABLE',
      foodCategory: 'mixed',
      vegNonVegMixed: 'VEG',
      pickupDeadlineAt: new Date(Date.now() + 3600000),
      pickupLatitude: 13.5, // Far away (~58km)
      pickupLongitude: 77.5946
    };

    const matchRes = matchDonationToNgo(donation, verifiedNgo);
    expect(matchRes.result).toBe(false);
    expect(matchRes.checks.distancePassed).toBe(false);
    expect(matchRes.reasons.some(r => r.includes('Outside service radius'))).toBe(true);
  });

  it('fails and returns reasons if food category mismatches', () => {
    const donation = {
      id: 'd_3',
      title: 'Chicken Curry',
      status: 'AVAILABLE',
      foodCategory: 'meat', // not in acceptedTypes
      vegNonVegMixed: 'NON_VEG',
      pickupDeadlineAt: new Date(Date.now() + 3600000),
      pickupLatitude: 12.9716,
      pickupLongitude: 77.5946
    };

    const matchRes = matchDonationToNgo(donation, verifiedNgo);
    expect(matchRes.result).toBe(false);
    expect(matchRes.checks.categoryPassed).toBe(false);
    expect(matchRes.reasons.some(r => r.includes('Category mismatch'))).toBe(true);
  });

  it('handles null / missing coordinate values gracefully', () => {
    const donation = {
      id: 'd_4',
      title: 'No Location Food',
      status: 'AVAILABLE',
      foodCategory: 'mixed',
      vegNonVegMixed: 'VEG',
      pickupDeadlineAt: new Date(Date.now() + 3600000),
      pickupLatitude: null as unknown as number,
      pickupLongitude: null as unknown as number
    };

    const matchRes = matchDonationToNgo(donation, verifiedNgo);
    expect(matchRes.result).toBe(false);
    expect(matchRes.checks.distancePassed).toBe(false);
  });
});
