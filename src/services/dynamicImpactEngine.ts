/**
 * FoodOps Dynamic Life Cycle Assessment (LCA) & Bio-Kinetic Engine
 *
 * Replaces static pre-fed lookup tables with real-time empirical modeling:
 * - Substrate-level macronutrient decomposition (Moisture, Carbohydrates, Lipids, Proteins)
 * - Dynamic agricultural & processing carbon/water footprint calculation
 * - Real-time transit logistics distance & fleet vehicle emissions offset
 * - Anaerobic digestion kinetics (Volatile Solids, Biochemical Methane Potential, CHP generator efficiency)
 * - Aerobic composting humus yield & soil carbon sequestration modeling
 * - IPCC Tier 2 Landfill Methane Avoidance with Degradable Organic Carbon (DOC)
 */

export interface SubstrateProfile {
  name: string;
  moistureFraction: number;      // 0.0 - 1.0 (e.g. 0.82 for watery curries, 0.25 for dry bakery)
  volatileSolidsRatio: number;   // VS as fraction of Total Solids (e.g. 0.85)
  biochemicalMethanePotential: number; // m3 CH4 per kg VS (e.g. 0.38 - 0.55)
  baseAgriCo2PerKg: number;       // kg CO2e / kg food product
  virtualWaterLitersPerKg: number;// Liters of embedded water / kg
  caloricDensityKcalPerKg: number;
}

export interface DynamicRescueImpactInput {
  foodWeightKg: number;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  vegNonVeg?: string | null;
  estimatedServings?: number | null;
  pickupCoords?: { latitude: number; longitude: number } | null;
  dropoffCoords?: { latitude: number; longitude: number } | null;
  vehicleType?: string | null;
}

export interface DynamicRescueImpactResult {
  foodWeightKg: number;
  estimatedServings: number;
  grossCo2SavedKg: number;
  transitEmissionsKg: number;
  netCo2SavedKg: number;
  waterSavedLiters: number;
  transitDistanceKm: number;
  calculationMethod: string;
  factorsUsed: string;
  metricsBreakdown: {
    substrateCategory: string;
    moisturePercent: number;
    volatileSolidsPercent: number;
    cookingEnergyOffsetKg: number;
    transitOffsetKg: number;
    virtualWaterIntensity: number;
  };
}

export interface DynamicRecoveryImpactInput {
  foodWeightKg: number;
  facilityType?: string | null; // 'BIOMETHANATION' | 'BIO_CNG' | 'COMPOSTING' | 'GOSHALA' | string
  facilityName?: string | null;
  facilityEfficiency?: number | null;
  title?: string | null;
  description?: string | null;
  wasteCategory?: string | null;
  vegNonVeg?: string | null;
  pickupCoords?: { latitude: number; longitude: number } | null;
  facilityCoords?: { latitude: number; longitude: number } | null;
  vehicleType?: string | null;
}

export interface DynamicRecoveryImpactResult {
  foodWeightKg: number;
  cleanEnergyKwh: number;
  biogasM3: number;
  bioFertilizerKg: number;
  landfillMethaneAvoidedKg: number;
  waterSavedLiters: number;
  transitDistanceKm: number;
  transitEmissionsKg: number;
  netCo2SavedKg: number;
  calculationMethod: string;
  factorsUsed: string;
  metricsBreakdown: {
    technology: string;
    substrateCategory: string;
    moisturePercent: number;
    volatileSolidsPercent: number;
    biochemicalMethanePotential: number;
    digestionEfficiency: number;
  };
}

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Real-world logistics emission factors (kg CO2e per km driven)
 */
export function getVehicleEmissionFactor(vehicleType?: string | null): number {
  if (!vehicleType) return 0.065; // Default light vehicle
  const lower = vehicleType.toLowerCase();

  if (lower.includes('electric') || lower.includes('ev') || lower.includes('e-bike')) {
    return 0.022; // Grid emissions for light EV in India
  }
  if (lower.includes('two-wheeler') || lower.includes('bike') || lower.includes('scooter') || lower.includes('motorcycle')) {
    return 0.058; // Standard 110-150cc petrol 2W
  }
  if (lower.includes('cargo auto') || lower.includes('3-wheeler') || lower.includes('rickshaw') || lower.includes('cng')) {
    return 0.112; // CNG/Petrol 3W cargo carrier
  }
  if (lower.includes('van') || lower.includes('insulated') || lower.includes('tata ace') || lower.includes('truck')) {
    return 0.178; // LCV / Small diesel delivery truck
  }
  return 0.075;
}

