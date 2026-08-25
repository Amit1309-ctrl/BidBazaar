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
  minimum_starting_bid_paise: number; // ₹499 default
  tier1_ceiling_paise: number;        // below this: flat increment
  tier1_flat_increment_paise: number; // ₹500 default
  tier2_ceiling_paise: number;        // ₹10,000–₹50,000 band
  tier2_percent_increment: number;    // 7.5%
  tier3_percent_increment: number;    // 5%, applies above tier2 ceiling
}

export const DEFAULT_BID_CONFIG: BidConfig = {
  minimum_starting_bid_paise: 49_900,   // ₹499
  tier1_ceiling_paise: 10_00_00,        // ₹10,000
  tier1_flat_increment_paise: 50_000,   // ₹500
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

  if (currentBidPaise < config.tier1_ceiling_paise) {
    return currentBidPaise + config.tier1_flat_increment_paise;
  }
  if (currentBidPaise <= config.tier2_ceiling_paise) {
    return Math.ceil(currentBidPaise * (1 + config.tier2_percent_increment));
  }
  return Math.ceil(currentBidPaise * (1 + config.tier3_percent_increment));
}

export function isValidBid(
  proposedPaise: number,
  currentBidPaise: number,
  config: BidConfig = DEFAULT_BID_CONFIG
): { valid: boolean; minimum: number } {
  const minimum = minimumNextBid(currentBidPaise, config);
  return { valid: proposedPaise >= minimum, minimum };
}
