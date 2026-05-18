import { useEffect, useMemo, useState } from "react";
import {
  useBilcostCompareCars,
  useBilcostGetDefaultAssumptions,
  useBilcostGetListing,
} from "@workspace/api-client-react";
import type {
  BilcostAssumptions,
  BilcostCar,
  BilcostListingPreview,
} from "@workspace/api-client-react";
import { CarPicker } from "@/components/CarPicker";
import { AssumptionsForm } from "@/components/AssumptionsForm";
import { CompareResult } from "@/components/CompareResult";
import { t } from "@/lib/i18n";

function carToPreview(
  id: string,
  car: BilcostCar | undefined,
): BilcostListingPreview | null {
  if (!car) return null;
  return {
    id,
    make: car.make,
    model: car.model,
    variant: car.variant ?? null,
    year: car.year,
    mileageKm: car.mileageKm,
    priceDkk: car.priceDkk,
    fuelType: car.fuelType,
    imageUrl: car.imageUrl ?? null,
    listingUrl: car.listingUrl ?? id,
  };
}

export function ComparePage() {
  const { data: defaults } = useBilcostGetDefaultAssumptions();
  const [assumptions, setAssumptions] = useState<BilcostAssumptions | null>(
    null,
  );
  useEffect(() => {
    if (defaults && !assumptions) setAssumptions(defaults);
  }, [defaults, assumptions]);

  // Defaults are seed ids resolvable by the server's curated catalogue,
  // so the page lights up instantly. Once a user picks/pastes, the
  // selection key becomes a Bilbasen URL.
  const [aId, setAId] = useState<string | null>("vw-id3-2025-new");
  const [bId, setBId] = useState<string | null>("vw-id3-2021-used");

  const carAQ = useBilcostGetListing({ urlOrId: aId ?? "" });
  const carBQ = useBilcostGetListing({ urlOrId: bId ?? "" });

  // Preview for the picker comes straight from the resolved Car —
  // works for sample ids, pasted URLs, and search-result URLs alike.
  const previewA = useMemo(
    () => carToPreview(aId ?? "", carAQ.data as BilcostCar | undefined),
    [aId, carAQ.data],
  );
  const previewB = useMemo(
    () => carToPreview(bId ?? "", carBQ.data as BilcostCar | undefined),
    [bId, carBQ.data],
  );

  const compareMut = useBilcostCompareCars();

  useEffect(() => {
    if (!assumptions) return;
    const carA = carAQ.data;
    const carB = carBQ.data;
    if (!carA || !carB) return;
    compareMut.mutate({
      data: {
        carA: carA as BilcostCar,
        carB: carB as BilcostCar,
        assumptions,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carAQ.data, carBQ.data, assumptions]);

  const result = compareMut.data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink-800 leading-tight">
          {t("compare.heading.before")}{" "}
          <em className="not-italic text-accent-red">
            {t("compare.heading.emph")}
          </em>{" "}
          {t("compare.heading.after")}
        </h1>
        <p className="text-ink-500 mt-2 max-w-2xl">{t("compare.lede")}</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <CarPicker
          label={t("compare.cardA")}
          accent="ink"
          selectedId={aId}
          selectedPreview={previewA}
          onSelect={setAId}
          defaultFilter={{ isNew: true }}
        />
        <CarPicker
          label={t("compare.cardB")}
          accent="red"
          selectedId={bId}
          selectedPreview={previewB}
          onSelect={setBId}
          defaultFilter={{ isNew: false }}
        />
      </div>
      {assumptions && (
        <AssumptionsForm value={assumptions} onChange={setAssumptions} />
      )}
      {compareMut.isPending && (
        <div className="text-sm text-ink-400">{t("compare.calculating")}</div>
      )}
      {compareMut.error && (
        <div className="rounded-lg border border-accent-red bg-white p-4 text-sm text-accent-red">
          {t("compare.error.calc")}
        </div>
      )}
      {(carAQ.error || carBQ.error) && (
        <div className="rounded-lg border border-accent-red bg-white p-4 text-sm text-accent-red">
          {t("compare.error.fetch")}
        </div>
      )}
      {result && <CompareResult result={result} />}
    </div>
  );
}
