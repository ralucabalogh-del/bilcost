import type { Car, CostComponent } from "./types";
import { r, repeat } from "./util";

/**
 * Tyres and other wear items (wipers, brake pads, AdBlue, washer fluid).
 *
 * Tyre cost: a full set of summer + winter tyres lasts ~40.000 km.
 * Replacement set ranges from 4.000 kr (small car) to 12.000 kr
 * (premium SUV). v1 picks 6.000 kr/set as a midpoint and scales by
 * weight when known.
 */
export function tiresAndWear(
  car: Car,
  yearsHorizon: number,
  annualKm: number,
): CostComponent {
  const setCost = tyreSetCostForCar(car);
  const setsPerYear = annualKm / 40_000;
  const tyreAnnual = setCost * setsPerYear;
  const otherWearAnnual = 1_200; // viskere, sprinklervæske, småting
  const annual = tyreAnnual + otherWearAnnual;
  return {
    amountDkk: r(annual * yearsHorizon),
    perYearDkk: repeat(annual, yearsHorizon),
    notes: `${setCost.toLocaleString("da-DK")} kr pr. dæksæt (sommer+vinter), 1 sæt holder ca. 40.000 km. Plus ${otherWearAnnual.toLocaleString("da-DK")} kr/år til småting (viskere, sprinklervæske).`,
  };
}

function tyreSetCostForCar(car: Car): number {
  const w = car.kerbWeightKg ?? 1_400;
  if (w < 1_100) return 4_500;
  if (w < 1_400) return 6_000;
  if (w < 1_700) return 7_500;
  if (w < 2_000) return 9_500;
  return 12_000;
}
