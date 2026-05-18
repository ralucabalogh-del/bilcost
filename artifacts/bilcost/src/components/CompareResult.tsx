import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BilcostComparison,
  BilcostTcoResult,
} from "@workspace/api-client-react";
import { formatDkk, formatDkkShort } from "@/lib/format";

const COMPONENT_LABELS: Record<string, string> = {
  depreciation: "Værditab",
  financingInterest: "Renter på lån",
  insurance: "Forsikring",
  maintenance: "Service & rep.",
  fuel: "Brændstof / strøm",
  ownershipTax: "Grøn ejerafgift",
  tiresAndWear: "Dæk & sliddele",
  inspection: "Syn",
};
const COMPONENT_KEYS = Object.keys(COMPONENT_LABELS) as Array<
  keyof BilcostTcoResult["breakdown"]
>;

const COLOR_A = "#0e1117";
const COLOR_B = "#d6435a";

export function CompareResult({ result }: { result: BilcostComparison }) {
  const { carA, carB, deltaDkk } = result;
  const winner = deltaDkk > 0 ? "A" : deltaDkk < 0 ? "B" : "tie";

  return (
    <div className="flex flex-col gap-6">
      <Headline winner={winner} carA={carA} carB={carB} delta={deltaDkk} />
      <div className="grid lg:grid-cols-2 gap-6">
        <SummaryCard result={carA} accent="ink" label="Bil A" />
        <SummaryCard result={carB} accent="red" label="Bil B" />
      </div>
      <BreakdownChart carA={carA} carB={carB} />
      <CumulativeChart carA={carA} carB={carB} />
      <BreakdownTable carA={carA} carB={carB} />
    </div>
  );
}

function Headline({
  winner,
  carA,
  carB,
  delta,
}: {
  winner: "A" | "B" | "tie";
  carA: BilcostTcoResult;
  carB: BilcostTcoResult;
  delta: number;
}) {
  const winnerCar = winner === "A" ? carA : carB;
  const loserCar = winner === "A" ? carB : carA;
  if (winner === "tie") {
    return (
      <div className="rounded-lg border border-ink-200 bg-white p-6">
        <p className="font-display text-2xl text-ink-800">
          De to biler koster det samme over {carA.assumptions.yearsHorizon} år.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-6">
      <div className="text-[11px] uppercase tracking-wider text-ink-400 mb-2">
        Konklusion
      </div>
      <p className="font-display text-2xl text-ink-800">
        <span className="font-semibold">
          {winnerCar.car.make} {winnerCar.car.model}
        </span>{" "}
        er <span className="text-accent-green font-semibold">
          {formatDkkShort(Math.abs(delta))}
        </span>{" "}
        billigere end{" "}
        <span className="text-ink-500">
          {loserCar.car.make} {loserCar.car.model}
        </span>{" "}
        over {carA.assumptions.yearsHorizon} år.
      </p>
      <p className="text-sm text-ink-500 mt-2 tabular">
        Det svarer til ca.{" "}
        {formatDkk(Math.round(Math.abs(delta) / carA.assumptions.yearsHorizon))} pr. år
        — eller{" "}
        {(Math.abs(delta) /
          (carA.assumptions.yearsHorizon * carA.assumptions.annualKm)).toFixed(2)}{" "}
        kr/km.
      </p>
    </div>
  );
}

function SummaryCard({
  result,
  accent,
  label,
}: {
  result: BilcostTcoResult;
  accent: "ink" | "red";
  label: string;
}) {
  const dot = accent === "red" ? "bg-accent-red" : "bg-ink-800";
  const text = accent === "red" ? "text-accent-red" : "text-ink-800";
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`text-[11px] uppercase tracking-wider ${text}`}>
          {label}
        </span>
      </div>
      <div className="font-display text-xl font-semibold text-ink-800">
        {result.car.make} {result.car.model}
      </div>
      <div className="text-sm text-ink-500 mb-3">
        {result.car.variant ?? ""} · {result.car.year}
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <Stat
          label={`Total / ${result.assumptions.yearsHorizon} år`}
          value={formatDkkShort(result.totalDkk)}
          big
        />
        <Stat label="Pr. år" value={formatDkkShort(result.totalPerYearDkk)} />
        <Stat
          label="Pr. km"
          value={`${result.totalPerKmDkk.toFixed(2)} kr`}
        />
        <Stat
          label="Restværdi"
          value={formatDkkShort(result.residualValueDkk)}
        />
        <Stat
          label="Brændstof / strøm"
          value={formatDkkShort(result.breakdown.fuel.amountDkk)}
        />
        <Stat
          label="Værditab"
          value={formatDkkShort(result.breakdown.depreciation.amountDkk)}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div
        className={`tabular text-ink-800 ${big ? "text-xl font-display font-semibold" : "text-sm font-medium"}`}
      >
        {value}
      </div>
    </div>
  );
}

