import type { Car, CostComponent } from "./types";
import { carAgeAtStart, r } from "./util";

/**
 * Maintenance and repairs estimate.
 *
 * Method: a base annual service cost that grows with age, plus a
 * per-km wear cost. EVs get a 40% discount because they have no engine
 * oil, fewer brake services (regen), and no exhaust system.
 *
 * Source: FDM "Hvad koster en bil?" 2024 ranges, simplified to a
 * piecewise function of car age at the start of each ownership year.
 */
export function maintenance(
  car: Car,
  yearsHorizon: number,
  annualKm: number,
): CostComponent {
  const age = carAgeAtStart(car.year);
  const evDiscount = car.fuelType === "electric" ? 0.6 : 1;
  const perYearDkk: number[] = [];
  for (let i = 0; i < yearsHorizon; i++) {
    const a = age + i;
    const annualBase = baseMaintForAge(a);
    const kmCost = annualKm * 0.18; // ca. 18 øre/km i sliddele/service
    perYearDkk.push(r((annualBase + kmCost) * evDiscount));
  }
  const total = perYearDkk.reduce((s, v) => s + v, 0);
  return {
    amountDkk: total,
    perYearDkk,
    notes:
      "Service og reparationer: basisbeløb stiger med bilens alder (0-3 år: 3.500 kr/år, 4-7 år: 6.000 kr/år, 8-12 år: 9.000 kr/år, 13+ år: 12.000 kr/år) plus 0,18 kr/km i sliddele. Elbiler får 40% rabat pga. færre væsker og bremser.",
  };
}

function baseMaintForAge(yearOfLife: number): number {
  if (yearOfLife <= 3) return 3_500;
  if (yearOfLife <= 7) return 6_000;
  if (yearOfLife <= 12) return 9_000;
  return 12_000;
}
