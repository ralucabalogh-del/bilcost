import type { Car, FuelType } from "@workspace/bilcost-pricing";
import type {
  BilbasenClient,
  BilbasenLogger,
  BilbasenSearchQuery,
  ListingPreview,
} from "./types";
import { SAMPLE_CATALOG } from "./sample-catalog";

/**
 * v1 BilbasenClient.
 *
 * Live mode is ON by default: search and getListing both fetch from
 * bilbasen.dk and parse the embedded Next.js / JSON-LD payload. The
 * caller MUST handle promise rejections — we never silently substitute
 * static data for failed fetches.
 *
 * The curated SAMPLE_CATALOG is only used to resolve the small set of
 * known seed ids (e.g. `vw-id3-2025-new`) so the demo's default
 * comparison loads even when the network is slow. Search results are
 * always live.
 *
 * Every outbound request is reported through the optional logger with
 * `url`, `status`, `durationMs`, and outcome — wire pino in here.
 */
export interface BilbasenClientOptions {
  userAgent?: string;
  /** Minimum milliseconds between live HTTP fetches. */
  throttleMs?: number;
  /** Disable live fetches against bilbasen.dk (testing only). */
  disableLiveFetch?: boolean;
  /** Hard timeout for a single live fetch, in milliseconds. */
  fetchTimeoutMs?: number;
  logger?: BilbasenLogger;
}

const DEFAULT_UA =
  "Bilcost/0.1 (+https://bilcost.example; samtaler@bilcost.example)";

export function createBilbasenClient(
  opts: BilbasenClientOptions = {},
): BilbasenClient {
  const ua = opts.userAgent ?? DEFAULT_UA;
  const throttleMs = opts.throttleMs ?? 1_500;
  const liveEnabled = opts.disableLiveFetch !== true;
  const timeoutMs = opts.fetchTimeoutMs ?? 8_000;
  const log = opts.logger;
  let lastFetchAt = 0;

  async function throttle() {
    const now = Date.now();
    const wait = lastFetchAt + throttleMs - now;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastFetchAt = Date.now();
  }

  async function fetchHtml(url: string): Promise<string> {
    if (!liveEnabled) {
      throw new Error(
        "Bilbasen live-hentning er deaktiveret i denne kontekst.",
      );
    }
    await throttle();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const startedAt = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "da-DK,da;q=0.9,en;q=0.5",
        },
        redirect: "follow",
        signal: ctrl.signal,
      });
      const durationMs = Date.now() - startedAt;
      log?.info(
        { url, status: res.status, durationMs },
        "bilbasen fetch ok",
      );
      if (!res.ok) {
        throw new Error(
          `Bilbasen svarede ${res.status} ${res.statusText} for ${url}`,
        );
      }
      return await res.text();
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const aborted =
        (err as { name?: string } | null)?.name === "AbortError";
      log?.warn(
        {
          url,
          durationMs,
          aborted,
          err: err instanceof Error ? err.message : String(err),
        },
        "bilbasen fetch failed",
      );
      throw err instanceof Error
        ? err
        : new Error("Ukendt fejl ved Bilbasen-opkald.");
    } finally {
      clearTimeout(timer);
    }
  }

  function buildSearchUrl(query: BilbasenSearchQuery): string {
    const u = new URL("https://www.bilbasen.dk/brugt/bil");
    if (query.q) u.searchParams.set("free", query.q);
    if (query.make) u.searchParams.set("make", query.make);
    if (query.model) u.searchParams.set("model", query.model);
    if (query.isNew === true) u.searchParams.set("includeengroscar", "true");
    u.searchParams.set("pagesize", "30");
    return u.toString();
  }

  async function searchLive(
    query: BilbasenSearchQuery,
  ): Promise<ListingPreview[]> {
    const url = buildSearchUrl(query);
    if (!(await isAllowedByRobots(url))) {
      throw new Error(
        "Bilbasen tillader ikke automatisk hentning af denne side (robots.txt).",
      );
    }
    const html = await fetchHtml(url);
    const parsed = parseSearchResults(html);
    if (parsed === null) {
      throw new Error(
        "Kunne ikke aflæse Bilbasens søgeresultater — sidestrukturen kan have ændret sig. Prøv igen senere eller indsæt en URL direkte.",
      );
    }
    return parsed;
  }

  async function getListingLive(rawUrl: string): Promise<Car> {
    if (!(await isAllowedByRobots(rawUrl))) {
      throw new Error(
        "Bilbasen tillader ikke automatisk hentning af denne side (robots.txt).",
      );
    }
    const html = await fetchHtml(rawUrl);
    const car = tryParseListingHtml(html, rawUrl);
    if (!car) {
      throw new Error(
        "Kunne ikke aflæse annoncen — Bilbasens sidestruktur kan have ændret sig. Prøv en anden bil.",
      );
    }
    return car;
  }

  return {
    async searchListings(query) {
      // Always live: the curated catalog is never returned from search.
      // If Bilbasen is unreachable, the call rejects and the route
      // surfaces an explicit error to the user.
      return searchLive(query);
    },
    async getListing(urlOrId) {
      const trimmed = urlOrId.trim();
      if (!trimmed) {
        throw new Error("Ingen URL eller annonce-id angivet.");
      }
      // Resolve known seed ids from the catalog so demo defaults
      // remain stable. Real Bilbasen URLs always go live.
      const sample = SAMPLE_CATALOG.find((c) => c.id === trimmed);
      if (sample) {
        const { id: _id, ...car } = sample;
        void _id;
        return car;
      }
      if (!/^https?:\/\/(www\.)?bilbasen\.dk\//i.test(trimmed)) {
        throw new Error(
          "Indsæt et fuldt link til en bilbasen.dk-annonce, eller vælg fra søgningen.",
        );
      }
      return getListingLive(trimmed);
    },
  };
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

