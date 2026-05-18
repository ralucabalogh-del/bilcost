import type { Assumptions, CostComponent } from "./types";
import { r } from "./util";

/**
 * Total interest paid on a standard amortising annuitetslån over the
 * loan term. If the ownership horizon is shorter than the loan term we
 * pro-rate, since paying off the loan early means you pay less interest
 * but also need to settle the remaining principal at sale time. v1
 * model: assume sale proceeds cover any remaining principal exactly
 * (i.e. the buyer absorbs only the interest portion of payments made
 * during ownership).
 */
export function financingInterest(
  priceDkk: number,
  assumptions: Assumptions,
): CostComponent {
  const principal = Math.max(0, priceDkk - assumptions.downPaymentDkk);
  const rate = assumptions.loanInterestPct / 100;
  const n = assumptions.loanTermYears;
  const horizon = assumptions.yearsHorizon;
  if (principal === 0 || n === 0) {
    return {
      amountDkk: 0,
      perYearDkk: Array.from({ length: horizon }, () => 0),
      notes: "Ingen finansiering — bilen er betalt kontant.",
    };
  }
  // Annuity factor: monthly compounding for accuracy with bank loans.
  const months = n * 12;
  const monthlyRate = rate / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const perYearDkk: number[] = [];
  let balance = principal;
  for (let year = 0; year < horizon; year++) {
    let interestThisYear = 0;
    for (let m = 0; m < 12; m++) {
      if (year >= n) break;
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(balance, monthlyPayment - interest);
      interestThisYear += interest;
      balance -= principalPaid;
      if (balance < 0.01) {
        balance = 0;
        break;
      }
    }
    perYearDkk.push(r(interestThisYear));
  }
  const total = perYearDkk.reduce((s, v) => s + v, 0);
  return {
    amountDkk: total,
    perYearDkk,
    notes: `Annuitetslån på ${principal.toLocaleString("da-DK")} kr over ${n} år ved ${assumptions.loanInterestPct}% ÅOP. Beregningen antager månedlig terminsbetaling og at evt. restgæld ved salg dækkes 1:1 af salgssummen.`,
  };
}
