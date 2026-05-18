import type { Assumptions, Car, CostComponent } from "./types";
import { r, repeat } from "./util";

/**
 * Fuel / energy cost.
 *
 * Combustion (petrol, diesel, hybrid): annualKm / consumptionKmPerL × DKK/L.
 * EV: annualKm * (consumptionKwhPer100km / 100) × DKK/kWh.
 * PHEV: 60% electric / 40% combustion mix as a v1 simplification.
 */
export function fuelCost(car: Car, assumptions: Assumptions): CostComponent {
  const { annualKm, fuelPriceDkkPerLiter, electricityPriceDkkPerKwh } =
    assumptions;
  const horizon = assumptions.yearsHorizon;
  let annual = 0;
  let notes = "";
  switch (car.fuelType) {
    case "petrol":
    case "diesel":
    case "hybrid": {
      const km = car.consumptionKmPerL ?? 15;
      annual = (annualKm / km) * fuelPriceDkkPerLiter;
      notes = `${km.toFixed(1)} km/l × ${annualKm.toLocaleString("da-DK")} km/år × ${fuelPriceDkkPerLiter} kr/L.`;
      break;
    }
    case "electric": {
      const kwh = car.consumptionKwhPer100km ?? 18;
      annual = (annualKm * kwh) / 100 * electricityPriceDkkPerKwh;
      notes = `${kwh.toFixed(1)} kWh/100 km × ${annualKm.toLocaleString("da-DK")} km/år × ${electricityPriceDkkPerKwh} kr/kWh.`;
      break;
    }
    case "phev": {
      const kwh = car.consumptionKwhPer100km ?? 18;
      const km = car.consumptionKmPerL ?? 17;
      const elecKm = annualKm * 0.6;
      const fuelKm = annualKm * 0.4;
      const elec = (elecKm * kwh) / 100 * electricityPriceDkkPerKwh;
      const combustion = (fuelKm / km) * fuelPriceDkkPerLiter;
      annual = elec + combustion;
      notes = `Plug-in hybrid: 60% el (${kwh.toFixed(1)} kWh/100 km × ${electricityPriceDkkPerKwh} kr/kWh) + 40% benzin (${km.toFixed(1)} km/l × ${fuelPriceDkkPerLiter} kr/L).`;
      break;
    }
  }
  return {
    amountDkk: r(annual * horizon),
    perYearDkk: repeat(annual, horizon),
    notes,
  };
}
