import type { BilcostAssumptions } from "@workspace/api-client-react";

interface Props {
  value: BilcostAssumptions;
  onChange: (next: BilcostAssumptions) => void;
}

export function AssumptionsForm({ value, onChange }: Props) {
  const set = <K extends keyof BilcostAssumptions>(
    k: K,
    v: BilcostAssumptions[K],
  ) => onChange({ ...value, [k]: v });

  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5">
      <h3 className="font-display text-sm uppercase tracking-wider text-ink-800 mb-4">
        Dine forudsætninger
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <NumberField
          label="Tidshorisont"
          unit="år"
          value={value.yearsHorizon}
          min={1}
          max={15}
          step={1}
          onChange={(v) => set("yearsHorizon", v)}
        />
        <NumberField
          label="Årligt kørsel"
          unit="km"
          value={value.annualKm}
          min={1000}
          max={80000}
          step={1000}
          onChange={(v) => set("annualKm", v)}
        />
        <NumberField
          label="Udbetaling"
          unit="kr"
          value={value.downPaymentDkk}
          min={0}
          max={5_000_000}
          step={5000}
          onChange={(v) => set("downPaymentDkk", v)}
        />
        <NumberField
          label="Lånerente"
          unit="%"
          value={value.loanInterestPct}
          min={0}
          max={30}
          step={0.1}
          onChange={(v) => set("loanInterestPct", v)}
        />
        <NumberField
          label="Løbetid"
          unit="år"
          value={value.loanTermYears}
          min={0}
          max={15}
          step={1}
          onChange={(v) => set("loanTermYears", v)}
        />
        <NumberField
          label="Brændstof"
          unit="kr/l"
          value={value.fuelPriceDkkPerLiter}
          min={0}
          max={50}
          step={0.1}
          onChange={(v) => set("fuelPriceDkkPerLiter", v)}
        />
        <NumberField
          label="El-pris"
          unit="kr/kWh"
          value={value.electricityPriceDkkPerKwh}
          min={0}
          max={20}
          step={0.1}
          onChange={(v) => set("electricityPriceDkkPerKwh", v)}
        />
        <SelectField
          label="Førerens alder"
          value={value.driverAgeBand}
          options={[
            { v: "under_25", l: "Under 25 år" },
            { v: "25_29", l: "25–29 år" },
            { v: "30_49", l: "30–49 år" },
            { v: "50_64", l: "50–64 år" },
            { v: "65_plus", l: "65+ år" },
          ]}
          onChange={(v) =>
            set("driverAgeBand", v as BilcostAssumptions["driverAgeBand"])
          }
        />
        <TextField
          label="Postnr."
          value={value.postalCode}
          onChange={(v) => set("postalCode", v)}
          placeholder="2100"
        />
        <NumberField
          label="Forsikring (overstyr)"
          unit="kr/år"
          value={value.insuranceAnnualDkkOverride ?? 0}
          min={0}
          max={100_000}
          step={500}
          allowZeroAsNull
          onChange={(v) =>
            set("insuranceAnnualDkkOverride", v === 0 ? null : v)
          }
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  allowZeroAsNull,
}: {
  label: string;
  unit: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  allowZeroAsNull?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="w-full px-3 py-2 pr-12 rounded-md border border-ink-200 text-sm tabular focus:outline-none focus:border-ink-800"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
          {unit}
        </span>
      </div>
      {allowZeroAsNull && (
        <span className="text-[10px] text-ink-400">0 = brug estimat</span>
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm bg-white focus:outline-none focus:border-ink-800"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm focus:outline-none focus:border-ink-800"
      />
    </label>
  );
}
