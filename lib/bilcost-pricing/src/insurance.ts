import type { Assumptions, Car, CostComponent } from "./types";
import { r, repeat } from "./util";

/**
 * Insurance estimate based on price band and driver age.
 *
 * Source: composite of Tryg, Topdanmark, and If's published rate sheets
 * for kasko + ansvar (2024). v1 uses a simple base-rate × age multiplier
 * × postal-code adjustment. If the user supplies an override we use it
 * verbatim.
 *
 * Postal code multiplier: København (1xxx-2xxx) and Aarhus (8000-8270)
 * pay ~15% more than the rest of the country in our model.
 */
export function insuranceEstimate(
  car: Car,
  assumptions: Assumptions,
): CostComponent {
  const horizon = assumptions.yearsHorizon;
  if (assumptions.insuranceAnnualDkkOverride != null) {
    const v = Math.max(0, assumptions.insuranceAnnualDkkOverride);
    return {
      amountDkk: r(v * horizon),
      perYearDkk: repeat(v, horizon),
      notes: `Bruger-overstyret forsikringspræmie: ${v.toLocaleString("da-DK")} kr/år.`,
    };
  }
  const base = baseRateForPrice(car.priceDkk);
  const ageMul = ageMultiplier(assumptions.driverAgeBand);
  const regionMul = regionMultiplier(assumptions.postalCode);
  const fuelMul = car.fuelType === "electric" ? 1.05 : 1;
  const annual = base * ageMul * regionMul * fuelMul;
  return {
    amountDkk: r(annual * horizon),
    perYearDkk: repeat(annual, horizon),
    notes: `Estimat: basispræmie ${r(base).toLocaleString("da-DK")} kr/år (efter bilens pris), aldersfaktor ${ageMul}, regionfaktor ${regionMul}, brændstoftillæg ${fuelMul}. Indtast egen præmie for præcis beregning.`,
  };
}

function baseRateForPrice(priceDkk: number): number {
  if (priceDkk < 75_000) return 4_500;
  if (priceDkk < 150_000) return 6_500;
  if (priceDkk < 300_000) return 9_000;
  if (priceDkk < 500_000) return 12_000;
  if (priceDkk < 800_000) return 15_500;
  return 19_000;
}

function ageMultiplier(band: Assumptions["driverAgeBand"]): number {
  switch (band) {
    case "under_25":
      return 1.8;
    case "25_29":
      return 1.3;
    case "30_49":
      return 1.0;
    case "50_64":
      return 0.95;
    case "65_plus":
      return 1.05;
  }
}

function regionMultiplier(postalCode: string): number {
  const n = parseInt(postalCode, 10);
  if (Number.isNaN(n)) return 1;
  if (n >= 1000 && n <= 2999) return 1.15; // Storkøbenhavn
  if (n >= 8000 && n <= 8270) return 1.1; // Aarhus
  if (n >= 5000 && n <= 5270) return 1.05; // Odense
  return 1;
}
