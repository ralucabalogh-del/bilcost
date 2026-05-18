import { useState } from "react";
import { useBilcostSearchListings } from "@workspace/api-client-react";
import type { BilcostListingPreview } from "@workspace/api-client-react";
import { formatDkkShort, formatKm, fuelLabel } from "@/lib/format";
import { t } from "@/lib/i18n";

interface Props {
  label: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  defaultFilter?: { isNew?: boolean };
  accent: "ink" | "red";
  selectedPreview: BilcostListingPreview | null;
}

const BILBASEN_URL_RE = /^https?:\/\/(www\.)?bilbasen\.dk\//i;

export function CarPicker({
  label,
  selectedId,
  selectedPreview,
  onSelect,
  defaultFilter,
  accent,
}: Props) {
  const [q, setQ] = useState("");
  const [pasteUrl, setPasteUrl] = useState("");
  const isNewFilter = defaultFilter?.isNew;
  const { data, isLoading, error } = useBilcostSearchListings({
    q: q || undefined,
    isNew: isNewFilter,
  });

  const submitPasted = () => {
    const v = pasteUrl.trim();
    if (!v) return;
    if (!BILBASEN_URL_RE.test(v)) return;
    onSelect(v);
    setPasteUrl("");
  };
  const accentBar = accent === "red" ? "bg-accent-red" : "bg-ink-800";
  const accentText = accent === "red" ? "text-accent-red" : "text-ink-800";

  return (
    <div className="rounded-lg border border-ink-100 bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${accentBar}`} />
        <h2 className={`font-display text-sm uppercase tracking-wider ${accentText}`}>
          {label}
        </h2>
      </div>
      {selectedId && selectedPreview ? (
        <SelectedCar preview={selectedPreview} onClear={() => onSelect(null)} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-ink-400">
              {t("picker.paste.label")}
            </span>
            <div className="flex gap-2">
              <input
                type="url"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitPasted();
                  }
                }}
                placeholder={t("picker.paste.placeholder")}
                className="flex-1 px-3 py-2 rounded-md border border-ink-200 text-sm focus:outline-none focus:border-ink-800"
              />
              <button
                type="button"
                onClick={submitPasted}
                disabled={!BILBASEN_URL_RE.test(pasteUrl.trim())}
                className="px-3 py-2 rounded-md bg-ink-800 text-paper text-sm disabled:opacity-30"
              >
                {t("picker.paste.submit")}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-400">
            <div className="flex-1 h-px bg-ink-100" />
            <span>{t("picker.divider")}</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              isNewFilter
                ? t("picker.search.placeholder.new")
                : t("picker.search.placeholder.used")
            }
            className="w-full px-3 py-2 rounded-md border border-ink-200 text-sm focus:outline-none focus:border-ink-800"
          />
          <div className="max-h-72 overflow-auto rounded-md border border-ink-100 bg-paper-soft">
            {isLoading && (
              <div className="px-3 py-4 text-xs text-ink-400">
                {t("picker.loading")}
              </div>
            )}
            {!isLoading && error && (
              <div className="px-3 py-4 text-xs text-accent-red">
                {t("picker.error")}
              </div>
            )}
            {!isLoading && !error && (data ?? []).length === 0 && (
              <div className="px-3 py-4 text-xs text-ink-400">
                {t("picker.empty")}
              </div>
            )}
            {(data ?? []).map((l) => (
              <ListingRow
                key={l.id}
                preview={l}
                onSelect={() => onSelect(l.listingUrl || l.id)}
              />
            ))}
          </div>
          <p className="text-[11px] text-ink-400">{t("picker.footnote")}</p>
        </div>
      )}
    </div>
  );
}

function ListingRow({
  preview,
  onSelect,
}: {
  preview: BilcostListingPreview;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-3 py-2 hover:bg-white border-b border-ink-100 last:border-b-0 flex items-center justify-between gap-3"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-ink-800">
          {preview.make} {preview.model}
        </span>
        <span className="text-[11px] text-ink-400">
          {preview.variant ?? ""} · {preview.year} ·{" "}
          {fuelLabel(preview.fuelType)} ·{" "}
          {preview.mileageKm > 0 ? formatKm(preview.mileageKm) : "Ny"}
        </span>
      </div>
      <span className="text-sm font-medium tabular text-ink-800">
        {formatDkkShort(preview.priceDkk)}
      </span>
    </button>
  );
}

function SelectedCar({
  preview,
  onClear,
}: {
  preview: BilcostListingPreview;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-lg font-display font-semibold text-ink-800">
        {preview.make} {preview.model}
      </div>
      <div className="text-sm text-ink-500">
        {preview.variant ?? ""} · {preview.year} · {fuelLabel(preview.fuelType)}
        {preview.mileageKm > 0 ? ` · ${formatKm(preview.mileageKm)}` : " · Ny"}
      </div>
      <div className="text-2xl font-display font-semibold tabular text-ink-800 mt-1">
        {formatDkkShort(preview.priceDkk)}
      </div>
      {preview.listingUrl && (
        <a
          href={preview.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-ink-400 hover:text-ink-800 underline self-start"
        >
          Se reference på bilbasen.dk ↗
        </a>
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-xs text-ink-400 hover:text-ink-800 underline self-start mt-1"
      >
        Vælg en anden bil
      </button>
    </div>
  );
}
