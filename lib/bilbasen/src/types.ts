import type { Car, FuelType, Transmission } from "@workspace/bilcost-pricing";

export interface ListingPreview {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  mileageKm: number;
  priceDkk: number;
  fuelType: FuelType;
  imageUrl: string | null;
  listingUrl: string;
}

export interface BilbasenSearchQuery {
  q?: string;
  make?: string;
  model?: string;
  isNew?: boolean;
}

/**
 * Structured logging callbacks. The host app passes a pino-style
 * logger here so every Bilbasen fetch is traced with url, status,
 * duration, and outcome — independently of any HTTP framework.
 */
export interface BilbasenLogger {
  info(payload: Record<string, unknown>, msg: string): void;
  warn(payload: Record<string, unknown>, msg: string): void;
  error(payload: Record<string, unknown>, msg: string): void;
}

export interface BilbasenClient {
  searchListings(query: BilbasenSearchQuery): Promise<ListingPreview[]>;
  /**
   * Look up a single listing by Bilbasen URL or numeric id.
   * Throws on transport / parsing failures with a user-readable message.
   */
  getListing(urlOrId: string): Promise<Car>;
}

export type { Car, FuelType, Transmission };
