import type { Car, CostComponent } from "./types";
import { carAgeAtStart, r, sumArray } from "./util";

/**
 * Estimate residual value at the end of the ownership horizon.
 *
 * Method: a per-year exponential decay rate that depends on the car's
 * age at purchase. New cars lose value fastest in year 1 (~20%), then
 * settle into ~12% per year. Older used cars decay slower (~8%/year).
 * This is a simplified version of the curves published by FDM and
 * DAT-Veritas for the Danish market.
 *
 * Mileage adjustment: every 5.000 km above 15.000 km/year of total
 * accumulated mileage at end of horizon shaves another 1% off the
 * residual, capped at -25%.
 */
export function estimateResidualValueDkk(
  car: Car,
  yearsHorizon: number,
  annualKm: number,
): number {
  const age = carAgeAtStart(car.year);
  let value = car.priceDkk;
  for (let i = 0; i < yearsHorizon; i++) {
    const yearOfLifeAtStart = age + i;
    const rate = depreciationRateForAge(yearOfLifeAtStart);
    value *= 1 - rate;
  }
  const totalKmAtEnd = car.mileageKm + annualKm * yearsHorizon;
  const excessKm = Math.max(0, totalKmAtEnd - 15_000 * (age + yearsHorizon));
  const mileagePenalty = Math.min(0.25, (excessKm / 5_000) * 0.01);
  value *= 1 - mileagePenalty;
  return Math.max(0, r(value));
}

function depreciationRateForAge(yearOfLife: number): number {
  if (yearOfLife === 0) return 0.2;
  if (yearOfLife === 1) return 0.15;
  if (yearOfLife <= 3) return 0.12;
  if (yearOfLife <= 6) return 0.1;
  if (yearOfLife <= 10) return 0.08;
  return 0.06;
}

export function depreciation(
  car: Car,
  yearsHorizon: number,
  annualKm: number,
): CostComponent {
  const age = carAgeAtStart(car.year);
  let value = car.priceDkk;
  const perYearDkk: number[] = [];
  for (let i = 0; i < yearsHorizon; i++) {
    const rate = depreciationRateForAge(age + i);
    const loss = value * rate;
    perYearDkk.push(r(loss));
    value -= loss;
  }
  const residual = estimateResidualValueDkk(car, yearsHorizon, annualKm);
  // Make sure perYearDkk sums to (price - residual), absorbing the mileage
  // penalty into the final year so the breakdown is internally consistent.
  const targetTotal = car.priceDkk - residual;
  const drift = targetTotal - sumArray(perYearDkk);
  if (perYearDkk.length > 0) {
    perYearDkk[perYearDkk.length - 1] =
      (perYearDkk[perYearDkk.length - 1] ?? 0) + drift;
  }
  return {
    amountDkk: targetTotal,
    perYearDkk,
    notes: `Estimeret restværdi efter ${yearsHorizon} år: ${residual.toLocaleString("da-DK")} kr. Værditab beregnes med en alders-baseret kurve (år 0: 20%, år 1: 15%, år 2-3: 12%, år 4-6: 10%, år 7-10: 8%, derefter 6%) plus et kilometerpåslag.`,
  };
}