interface ParsedNextJson {
  listings?: unknown[];
}

function tryParseListingHtml(html: string, url: string): Car | null {
  const ldMatch = html.match(
    /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (ldMatch) {
    try {
      const data: unknown = JSON.parse(ldMatch[1] ?? "");
      const obj = pickProductLike(data);
      if (obj) {
        const car = ldObjectToCar(obj, url);
        if (car) return car;
      }
    } catch {
      // fall through to next-data attempt
    }
  }
  const nextMatch = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextMatch) {
    try {
      const data: unknown = JSON.parse(nextMatch[1] ?? "");
      const car = nextDataToCar(data, url);
      if (car) return car;
    } catch {
      // ignore
    }
  }
  return null;
}

function ldObjectToCar(
  obj: Record<string, unknown>,
  url: string,
): Car | null {
  const offers =
    typeof obj["offers"] === "object" && obj["offers"] !== null
      ? (obj["offers"] as Record<string, unknown>)
      : null;
  const priceRaw = offers?.["price"];
  const price =
    typeof priceRaw === "string" ? Number(priceRaw) : Number(priceRaw ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const make = String(
    extractText(obj["brand"]) ?? extractText(obj["manufacturer"]) ?? "Ukendt",
  );
  const model = String(
    extractText(obj["model"]) ?? extractText(obj["name"]) ?? "Ukendt",
  );
  const fuelType = inferFuelType(
    String(obj["fuelType"] ?? obj["vehicleEngine"] ?? ""),
  );
  return {
    make,
    model,
    variant: typeof obj["name"] === "string" ? String(obj["name"]) : null,
    year: Number(
      obj["productionDate"] ??
        obj["releaseDate"] ??
        obj["modelDate"] ??
        new Date().getUTCFullYear(),
    ),
    mileageKm: Number(obj["mileageFromOdometer"] ?? 0),
    priceDkk: Math.round(price),
    fuelType,
    consumptionKmPerL:
      fuelType === "electric"
        ? null
        : numberOrNull(obj["fuelConsumption"]) ?? 15,
    consumptionKwhPer100km:
      fuelType === "electric" ? numberOrNull(obj["fuelConsumption"]) ?? 18 : null,
    co2Gkm: numberOrNull(obj["emissionsCO2"]),
    kerbWeightKg: numberOrNull(obj["weightTotal"] ?? obj["vehicleWeight"]),
    transmission:
      String(obj["vehicleTransmission"] ?? "")
        .toLowerCase()
        .includes("auto")
        ? "automatic"
        : "manual",
    listingUrl: url,
    imageUrl:
      typeof obj["image"] === "string"
        ? String(obj["image"])
        : Array.isArray(obj["image"]) && typeof obj["image"][0] === "string"
          ? String(obj["image"][0])
          : null,
  };
}

function nextDataToCar(data: unknown, url: string): Car | null {
  const node = findFirst(
    data,
    (v) =>
      isObj(v) &&
      typeof v["price"] !== "undefined" &&
      (typeof v["make"] === "string" || typeof v["brand"] === "string"),
  );
  if (!node) return null;
  const obj = node as Record<string, unknown>;
  const price = Number(obj["price"] ?? obj["priceExclVat"] ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  const make = String(obj["make"] ?? obj["brand"] ?? "Ukendt");
  const model = String(obj["model"] ?? "Ukendt");
  const fuelType = inferFuelType(String(obj["fuel"] ?? obj["fuelType"] ?? ""));
  return {
    make,
    model,
    variant:
      typeof obj["variant"] === "string"
        ? String(obj["variant"])
        : typeof obj["headline"] === "string"
          ? String(obj["headline"])
          : null,
    year: Number(obj["year"] ?? obj["modelYear"] ?? new Date().getUTCFullYear()),
    mileageKm: Number(obj["mileage"] ?? obj["km"] ?? 0),
    priceDkk: Math.round(price),
    fuelType,
    consumptionKmPerL:
      fuelType === "electric" ? null : numberOrNull(obj["kmPerLiter"]) ?? 15,
    consumptionKwhPer100km:
      fuelType === "electric" ? numberOrNull(obj["kwhPer100km"]) ?? 18 : null,
    co2Gkm: numberOrNull(obj["co2"]),
    kerbWeightKg: numberOrNull(obj["weight"]),
    transmission: String(obj["gear"] ?? "")
      .toLowerCase()
      .includes("auto")
      ? "automatic"
      : "manual",
    listingUrl: url,
    imageUrl:
      typeof obj["imageUrl"] === "string" ? String(obj["imageUrl"]) : null,
  };
}

/**
 * Returns parsed previews on success, an empty array if the page loaded
 * but contained zero listings (a legitimate "no matches" outcome), or
 * null if no parsable structure was recognised at all (page shape
 * changed — caller should surface an explicit error).
 */
function parseSearchResults(html: string): ListingPreview[] | null {
  let recognised = false;
  const out: ListingPreview[] = [];
  const nextMatch = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextMatch) {
    try {
      const data: unknown = JSON.parse(nextMatch[1] ?? "");
      const arr = findFirst(
        data,
        (v): v is ParsedNextJson =>
          isObj(v) && Array.isArray((v as ParsedNextJson).listings),
      );
      if (arr) {
        recognised = true;
        for (const item of (arr as ParsedNextJson).listings ?? []) {
          if (!isObj(item)) continue;
          const preview = nextDataToPreview(item);
          if (preview) out.push(preview);
        }
        if (out.length > 0) return out;
      }
    } catch {
      // fall through to JSON-LD attempt
    }
  }
  const ldRegex =
    /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const data: unknown = JSON.parse(match[1] ?? "");
      collectProductLike(data, (obj) => {
        recognised = true;
        const url = typeof obj["url"] === "string" ? String(obj["url"]) : null;
        if (!url) return;
        const car = ldObjectToCar(obj, url);
        if (!car) return;
        out.push(toPreviewFromCar(url, car));
      });
    } catch {
      // skip
    }
  }
  if (!recognised) return null;
  return out;
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