/**
 * Dynamic Substrate Decomposition:
 * Extracts biochemical composition, moisture fraction, and agricultural footprints
 * directly from item text, category, and dietary attributes.
 */
export function detectSubstrateProfile(
  title?: string | null,
  description?: string | null,
  category?: string | null,
  vegNonVeg?: string | null
): SubstrateProfile {
  const text = `${title || ''} ${description || ''} ${category || ''} ${vegNonVeg || ''}`.toLowerCase();

  // 1. Meats & Poultry (Highest embedded carbon & virtual water)
  if (
    text.includes('meat') ||
    text.includes('chicken') ||
    text.includes('mutton') ||
    text.includes('fish') ||
    text.includes('egg') ||
    text.includes('non_veg') ||
    text.includes('non-veg') ||
    text.includes('seafood')
  ) {
    const isRedMeat = text.includes('mutton') || text.includes('beef') || text.includes('pork');
    return {
      name: isRedMeat ? 'Red Meat & Gravy' : 'Poultry & Cooked Non-Veg',
      moistureFraction: 0.68,
      volatileSolidsRatio: 0.84,
      biochemicalMethanePotential: 0.44, // m3 CH4 / kg VS
      baseAgriCo2PerKg: isRedMeat ? 9.2 : 5.8,
      virtualWaterLitersPerKg: isRedMeat ? 12500 : 4300,
      caloricDensityKcalPerKg: 2100,
    };
  }

  // 2. Dairy & Cheeses (Paneer, Milk, Curd, Ghee)
  if (
    text.includes('dairy') ||
    text.includes('paneer') ||
    text.includes('cheese') ||
    text.includes('curd') ||
    text.includes('milk') ||
    text.includes('butter') ||
    text.includes('ghee') ||
    text.includes('yogurt')
  ) {
    const isSolidDairy = text.includes('paneer') || text.includes('cheese') || text.includes('butter');
    return {
      name: isSolidDairy ? 'Concentrated Dairy (Paneer/Cheese)' : 'Fluid Dairy & Curds',
      moistureFraction: isSolidDairy ? 0.52 : 0.86,
      volatileSolidsRatio: 0.90,
      biochemicalMethanePotential: 0.56, // Lipids yield high methane
      baseAgriCo2PerKg: isSolidDairy ? 4.8 : 2.4,
      virtualWaterLitersPerKg: isSolidDairy ? 3800 : 1200,
      caloricDensityKcalPerKg: isSolidDairy ? 2600 : 950,
    };
  }

  // 3. Bakery & Dry Confectionery (Breads, Croissants, Rolls, Cakes, Buns)
  if (
    text.includes('bakery') ||
    text.includes('bread') ||
    text.includes('cake') ||
    text.includes('pastry') ||
    text.includes('croissant') ||
    text.includes('bun') ||
    text.includes('cookie') ||
    text.includes('toast')
  ) {
    return {
      name: 'Dry Bakery & Confectionery',
      moistureFraction: 0.26, // Low moisture, high dry matter
      volatileSolidsRatio: 0.92,
      biochemicalMethanePotential: 0.48, // Readily degradable starches
      baseAgriCo2PerKg: 1.6,
      virtualWaterLitersPerKg: 1350,
      caloricDensityKcalPerKg: 2850,
    };
  }

  // 4. Grains & Starches (Biryani, Rice, Pulao, Roti, Chapati, Noodles)
  if (
    text.includes('grain') ||
    text.includes('rice') ||
    text.includes('biryani') ||
    text.includes('pulao') ||
    text.includes('roti') ||
    text.includes('chapati') ||
    text.includes('wheat') ||
    text.includes('naan') ||
    text.includes('paratha') ||
    text.includes('khichdi')
  ) {
    const isBiryaniOrFeast = text.includes('biryani') || text.includes('pulao') || text.includes('feasting');
    return {
      name: isBiryaniOrFeast ? 'Cooked Spiced Grains & Biryani' : 'Cooked Staple Grains (Rice/Roti)',
      moistureFraction: 0.62,
      volatileSolidsRatio: 0.86,
      biochemicalMethanePotential: 0.41,
      baseAgriCo2PerKg: isBiryaniOrFeast ? 2.4 : 1.4, // Rice has agricultural paddy methane
      virtualWaterLitersPerKg: 2600,
      caloricDensityKcalPerKg: 1650,
    };
  }

  // 5. Fresh Fruits
  if (
    text.includes('fruit') ||
    text.includes('apple') ||
    text.includes('banana') ||
    text.includes('orange') ||
    text.includes('mango') ||
    text.includes('papaya') ||
    text.includes('melon')
  ) {
    return {
      name: 'Fresh Orchard Fruits',
      moistureFraction: 0.86,
      volatileSolidsRatio: 0.82,
      biochemicalMethanePotential: 0.35,
      baseAgriCo2PerKg: 0.75,
      virtualWaterLitersPerKg: 850,
      caloricDensityKcalPerKg: 600,
    };
  }

  // 6. Vegetables & Leafy Greens (Salad, Sabzi, Veg Curries)
  if (
    text.includes('vegetable') ||
    text.includes('veg') ||
    text.includes('salad') ||
    text.includes('curry') ||
    text.includes('dal') ||
    text.includes('sabzi') ||
    text.includes('spinach') ||
    text.includes('tomato')
  ) {
    const isCookedCurry = text.includes('curry') || text.includes('dal') || text.includes('sabzi');
    return {
      name: isCookedCurry ? 'Cooked Vegetables & Legume Dal' : 'Fresh Vegetables & Salads',
      moistureFraction: isCookedCurry ? 0.78 : 0.90,
      volatileSolidsRatio: 0.76,
      biochemicalMethanePotential: 0.29,
      baseAgriCo2PerKg: isCookedCurry ? 1.1 : 0.55,
      virtualWaterLitersPerKg: isCookedCurry ? 950 : 320,
      caloricDensityKcalPerKg: isCookedCurry ? 850 : 350,
    };
  }

  // 7. General Mixed Catering Default
  return {
    name: 'Mixed Catering & Prepared Meals',
    moistureFraction: 0.70,
    volatileSolidsRatio: 0.80,
    biochemicalMethanePotential: 0.36,
    baseAgriCo2PerKg: 2.2,
    virtualWaterLitersPerKg: 1650,
    caloricDensityKcalPerKg: 1400,
  };
}

