/**
 * Shared types for the Bilcost cost-of-ownership model.
 *
 * All money values are integer DKK (Danish kroner). Distances are in
 * kilometres. Fuel consumption is stored in km per litre for combustion,
 * or kWh per 100 km for EVs (matching what Danish car listings publish).
 */

export type FuelType = "petrol" | "diesel" | "hybrid" | "phev" | "electric";

export type Transmission = "manual" | "automatic" | "unknown";

export interface Car {
  make: string;
  model: string;
  variant: string | null;
  year: number;
  /** km on the odometer at purchase. New cars are ~0. */
  mileageKm: number;
  /** sticker price including registration tax, in integer DKK. */
  priceDkk: number;
  fuelType: FuelType;
  /** Combustion: km per litre. Required for petrol/diesel/hybrid/phev. */
  consumptionKmPerL: number | null;
  /** EV / PHEV: kWh per 100 km. */
  consumptionKwhPer100km: number | null;
  co2Gkm: number | null;
  kerbWeightKg: number | null;
  transmission: Transmission;
  listingUrl: string | null;
  /** Optional preview image. */
  imageUrl: string | null;
}

export type DriverAgeBand =
  | "under_25"
  | "25_29"
  | "30_49"
  | "50_64"
  | "65_plus";

export interface Assumptions {
  yearsHorizon: number;
  annualKm: number;
  downPaymentDkk: number;
  loanInterestPct: number;
  loanTermYears: number;
  /** DKK per litre, used for petrol/diesel/hybrid/phev. */
  fuelPriceDkkPerLiter: number;
  /** DKK per kWh, used for EV / PHEV electric portion. */
  electricityPriceDkkPerKwh: number;
  /**
   * If provided, overrides the model-based insurance estimate. Annual DKK.
   */
  insuranceAnnualDkkOverride: number | null;
  driverAgeBand: DriverAgeBand;
  /** 4-digit Danish postal code, e.g. "2100". Used for regional adjustment. */
  postalCode: string;
}

export interface CostComponent {
  /** Total over the full horizon, in integer DKK. */
  amountDkk: number;
  /** Per-year array, one entry per ownership year, integer DKK. */
  perYearDkk: number[];
  notes: string;
}

export interface TcoBreakdown {
  depreciation: CostComponent;
  financingInterest: CostComponent;
  insurance: CostComponent;
  maintenance: CostComponent;
  fuel: CostComponent;
  ownershipTax: CostComponent;
  tiresAndWear: CostComponent;
  inspection: CostComponent;
}

export interface TcoResult {
  car: Car;
  assumptions: Assumptions;
  breakdown: TcoBreakdown;
  /** Total cost across the horizon, integer DKK. */
  totalDkk: number;
  totalPerYearDkk: number;
  totalPerKmDkk: number;
  /** Estimated resale value at end of horizon, integer DKK. */
  residualValueDkk: number;
  /** Cumulative DKK spent at end of each year (length = yearsHorizon). */
  yearlyCumulativeDkk: number[];
}

export interface ComparisonResult {
  carA: TcoResult;
  carB: TcoResult;
  /** carB.totalDkk - carA.totalDkk. Positive means A is cheaper. */
  deltaDkk: number;
}
