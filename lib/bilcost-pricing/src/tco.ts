import { depreciation } from "./depreciation";
import { financingInterest } from "./financing";
import { fuelCost } from "./fuel";
import { insuranceEstimate } from "./insurance";
import { inspectionCost } from "./inspection";
import { maintenance } from "./maintenance";
import { ownershipTax } from "./ownership-tax";
import { tiresAndWear } from "./wear";
import { estimateResidualValueDkk } from "./depreciation";
import type {
  Assumptions,
  Car,
  ComparisonResult,
  TcoBreakdown,
  TcoResult,
} from "./types";
import { r } from "./util";

export function computeTco(car: Car, assumptions: Assumptions): TcoResult {
  const { yearsHorizon, annualKm } = assumptions;
  const breakdown: TcoBreakdown = {
    depreciation: depreciation(car, yearsHorizon, annualKm),
    financingInterest: financingInterest(car.priceDkk, assumptions),
    insurance: insuranceEstimate(car, assumptions),
    maintenance: maintenance(car, yearsHorizon, annualKm),
    fuel: fuelCost(car, assumptions),
    ownershipTax: ownershipTax(car, yearsHorizon),
    tiresAndWear: tiresAndWear(car, yearsHorizon, annualKm),
    inspection: inspectionCost(car, yearsHorizon),
  };
  const components = Object.values(breakdown);
  const totalDkk = components.reduce((s, c) => s + c.amountDkk, 0);
  const yearlyCumulativeDkk: number[] = [];
  let acc = 0;
  for (let i = 0; i < yearsHorizon; i++) {
    let yearTotal = 0;
    for (const c of components) yearTotal += c.perYearDkk[i] ?? 0;
    acc += yearTotal;
    yearlyCumulativeDkk.push(r(acc));
  }
  const totalKm = annualKm * yearsHorizon;
  return {
    car,
    assumptions,
    breakdown,
    totalDkk: r(totalDkk),
    totalPerYearDkk: r(totalDkk / yearsHorizon),
    totalPerKmDkk: totalKm > 0 ? totalDkk / totalKm : 0,
    residualValueDkk: estimateResidualValueDkk(car, yearsHorizon, annualKm),
    yearlyCumulativeDkk,
  };
}

export function compareCars(
  carA: Car,
  carB: Car,
  assumptions: Assumptions,
): ComparisonResult {
  const a = computeTco(carA, assumptions);
  const b = computeTco(carB, assumptions);
  return { carA: a, carB: b, deltaDkk: b.totalDkk - a.totalDkk };
}
