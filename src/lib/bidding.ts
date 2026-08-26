/**
 * Bidding rules.
 *
 * These defaults mirror the `platform_config` row in Postgres (see
 * supabase/schema.sql). The DB is the source of truth in production —
 * this module is called with whatever config was loaded from there,
 * falling back to DEFAULT_BID_CONFIG only when no row exists yet
 * (e.g. a fresh local DB before the seed script runs).
 */

export interface BidConfig {
  minimum_starting_bid_paise: number; // ₹99 default
  tier1_ceiling_paise: number;        // retained for database compatibility
  tier1_flat_increment_paise: number; // ₹1 default
  tier2_ceiling_paise: number;        // retained for database compatibility
  tier2_percent_increment: number;    // retained for database compatibility
  tier3_percent_increment: number;    // retained for database compatibility
}

export const DEFAULT_BID_CONFIG: BidConfig = {
  minimum_starting_bid_paise: 9_900,    // ₹99
  tier1_ceiling_paise: 10_00_00,        // ₹10,000
  tier1_flat_increment_paise: 100,      // ₹1
  tier2_ceiling_paise: 50_00_00,        // ₹50,000
  tier2_percent_increment: 0.075,       // 7.5%
  tier3_percent_increment: 0.05,        // 5%
};

/**
 * Returns the minimum amount (in paise) a new bid must reach to overtake
 * a listing currently bidding `currentBidPaise`.
 */
export function minimumNextBid(currentBidPaise: number, config: BidConfig = DEFAULT_BID_CONFIG): number {
  if (currentBidPaise <= 0) return config.minimum_starting_bid_paise;
  return currentBidPaise + 100;
}

export function isValidBid(
  proposedPaise: number,
  currentBidPaise: number,
  config: BidConfig = DEFAULT_BID_CONFIG
): { valid: boolean; minimum: number } {
  const minimum = minimumNextBid(currentBidPaise, config);
  return { valid: proposedPaise >= minimum, minimum };
}
