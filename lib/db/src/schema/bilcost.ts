import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const bilcostListingCacheTable = pgTable(
  "bilcost_listing_cache",
  {
    id: serial("id").primaryKey(),
    sourceKey: text("source_key").notNull(),
    url: text("url").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("bilcost_listing_cache_source_key_unique").on(t.sourceKey)],
);

export const bilcostSearchCacheTable = pgTable(
  "bilcost_search_cache",
  {
    id: serial("id").primaryKey(),
    queryKey: text("query_key").notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("bilcost_search_cache_query_key_unique").on(t.queryKey)],
);

export const bilcostComparisonsTable = pgTable("bilcost_comparisons", {
  id: serial("id").primaryKey(),
  shareToken: text("share_token").notNull().unique(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BilcostListingCacheRow =
  typeof bilcostListingCacheTable.$inferSelect;
export type BilcostSearchCacheRow =
  typeof bilcostSearchCacheTable.$inferSelect;
export type BilcostComparisonRow = typeof bilcostComparisonsTable.$inferSelect;
