import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import {
  BilcostCompareCarsBody,
  BilcostSearchListingsQueryParams,
  BilcostGetListingQueryParams,
} from "@workspace/api-zod";
import { createBilbasenClient, type BilbasenLogger } from "@workspace/bilbasen";
import {
  DEFAULT_ASSUMPTIONS,
  compareCars,
  type Assumptions,
  type Car,
} from "@workspace/bilcost-pricing";
import { db } from "@workspace/db";
import {
  bilcostListingCacheTable,
  bilcostSearchCacheTable,
} from "@workspace/db";
const router: IRouter = Router();

function loggerFor(req: Request): BilbasenLogger {
  // pino's child logger satisfies the BilbasenLogger contract.
  return req.log as unknown as BilbasenLogger;
}

// In-memory token bucket per IP for the bilcost surface.
// 30 requests per minute is enough for casual interactive use.
const RATE_LIMIT_PER_MIN = 30;
const buckets = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(req: Request, res: Response): boolean {
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart > 60_000) {
    buckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_PER_MIN) {
    res.status(429).json({ error: "For mange forespørgsler. Prøv igen om lidt." });
    return false;
  }
  return true;
}

const SEARCH_TTL_SEC = 60 * 60; // 1h
const LISTING_TTL_SEC = 60 * 60 * 24; // 24h

router.get("/bilcost/search", async (req, res) => {
  if (!checkRateLimit(req, res)) return;
  // Normalize `isNew` ourselves: zod.coerce.boolean() treats any
  // non-empty string as true, which would silently flip "false" → true.
  const rawIsNew =
    typeof req.query.isNew === "string" ? req.query.isNew.toLowerCase() : null;
  const normalized = {
    ...req.query,
    isNew:
      rawIsNew === "true"
        ? true
        : rawIsNew === "false"
          ? false
          : undefined,
  };
  const parsed = BilcostSearchListingsQueryParams.safeParse(normalized);
  if (!parsed.success) {
    res.status(400).json({ error: "Ugyldige søgeparametre." });
    return;
  }
  const queryKey = JSON.stringify(parsed.data);
  const startedAt = Date.now();
  try {
    const cached = await db
      .select()
      .from(bilcostSearchCacheTable)
      .where(
        and(
          eq(bilcostSearchCacheTable.queryKey, queryKey),
          gt(bilcostSearchCacheTable.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (cached[0]) {
      req.log.info(
        {
          op: "bilcost.search",
          queryKey,
          status: 200,
          durationMs: Date.now() - startedAt,
          cache: "hit",
          resultCount: Array.isArray(cached[0].payload)
            ? (cached[0].payload as unknown[]).length
            : 0,
        },
        "bilcost search cache hit",
      );
      res.json(cached[0].payload);
      return;
    }
    const liveClient = createBilbasenClient({ logger: loggerFor(req) });
    const data = await liveClient.searchListings(parsed.data);
    const expiresAt = new Date(Date.now() + SEARCH_TTL_SEC * 1000);
    await db
      .insert(bilcostSearchCacheTable)
      .values({ queryKey, payload: data, expiresAt })
      .onConflictDoUpdate({
        target: bilcostSearchCacheTable.queryKey,
        set: { payload: data, expiresAt, fetchedAt: new Date() },
      });
    req.log.info(
      {
        op: "bilcost.search",
        queryKey,
        status: 200,
        durationMs: Date.now() - startedAt,
        cache: "miss",
        resultCount: data.length,
      },
      "bilcost search served",
    );
    res.json(data);
  } catch (err) {
    req.log.warn(
      {
        op: "bilcost.search",
        queryKey,
        status: 502,
        durationMs: Date.now() - startedAt,
        cache: "miss",
        err: err instanceof Error ? err.message : String(err),
      },
      "bilcost search failed",
    );
    const message =
      err instanceof Error
        ? err.message
        : "Kunne ikke hente søgeresultater fra Bilbasen.";
    res.status(502).json({ error: message });
  }
});

router.get("/bilcost/listing", async (req, res) => {
  if (!checkRateLimit(req, res)) return;
  const parsed = BilcostGetListingQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Mangler URL eller annonce-id." });
    return;
  }
  const sourceKey = parsed.data.urlOrId;
  const startedAt = Date.now();
  try {
    const cached = await db
      .select()
      .from(bilcostListingCacheTable)
      .where(
        and(
          eq(bilcostListingCacheTable.sourceKey, sourceKey),
          gt(bilcostListingCacheTable.expiresAt, new Date()),
        ),
      )
      .limit(1);
    if (cached[0]) {
      req.log.info(
        {
          op: "bilcost.listing",
          url: sourceKey,
          status: 200,
          durationMs: Date.now() - startedAt,
          cache: "hit",
        },
        "bilcost listing cache hit",
      );
      res.json(cached[0].payload);
      return;
    }
    const liveClient = createBilbasenClient({ logger: loggerFor(req) });
    const car = await liveClient.getListing(sourceKey);
    const expiresAt = new Date(Date.now() + LISTING_TTL_SEC * 1000);
    await db
      .insert(bilcostListingCacheTable)
      .values({
        sourceKey,
        url: car.listingUrl ?? sourceKey,
        payload: car,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: bilcostListingCacheTable.sourceKey,
        set: {
          payload: car,
          url: car.listingUrl ?? sourceKey,
          expiresAt,
          fetchedAt: new Date(),
        },
      });
    req.log.info(
      {
        op: "bilcost.listing",
        url: sourceKey,
        status: 200,
        durationMs: Date.now() - startedAt,
        cache: "miss",
      },
      "bilcost listing served",
    );
    res.json(car);
  } catch (err) {
    req.log.warn(
      {
        op: "bilcost.listing",
        url: sourceKey,
        status: 400,
        durationMs: Date.now() - startedAt,
        cache: "miss",
        err: err instanceof Error ? err.message : String(err),
      },
      "bilcost listing failed",
    );
    const message =
      err instanceof Error
        ? err.message
        : "Kunne ikke hente bil fra Bilbasen.";
    res.status(400).json({ error: message });
  }
});

router.get("/bilcost/assumptions/defaults", (_req, res) => {
  res.json(DEFAULT_ASSUMPTIONS);
});

router.post("/bilcost/compare", (req, res) => {
  if (!checkRateLimit(req, res)) return;
  const parsed = BilcostCompareCarsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Ugyldigt input: " + parsed.error.issues.map((i) => i.message).join(", "),
    });
    return;
  }
  const { carA, carB, assumptions } = parsed.data;
  try {
    const result = compareCars(
      carA as Car,
      carB as Car,
      assumptions as Assumptions,
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "bilcost compare failed");
    res.status(500).json({ error: "Beregning mislykkedes." });
  }
});

export default router;