function BreakdownChart({
  carA,
  carB,
}: {
  carA: BilcostTcoResult;
  carB: BilcostTcoResult;
}) {
  const data = COMPONENT_KEYS.map((k) => ({
    component: COMPONENT_LABELS[k],
    A: carA.breakdown[k].amountDkk,
    B: carB.breakdown[k].amountDkk,
  }));
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5">
      <h3 className="font-display text-sm uppercase tracking-wider text-ink-800 mb-4">
        Omkostninger fordelt på poster
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#e8eaed" vertical={false} />
            <XAxis
              dataKey="component"
              tick={{ fontSize: 11, fill: "#6b7480" }}
              interval={0}
              angle={-15}
              dy={10}
              height={50}
            />
            <YAxis
              tickFormatter={(v) => formatDkkShort(v as number)}
              tick={{ fontSize: 11, fill: "#6b7480" }}
            />
            <Tooltip
              formatter={(v) => formatDkk(v as number)}
              labelStyle={{ color: "#0e1117" }}
              contentStyle={{
                fontSize: 12,
                background: "#fff",
                border: "1px solid #cfd3d8",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="A" name={`A: ${carA.car.make}`} fill={COLOR_A} />
            <Bar dataKey="B" name={`B: ${carB.car.make}`} fill={COLOR_B} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CumulativeChart({
  carA,
  carB,
}: {
  carA: BilcostTcoResult;
  carB: BilcostTcoResult;
}) {
  const years = carA.yearlyCumulativeDkk.length;
  const data = Array.from({ length: years }, (_, i) => ({
    year: `År ${i + 1}`,
    A: carA.yearlyCumulativeDkk[i] ?? 0,
    B: carB.yearlyCumulativeDkk[i] ?? 0,
  }));
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5">
      <h3 className="font-display text-sm uppercase tracking-wider text-ink-800 mb-4">
        Kumuleret omkostning år for år
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid stroke="#e8eaed" vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#6b7480" }}
            />
            <YAxis
              tickFormatter={(v) => formatDkkShort(v as number)}
              tick={{ fontSize: 11, fill: "#6b7480" }}
            />
            <Tooltip
              formatter={(v) => formatDkk(v as number)}
              contentStyle={{
                fontSize: 12,
                background: "#fff",
                border: "1px solid #cfd3d8",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="A"
              name={`A: ${carA.car.make}`}
              stroke={COLOR_A}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="B"
              name={`B: ${carB.car.make}`}
              stroke={COLOR_B}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BreakdownTable({
  carA,
  carB,
}: {
  carA: BilcostTcoResult;
  carB: BilcostTcoResult;
}) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5 overflow-x-auto">
      <h3 className="font-display text-sm uppercase tracking-wider text-ink-800 mb-4">
        Detaljeret oversigt
      </h3>
      <table className="w-full text-sm tabular">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-ink-400 border-b border-ink-100">
            <th className="py-2">Post</th>
            <th className="py-2 text-right">A: {carA.car.make}</th>
            <th className="py-2 text-right">B: {carB.car.make}</th>
            <th className="py-2 text-right">Forskel</th>
            <th className="py-2 pl-4">Note</th>
          </tr>
        </thead>
        <tbody>
          {COMPONENT_KEYS.map((k) => {
            const a = carA.breakdown[k].amountDkk;
            const b = carB.breakdown[k].amountDkk;
            const diff = b - a;
            return (
              <tr key={k} className="border-b border-ink-100 last:border-b-0">
                <td className="py-3 text-ink-800">{COMPONENT_LABELS[k]}</td>
                <td className="py-3 text-right text-ink-800">{formatDkk(a)}</td>
                <td className="py-3 text-right text-ink-800">{formatDkk(b)}</td>
                <td
                  className={`py-3 text-right ${diff < 0 ? "text-accent-red" : diff > 0 ? "text-accent-green" : "text-ink-400"}`}
                >
                  {diff > 0 ? "+" : ""}
                  {formatDkk(diff)}
                </td>
                <td className="py-3 pl-4 text-[11px] text-ink-400 max-w-md">
                  {carA.breakdown[k].notes}
                </td>
              </tr>
            );
          })}
          <tr className="font-display font-semibold text-ink-800">
            <td className="py-3">I alt</td>
            <td className="py-3 text-right">{formatDkk(carA.totalDkk)}</td>
            <td className="py-3 text-right">{formatDkk(carB.totalDkk)}</td>
            <td
              className={`py-3 text-right ${carB.totalDkk - carA.totalDkk < 0 ? "text-accent-red" : "text-accent-green"}`}
            >
              {carB.totalDkk - carA.totalDkk > 0 ? "+" : ""}
              {formatDkk(carB.totalDkk - carA.totalDkk)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