export const dynamicImpactEngine = {
  /**
   * Calculate live Life Cycle Assessment (LCA) impact for human food rescue.
   * Dynamically factors in substrate composition, cooking energy saved,
   * actual transit distance, and vehicle emissions.
   */
  calculateRescueImpact(input: DynamicRescueImpactInput): DynamicRescueImpactResult {
    const rawWeight = input.foodWeightKg > 0 ? input.foodWeightKg : 15.0;
    const profile = detectSubstrateProfile(
      input.title,
      input.description,
      input.category,
      input.vegNonVeg
    );

    // Dynamic cooking thermal offset:
    // If food is cooked, avoiding waste preserves the LPG/electricity cooking footprint
    const isCooked =
      (input.category && input.category.toUpperCase().includes('COOKED')) ||
      (input.title && /curry|biryani|dal|roti|cooked|buffet|banquet/i.test(input.title));
    const cookingEnergyOffsetPerKg = isCooked ? 0.32 : 0.08;

    // Gross CO2 saved per kg (agricultural lifecycle + preparation thermal energy)
    const dynamicCo2FactorPerKg = profile.baseAgriCo2PerKg + cookingEnergyOffsetPerKg;
    const grossCo2Saved = Number((rawWeight * dynamicCo2FactorPerKg).toFixed(2));

    // Calculate real transit distance & logistics emissions
    let transitDistanceKm = 3.5; // Realistic city average default
    if (input.pickupCoords && input.dropoffCoords) {
      const dist = calculateHaversineDistance(
        input.pickupCoords.latitude,
        input.pickupCoords.longitude,
        input.dropoffCoords.latitude,
        input.dropoffCoords.longitude
      );
      if (dist > 0.1 && dist < 150) {
        transitDistanceKm = dist;
      }
    }

    const vehicleFactor = getVehicleEmissionFactor(input.vehicleType);
    const transitEmissionsKg = Number((transitDistanceKm * vehicleFactor).toFixed(2));

    // Net CO2 saved = Gross waste abatement - Tailpipe transit emissions
    const netCo2SavedKg = Math.max(
      0.1,
      Number((grossCo2Saved - transitEmissionsKg).toFixed(2))
    );

    // Dynamic water saved
    const waterSavedLiters = Math.round(rawWeight * profile.virtualWaterLitersPerKg);

    // Dynamic servings based on caloric/density profile
    let estimatedServings = input.estimatedServings || 0;
    if (!estimatedServings || estimatedServings <= 0) {
      // Average adult meal is ~600 kcal or ~0.35 kg of cooked food
      const portionKg = profile.moistureFraction > 0.8 ? 0.4 : profile.moistureFraction < 0.4 ? 0.2 : 0.32;
      estimatedServings = Math.max(1, Math.round(rawWeight / portionKg));
    }

    const factorsUsed = [
      `Substrate=${profile.name}`,
      `Moisture=${Math.round(profile.moistureFraction * 100)}%`,
      `AgriCO2=${profile.baseAgriCo2PerKg}kg/kg`,
      `CookThermal=+${cookingEnergyOffsetPerKg}kg/kg`,
      `Dist=${transitDistanceKm}km(${input.vehicleType || '2W'})`,
      `TransitOffset=-${transitEmissionsKg}kg`,
      `WF=${profile.virtualWaterLitersPerKg}L/kg`,
    ].join(' | ');

    return {
      foodWeightKg: rawWeight,
      estimatedServings,
      grossCo2SavedKg: grossCo2Saved,
      transitEmissionsKg,
      netCo2SavedKg,
      waterSavedLiters,
      transitDistanceKm,
      calculationMethod: 'DYNAMIC_LCA_ISO14044_V2',
      factorsUsed,
      metricsBreakdown: {
        substrateCategory: profile.name,
        moisturePercent: Math.round(profile.moistureFraction * 100),
        volatileSolidsPercent: Math.round((1 - profile.moistureFraction) * profile.volatileSolidsRatio * 100),
        cookingEnergyOffsetKg: Number((rawWeight * cookingEnergyOffsetPerKg).toFixed(2)),
        transitOffsetKg: transitEmissionsKg,
        virtualWaterIntensity: profile.virtualWaterLitersPerKg,
      },
    };
  },

  /**
   * Calculate live bio-kinetic and thermodynamic recovery metrics
   * based on facility technology (Biomethanation vs Bio-CNG vs Composting vs Goshala),
   * volatile solids, biochemical methane potential (BMP), and transit route.
   */
  calculateRecoveryImpact(input: DynamicRecoveryImpactInput): DynamicRecoveryImpactResult {
    const rawWeight = input.foodWeightKg > 0 ? input.foodWeightKg : 20.0;
    const profile = detectSubstrateProfile(
      input.title,
      input.description,
      input.wasteCategory,
      input.vegNonVeg
    );

    const facilityType = (input.facilityType || 'BIOMETHANATION').toUpperCase();
    const facilityEfficiency = input.facilityEfficiency || 0.88;

    // Logistics calculation
    let transitDistanceKm = 5.2; // Default city haul
    if (input.pickupCoords && input.facilityCoords) {
      const dist = calculateHaversineDistance(
        input.pickupCoords.latitude,
        input.pickupCoords.longitude,
        input.facilityCoords.latitude,
        input.facilityCoords.longitude
      );
      if (dist > 0.1 && dist < 200) {
        transitDistanceKm = dist;
      }
    }
    const vehicleFactor = getVehicleEmissionFactor(input.vehicleType || 'Cargo Auto (Sealed)');
    const transitEmissionsKg = Number((transitDistanceKm * vehicleFactor).toFixed(2));

    // Total Solids (TS) and Volatile Solids (VS)
    const totalSolidsFraction = 1 - profile.moistureFraction;
    const volatileSolidsKg = rawWeight * totalSolidsFraction * profile.volatileSolidsRatio;

    let cleanEnergyKwh = 0;
    let biogasM3 = 0;
    let bioFertilizerKg = 0;
    let landfillMethaneAvoidedKg = 0;
    let waterSavedLiters = 0;
    let method = 'DYNAMIC_ANAEROBIC_KINETICS_V2';

    if (facilityType.includes('COMPOST') || facilityType.includes('AEROBIC')) {
      // 1. Aerobic Composting Technology (e.g. Mula-Mutha Aerobic Composting)
      method = 'DYNAMIC_AEROBIC_COMPOSTING_V2';
      cleanEnergyKwh = 0; // Aerobic does not generate methane electricity
      biogasM3 = 0;
      // High-nitrogen humic compost yield: 45% - 58% of input organic mass
      const humusYieldFactor = 0.42 + totalSolidsFraction * 0.25;
      bioFertilizerKg = Number((rawWeight * humusYieldFactor).toFixed(2));
      // Landfill methane avoided + Soil organic carbon (SOC) sequestration credit
      landfillMethaneAvoidedKg = Number((rawWeight * (1.1 + totalSolidsFraction * 0.8)).toFixed(2));
      // Water retention benefit in agricultural soil
      waterSavedLiters = Math.round(rawWeight * 420);
    } else if (facilityType.includes('GOSHALA') || facilityType.includes('ANIMAL') || facilityType.includes('FEED')) {
      // 2. Livestock / Cattle Fodder Upcycling (e.g. Alandi Goshala)
      method = 'DYNAMIC_CIRCULAR_FEED_V2';
      cleanEnergyKwh = 0;
      // Secondary cow dung biomethanation slurry
      biogasM3 = Number((rawWeight * 0.12).toFixed(2));
      // Concentrated cattle fodder and manure organic fertilizer
      bioFertilizerKg = Number((rawWeight * 0.78).toFixed(2));
      landfillMethaneAvoidedKg = Number((rawWeight * 1.65).toFixed(2));
      waterSavedLiters = Math.round(rawWeight * 650);
    } else if (facilityType.includes('CNG') || facilityType.includes('URJA')) {
      // 3. High-Pressure Bio-CNG Compression (e.g. Urja Bio-CNG)
      method = 'DYNAMIC_BIO_CNG_COMPRESSION_V2';
      // Raw methane produced (m3) = VS * BMP * Plant Efficiency
      const rawMethaneM3 = volatileSolidsKg * profile.biochemicalMethanePotential * facilityEfficiency;
      biogasM3 = Number((rawMethaneM3 / 0.62).toFixed(2)); // Standard 62% biogas composition
      // 1 m3 purified Bio-CNG = ~2.2 kWh electrical equivalent / fuel offset
      cleanEnergyKwh = Number((rawMethaneM3 * 2.35).toFixed(2));
      // Enriched bio-fertilizer digestate slurry cake
      bioFertilizerKg = Number((rawWeight * 0.32).toFixed(2));
      // High methane abatement + fossil diesel displacement
      landfillMethaneAvoidedKg = Number((rawWeight * (1.8 + totalSolidsFraction * 0.6)).toFixed(2));
      waterSavedLiters = Math.round(rawWeight * 380);
    } else {
      // 4. Municipal Biomethanation & Combined Heat and Power (CHP) (e.g. PMC Katraj)
      method = 'DYNAMIC_ANAEROBIC_BIOMETHANATION_V2';
      const rawMethaneM3 = volatileSolidsKg * profile.biochemicalMethanePotential * facilityEfficiency;
      biogasM3 = Number((rawMethaneM3 / 0.58).toFixed(2));
      // Lower Heating Value of Methane = 9.97 kWh/m3, gas generator electrical efficiency = 36%
      const electricalKwh = rawMethaneM3 * 9.97 * 0.36;
      cleanEnergyKwh = Number(electricalKwh.toFixed(2));
      // Organic digestate bio-fertilizer
      bioFertilizerKg = Number((rawWeight * (0.28 + totalSolidsFraction * 0.15)).toFixed(2));
      // IPCC Tier 2 Landfill Methane Avoidance:
      // DOC = TS * 0.48; CH4 = DOC * DOCf(0.5) * F(0.5) * (16/12) * GWP28
      const dynamicDoc = totalSolidsFraction * 0.48;
      const ipccMethaneAvoided = rawWeight * dynamicDoc * 0.5 * 0.5 * (16 / 12) * 28;
      landfillMethaneAvoidedKg = Number(Math.max(1.2, ipccMethaneAvoided).toFixed(2));
      waterSavedLiters = Math.round(rawWeight * 350);
    }

    // Net CO2 saved = Landfill methane avoided - Transit fuel penalty
    const netCo2SavedKg = Math.max(
      0.1,
      Number((landfillMethaneAvoidedKg - transitEmissionsKg).toFixed(2))
    );

    const factorsUsed = [
      `Tech=${facilityType}`,
      `Substrate=${profile.name}`,
      `Moisture=${Math.round(profile.moistureFraction * 100)}%`,
      `VS=${Math.round(volatileSolidsKg * 10) / 10}kg`,
      `BMP=${profile.biochemicalMethanePotential}m3/kgVS`,
      `Energy=${cleanEnergyKwh}kWh`,
      `Biogas=${biogasM3}m3`,
      `Fertilizer=${bioFertilizerKg}kg`,
      `Transit=-${transitEmissionsKg}kg(${transitDistanceKm}km)`,
    ].join(' | ');

    return {
      foodWeightKg: rawWeight,
      cleanEnergyKwh,
      biogasM3,
      bioFertilizerKg,
      landfillMethaneAvoidedKg,
      waterSavedLiters,
      transitDistanceKm,
      transitEmissionsKg,
      netCo2SavedKg,
      calculationMethod: method,
      factorsUsed,
      metricsBreakdown: {
        technology: facilityType,
        substrateCategory: profile.name,
        moisturePercent: Math.round(profile.moistureFraction * 100),
        volatileSolidsPercent: Math.round(profile.volatileSolidsRatio * 100),
        biochemicalMethanePotential: profile.biochemicalMethanePotential,
        digestionEfficiency: Math.round(facilityEfficiency * 100),
      },
    };
  },
};
