/**
 * Minimal i18n layer.
 *
 * Danish is the primary language; English strings are kept side-by-side
 * so the surface is fully translatable when we ship a language picker.
 * The active locale is read from `localStorage` (key `bilcost.locale`)
 * and falls back to Danish.
 *
 * Usage:
 *   import { t } from "@/lib/i18n";
 *   <h1>{t("compare.heading")}</h1>
 *
 * Translations support a small `${key}` interpolation syntax for the
 * few places we need it.
 */

export type Locale = "da" | "en";

const dict = {
  "header.tagline": {
    da: "Ny vs. brugt — total ejeromkostning",
    en: "New vs. used — total cost of ownership",
  },
  "header.nav.compare": { da: "Sammenlign", en: "Compare" },
  "header.nav.methodology": { da: "Sådan regner vi", en: "Methodology" },

  "compare.heading.before": { da: "Hvad koster en bil", en: "What does a car" },
  "compare.heading.emph": { da: "virkelig", en: "really" },
  "compare.heading.after": { da: "over tid?", en: "cost over time?" },
  "compare.lede": {
    da: "Vælg en ny og en brugt bil, justér dine forudsætninger, og se den totale ejeromkostning side om side — værditab, lånerenter, forsikring, brændstof og det hele. Beregningen sker på dansk grundlag (DKK, grøn ejerafgift, kasko-takster).",
    en: "Pick a new and a used car, tweak your assumptions, and see the total cost of ownership side by side — depreciation, loan interest, insurance, fuel and everything else. Calculated on Danish ground rules (DKK, green ownership tax, insurance rates).",
  },
  "compare.cardA": { da: "Bil A — fx ny", en: "Car A — e.g. new" },
  "compare.cardB": { da: "Bil B — fx brugt", en: "Car B — e.g. used" },
  "compare.calculating": { da: "Beregner…", en: "Calculating…" },
  "compare.error.calc": {
    da: "Beregning fejlede. Prøv at vælge biler igen.",
    en: "Calculation failed. Try picking the cars again.",
  },
  "compare.error.fetch": {
    da: "Kunne ikke hente bildata fra serveren.",
    en: "Couldn't fetch car data from the server.",
  },

  "picker.paste.label": {
    da: "Indsæt link til en Bilbasen-annonce",
    en: "Paste a Bilbasen listing URL",
  },
  "picker.paste.placeholder": {
    da: "https://www.bilbasen.dk/brugt/bil/…",
    en: "https://www.bilbasen.dk/brugt/bil/…",
  },
  "picker.paste.submit": { da: "Brug", en: "Use" },
  "picker.divider": { da: "eller søg", en: "or search" },
  "picker.search.placeholder.new": {
    da: "Søg ny bil (fx Tesla Model 3)…",
    en: "Search new car (e.g. Tesla Model 3)…",
  },
  "picker.search.placeholder.used": {
    da: "Søg brugt bil…",
    en: "Search used car…",
  },
  "picker.loading": {
    da: "Henter fra bilbasen.dk…",
    en: "Fetching from bilbasen.dk…",
  },
  "picker.error": {
    da: "Bilbasen kunne ikke nås lige nu. Indsæt en URL ovenfor i stedet, eller prøv igen.",
    en: "Bilbasen is unreachable right now. Paste a URL above or try again.",
  },
  "picker.empty": {
    da: "Ingen biler matcher. Prøv et andet søgeord.",
    en: "No cars match. Try a different search.",
  },
  "picker.footnote": {
    da: "Live-data fra bilbasen.dk. Resultater caches i 1 time.",
    en: "Live data from bilbasen.dk. Results are cached for 1 hour.",
  },
  "picker.clear": { da: "Skift bil", en: "Change car" },

  "footer.disclaimer.head": {
    da: "Bilcost er et uafhængigt værktøj — ikke tilknyttet Bilbasen ApS, FDM, Skat eller nogen forsikringsselskaber.",
    en: "Bilcost is an independent tool — not affiliated with Bilbasen ApS, FDM, Skat or any insurance company.",
  },
  "footer.disclaimer.body.before": {
    da: "Tal fra annoncer er hentet til oplysningsformål. Brug det som udgangspunkt for din egen beregning, ikke som facit. Forsikrings-, afgifts- og brændstofpriser er estimater baseret på offentligt tilgængelige takster pr. maj 2026 og bør verificeres hos dit forsikringsselskab og på",
    en: "Numbers from listings are for informational purposes only. Use them as a starting point for your own calculation, not as the final word. Insurance, tax and fuel prices are estimates based on publicly available rates as of May 2026 and should be verified with your insurer and at",
  },

  "methodology.heading": { da: "Sådan regner vi", en: "How we calculate" },
  "methodology.lede": {
    da: "Bilcost bruger en simpel, gennemskuelig model. Alt sker i danske kroner med danske takster pr. maj 2026. Tallene er estimater — slå dine egne præmier og brændstofpriser op for nøjagtig beregning.",
    en: "Bilcost uses a simple, transparent model. Everything is in Danish kroner with Danish rates as of May 2026. The numbers are estimates — look up your own premiums and fuel prices for an exact calculation.",
  },
  "methodology.datasource.title": { da: "Datakilde", en: "Data source" },
  "methodology.datasource.body": {
    da: "Bilcost henter annoncer live fra Bilbasen.dk når du søger eller indsætter et link. Resultaterne caches kortvarigt for at skåne deres servere, og vi følger deres robots.txt. Den lille indbyggede demo-katalog bruges kun til at lade standard-sammenligningen indlæse hurtigt.",
    en: "Bilcost fetches listings live from Bilbasen.dk when you search or paste a URL. Results are cached briefly to be polite to their servers, and we honour their robots.txt. The small built-in demo catalogue only exists so the default comparison loads quickly.",
  },
  "methodology.notyet.title": {
    da: "Hvad vi ikke regner med (endnu)",
    en: "What we don't account for (yet)",
  },
} as const;

export type DictKey = keyof typeof dict;

let active: Locale =
  (typeof window !== "undefined" &&
    (window.localStorage?.getItem("bilcost.locale") as Locale | null)) ||
  "da";

export function setLocale(l: Locale): void {
  active = l;
  if (typeof window !== "undefined") {
    window.localStorage?.setItem("bilcost.locale", l);
  }
}

export function getLocale(): Locale {
  return active;
}

export function t(
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  const entry = dict[key];
  if (!entry) return key;
  let s: string = entry[active] ?? entry.da;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`\${${k}}`, String(v));
    }
  }
  return s;
}
