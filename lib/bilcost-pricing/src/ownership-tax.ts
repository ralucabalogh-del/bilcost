import type { Car, CostComponent } from "./types";
import { r, repeat } from "./util";

/**
 * Danish ownership tax — "ejerafgift" (older cars, by weight + fuel) or
 * "grøn ejerafgift" (modern cars, by fuel consumption / CO2).
 *
 * v1 model: cars from 1997 onwards use grøn ejerafgift based on
 * km/litre brackets (Skat.dk, satser 2024). EVs pay a flat reduced rate
 * during the ramp-up of full taxation (afgiftsindfasning 2021-2035).
 *
 * The brackets below are simplified into roughly 12 steps. They are not
 * authoritative — for an exact figure consult Motorregistret (skat.dk).
 */
export function ownershipTax(car: Car, yearsHorizon: number): CostComponent {
  const annual = annualOwnershipTax(car);
  return {
    amountDkk: r(annual * yearsHorizon),
    perYearDkk: repeat(annual, yearsHorizon),
    notes:
      car.fuelType === "electric"
        ? `Elbil — reduceret grøn ejerafgift under indfasningen: ca. ${annual.toLocaleString("da-DK")} kr/år.`
        : `Grøn ejerafgift baseret på forbrug (${(car.consumptionKmPerL ?? 15).toFixed(1)} km/l): ca. ${annual.toLocaleString("da-DK")} kr/år.`,
  };
}

function annualOwnershipTax(car: Car): number {
  if (car.fuelType === "electric") return 740; // afgiftsindfasning, sats 2024
  const km = car.consumptionKmPerL ?? 15;
  // Two semestral payments per year. Brackets are halv-årlige satser.
  // Petrol values (skat.dk satser 2024). Diesel adds a "udligningsafgift".
  const halfYear = halfYearPetrolRate(km);
  const annual = halfYear * 2;
  if (car.fuelType === "diesel") {
    return annual + dieselSurchargeAnnual(km);
  }
  return annual;
}

function halfYearPetrolRate(kmPerL: number): number {
  if (kmPerL >= 20) return 330;
  if (kmPerL >= 18) return 600;
  if (kmPerL >= 16) return 900;
  if (kmPerL >= 14) return 1_200;
  if (kmPerL >= 12) return 1_550;
  if (kmPerL >= 10) return 1_900;
  if (kmPerL >= 9) return 2_300;
  if (kmPerL >= 8) return 2_700;
  if (kmPerL >= 7) return 3_200;
  if (kmPerL >= 6) return 3_800;
  return 4_500;
}

function dieselSurchargeAnnual(kmPerL: number): number {
  if (kmPerL >= 20) return 130;
  if (kmPerL >= 16) return 290;
  if (kmPerL >= 12) return 1_300;
  if (kmPerL >= 9) return 2_400;
  return 3_500;
}
