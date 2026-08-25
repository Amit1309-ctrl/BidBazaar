export type Category =
  | "ai" | "saas" | "devtools" | "fintech" | "d2c" | "ecommerce"
  | "agency" | "creator" | "newsletter" | "edtech" | "consumer_app"
  | "productivity" | "community" | "other";

export const CATEGORY_LABELS: Record<Category, string> = {
  ai: "AI",
  saas: "SaaS",
  devtools: "Developer Tools",
  fintech: "Fintech",
  d2c: "D2C",
  ecommerce: "Ecommerce",
  agency: "Agency",
  creator: "Creator",
  newsletter: "Newsletter",
  edtech: "EdTech",
  consumer_app: "Consumer App",
  productivity: "Productivity",
  community: "Community",
  other: "Other",
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
  tagline: string;
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