let robotsCache: { fetchedAt: number; disallow: string[] } | null = null;
const ROBOTS_TTL_MS = 60 * 60 * 1000;

async function isAllowedByRobots(targetUrl: string): Promise<boolean> {
  try {
    const u = new URL(targetUrl);
    const now = Date.now();
    if (!robotsCache || now - robotsCache.fetchedAt > ROBOTS_TTL_MS) {
      const robotsRes = await fetch(`${u.origin}/robots.txt`, {
        redirect: "follow",
      });
      const txt = robotsRes.ok ? await robotsRes.text() : "";
      robotsCache = { fetchedAt: now, disallow: parseRobots(txt) };
    }
    const path = u.pathname + (u.search ?? "");
    for (const rule of robotsCache.disallow) {
      if (rule && path.startsWith(rule)) return false;
    }
    return true;
  } catch {
    // If robots can't be fetched, default to allowed but log via thrown
    // path is undesirable; assume allowed and let downstream decide.
    return true;
  }
}

function parseRobots(txt: string): string[] {
  // Minimal parser: collect Disallow rules under the `*` user-agent.
  const lines = txt.split(/\r?\n/);
  const disallow: string[] = [];
  let inStar = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const val = m[2]!;
    if (key === "user-agent") {
      inStar = val.trim() === "*";
    } else if (inStar && key === "disallow" && val) {
      disallow.push(val);
    }
  }
  return disallow;
}

