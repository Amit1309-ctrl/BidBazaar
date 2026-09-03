export const PUBLIC_CATEGORY_SLUGS = [
  "ai", "saas", "fintech", "ecommerce", "edtech", "creator", "agency",
] as const;

export const CATEGORY_SLUGS = [...PUBLIC_CATEGORY_SLUGS, "other"] as const;

export type PublicCategory = typeof PUBLIC_CATEGORY_SLUGS[number];
export type Category = typeof CATEGORY_SLUGS[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  saas: "SaaS & Developer Tools",
  fintech: "Fintech",
  ecommerce: "E-commerce",
  edtech: "Education",
  creator: "Creator & Community",
  agency: "Services & Agencies",
  other: "Other",
};

export const PUBLIC_CATEGORY_LABELS: Record<PublicCategory, string> = {
  ai: CATEGORY_LABELS.ai,
  saas: CATEGORY_LABELS.saas,
  fintech: CATEGORY_LABELS.fintech,
  ecommerce: CATEGORY_LABELS.ecommerce,
  edtech: CATEGORY_LABELS.edtech,
  creator: CATEGORY_LABELS.creator,
  agency: CATEGORY_LABELS.agency,
};

export type City =
  | "Bengaluru" | "Mumbai" | "Delhi NCR" | "Hyderabad" | "Pune"
  | "Chennai" | "Ahmedabad" | "Kolkata" | "Jaipur" | "Kochi" | "Remote India";

export const CITIES: City[] = [
  "Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune",
  "Chennai", "Ahmedabad", "Kolkata", "Jaipur", "Kochi", "Remote India",
];

export interface Listing {
  id: string;
  slug: string;
  company_name: string;
  description: string | null;
  website: string;
  logo_url: string | null;
  founder_name: string | null;
  category: Category;
  city: City;
  twitter_handle: string | null;
  linkedin_url: string | null;
  verified: boolean;
  status: "pending" | "approved" | "suspended" | "banned";
  current_bid_paise: number;
  current_rank: number | null;
  highest_rank_ever: number | null;
  rank_since: string; // ISO timestamp — when it entered current rank
  total_clicks: number;
  total_impressions: number;
  is_seed: boolean;
  created_at: string;
}

export interface Bid {
  id: string;
  listing_id: string;
  amount_paise: number;
  payment_status: "created" | "authorized" | "captured" | "failed" | "refunded";
  previous_rank: number | null;
  new_rank: number | null;
  created_at: string;
}

export interface LiveStats {
  total_bids_paise: number;
  total_companies: number;
  total_clicks: number;
  bids_today: number;
}

export interface ActivityEvent {
  id: string;
  kind: "moved_up" | "new_bid" | "entered_top10" | "took_first" | "held_first";
  listing_slug: string;
  listing_name: string;
  detail: string;
  created_at: string;
}
