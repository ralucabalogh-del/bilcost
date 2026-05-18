import type { Assumptions } from "./types";

/**
 * Default Danish-market assumptions for v1.
 *
 * Sources (May 2026 snapshot, see "Sådan regner vi" page in the UI):
 *  - Fuel price (petrol 95): ~13.5 DKK/L, derived from running 12-month
 *    average at Circle K / OK / Shell DK. Diesel slightly lower in practice
 *    but we use a single combustion price for simplicity.
 *  - Electricity: ~2.6 DKK/kWh (incl. moms + afgifter), Energinet residential
 *    avg. Home charging is the dominant case; rapid DC fast charging is
 *    higher but ignored in v1.
 *  - Annual mileage: 15.000 km is the Danish private car average (Statistics
 *    Denmark, 2024).
 *  - Loan: 5 years at 7.0% APR is a typical Danish "biloan" through a bank.
 */
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  yearsHorizon: 5,
  annualKm: 15_000,
  downPaymentDkk: 25_000,
  loanInterestPct: 7.0,
  loanTermYears: 5,
  fuelPriceDkkPerLiter: 14,
  electricityPriceDkkPerKwh: 3,
  insuranceAnnualDkkOverride: null,
  driverAgeBand: "30_49",
  postalCode: "2100",
};