function nextDataToPreview(item: Record<string, unknown>): ListingPreview | null {
  const id = String(
    item["id"] ?? item["listingId"] ?? item["url"] ?? "",
  );
  const url =
    typeof item["url"] === "string"
      ? String(item["url"])
      : typeof item["listingUrl"] === "string"
        ? String(item["listingUrl"])
        : "";
  if (!url) return null;
  const fullUrl = url.startsWith("http")
    ? url
    : `https://www.bilbasen.dk${url}`;
  const make = String(item["make"] ?? item["brand"] ?? "Ukendt");
  const model = String(item["model"] ?? "Ukendt");
  const price = Number(item["price"] ?? 0);
  if (!price) return null;
  return {
    id: id || fullUrl,
    make,
    model,
    variant:
      typeof item["variant"] === "string"
        ? String(item["variant"])
        : typeof item["headline"] === "string"
          ? String(item["headline"])
          : null,
    year: Number(item["year"] ?? new Date().getUTCFullYear()),
    mileageKm: Number(item["mileage"] ?? item["km"] ?? 0),
    priceDkk: Math.round(price),
    fuelType: inferFuelType(String(item["fuel"] ?? item["fuelType"] ?? "")),
    imageUrl:
      typeof item["imageUrl"] === "string" ? String(item["imageUrl"]) : null,
    listingUrl: fullUrl,
  };
}

function toPreviewFromCar(url: string, car: Car): ListingPreview {
  return {
    id: url,
    make: car.make,
    model: car.model,
    variant: car.variant,
    year: car.year,
    mileageKm: car.mileageKm,
    priceDkk: car.priceDkk,
    fuelType: car.fuelType,
    imageUrl: car.imageUrl,
    listingUrl: car.listingUrl ?? url,
  };
}

function pickProductLike(data: unknown): Record<string, unknown> | null {
  let found: Record<string, unknown> | null = null;
  collectProductLike(data, (obj) => {
    if (!found) found = obj;
  });
  return found;
}

function collectProductLike(
  data: unknown,
  cb: (obj: Record<string, unknown>) => void,
): void {
  if (Array.isArray(data)) {
    for (const item of data) collectProductLike(item, cb);
    return;
  }
  if (isObj(data)) {
    const t = data["@type"];
    if (
      t === "Vehicle" ||
      t === "Car" ||
      t === "Product" ||
      (Array.isArray(t) &&
        t.some((x) => x === "Vehicle" || x === "Car" || x === "Product"))
    ) {
      cb(data);
    }
    if (Array.isArray(data["@graph"])) collectProductLike(data["@graph"], cb);
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function findFirst<T>(
  data: unknown,
  pred: (v: unknown) => v is T,
): T | null;
function findFirst(
  data: unknown,
  pred: (v: unknown) => boolean,
): unknown | null;
function findFirst(
  data: unknown,
  pred: (v: unknown) => boolean,
): unknown | null {
  const seen = new WeakSet<object>();
  const stack: unknown[] = [data];
  while (stack.length) {
    const v = stack.pop();
    if (pred(v)) return v;
    if (v && typeof v === "object") {
      if (seen.has(v as object)) continue;
      seen.add(v as object);
      if (Array.isArray(v)) {
        for (const x of v) stack.push(x);
      } else {
        for (const x of Object.values(v as Record<string, unknown>)) {
          stack.push(x);
        }
      }
    }
  }
  return null;
}

function extractText(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (isObj(v) && typeof v["name"] === "string") return String(v["name"]);
  return null;
}

function numberOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function inferFuelType(raw: string): FuelType {
  const r = raw.toLowerCase();
  if (r.includes("el") && !r.includes("diesel")) return "electric";
  if (r.includes("electric")) return "electric";
  if (r.includes("plug")) return "phev";
  if (r.includes("hybrid")) return "hybrid";
  if (r.includes("diesel")) return "diesel";
  return "petrol";
}
