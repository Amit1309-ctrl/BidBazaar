import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces — near-black, slightly warm charcoal (not pure #000)
        base: {
          bg: "#0B0D10",
          surface: "#14171C",
          elevated: "#1B1F26",
          border: "#262B33",
          borderHover: "#343B47",
        },
        ink: {
          primary: "#F4F5F7",
          secondary: "#9AA1AC",
          muted: "#6B7280",
        },
        // Primary action / money-forward accent — emerald, not neon
        rupee: {
          DEFAULT: "#17A673",
          bright: "#22C68C",
          dim: "#0E5C40",
          bg: "#0E1F1A",
        },
        // Prestige tiers for #1 / #2 / #3
        gold: { DEFAULT: "#E8B54A", bright: "#F5CB6E", dim: "#5A4620" },
        silver: { DEFAULT: "#C7CDD6", bright: "#E2E6EB", dim: "#3A3F47" },
        bronze: { DEFAULT: "#C9865A", bright: "#DBA37D", dim: "#4A2F1F" },
        signal: {
          up: "#22C68C",
          down: "#E5584A",
          warn: "#E8B54A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        goldGlow: "0 0 0 1px rgba(232,181,74,0.35), 0 8px 40px -8px rgba(232,181,74,0.35)",
        rupeeGlow: "0 0 0 1px rgba(23,166,115,0.35), 0 8px 30px -10px rgba(23,166,115,0.4)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 30px -18px rgba(0,0,0,0.6)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        floatUp: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 3.2s ease-in-out infinite",
        floatUp: "floatUp 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
