import type { Car, CostComponent } from "./types";
import { carAgeAtStart, r } from "./util";

/**
 * Periodic vehicle inspection ("syn") cost.
 *
 * Danish schedule: first inspection at year 4, then every 2 years.
 * Typical cost: ~600 kr at FDM/Applus, plus ~300 kr re-inspection
 * fees averaged in.
 */
export function inspectionCost(
  car: Car,
  yearsHorizon: number,
): CostComponent {
  const age = carAgeAtStart(car.year);
  const perYearDkk: number[] = [];
  for (let i = 0; i < yearsHorizon; i++) {
    const a = age + i + 1;
    perYearDkk.push(isInspectionYear(a) ? 700 : 0);
  }
  const total = perYearDkk.reduce((s, v) => s + v, 0);
  return {
    amountDkk: r(total),
    perYearDkk,
    notes:
      "Syn ved 4 år, derefter hvert 2. år. ~700 kr pr. gang inkl. eventuelt omsyn.",
  };
}

function isInspectionYear(yearOfLife: number): boolean {
  if (yearOfLife < 4) return false;
  return (yearOfLife - 4) % 2 === 0;
}
