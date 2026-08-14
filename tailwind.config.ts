import type { Config } from "tailwindcss";

/**
 * Stitch Obsidian design system — Pro Enterprise Management.
 *
 * Palette:
 *   Base            #121212  →  0 0%  7%
 *   Surface         #131313  →  0 0%  7%
 *   Surface elevated #1E1E1E →  0 0% 12%
 *   Surface high    #2A2A2A  →  0 0% 16%
 *   Border          #333333  →  0 0% 20%
 *   Primary (emerald) #10B981 → 160 84% 39%
 *   Text primary    #FFFFFF  →  0 0% 100%
 *   Text secondary  #9CA3AF  → 218 11% 65%
 *   Status success  #10B981
 *   Status pending  #F59E0B
 *   Status error    #EF4444
 *
 * shadcn/ui reads from CSS custom properties (--primary, --card, etc.)
 * declared in globals.css. The Tailwind tokens below allow direct class
 * usage (bg-surface-elevated, text-text-primary, etc.) in components.
 */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui CSS-variable tokens ────────────────────────
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Stitch Obsidian surface tokens ───────────────────────
        "surface":                  "#131313",
        "surface-base":             "#121212",
        "surface-dim":              "#131313",
        "surface-bright":           "#393939",
        "surface-container-lowest": "#0e0e0e",
        "surface-container-low":    "#1c1b1b",
        "surface-container":        "#201f1f",
        "surface-container-high":   "#2a2a2a",
        "surface-container-highest":"#353534",
        "surface-elevated":         "#1E1E1E",
        "surface-variant":          "#353534",
        "border-subtle":            "#333333",

        // ── Text ─────────────────────────────────────────────────
        "text-primary":   "#FFFFFF",
        "text-secondary": "#9CA3AF",
        "on-surface":     "#e5e2e1",
        "on-surface-variant": "#bbcabf",

        // ── Primary (emerald) ─────────────────────────────────────
        "primary-container": "#10b981",
        "on-primary":        "#003824",

        // ── Secondary (blue) ─────────────────────────────────────
        "secondary-container": "#0566d9",
        "on-secondary":        "#002e6a",

        // ── Status ───────────────────────────────────────────────
        "status-success": "#10B981",
        "status-pending": "#F59E0B",
        "status-error":   "#EF4444",

        // ── Shell chrome (maps to Obsidian surface) ───────────────
        "shell-bg":     "#131313",
        "shell-border": "#333333",
        "canvas-bg":    "#121212",

        // ── Legacy chs-* tokens (used in existing components) ─────
        // Kept so old className references don't break at compile time.
        // Update components to Obsidian tokens incrementally.
        "chs-navy":    "#17324D",
        "chs-slate":   "#415B76",
        "chs-amber":   "#C6862C",
        "chs-success": "#10B981",
        "chs-warning": "#F59E0B",
        "chs-danger":  "#EF4444",
        "chs-info":    "#60A5FA",
        "chs-bg":      "#121212",
        "chs-surface": "#1E1E1E",
        "chs-border":  "#333333",
        "chs-text":           "#FFFFFF",
        "chs-text-secondary": "#9CA3AF",
        "chs-text-muted":     "#6B7280",
      },

      fontFamily: {
        // Stitch Obsidian uses Inter exclusively
        sans:  ["var(--font-inter)", "Inter", "sans-serif"],
        mono:  ["ui-monospace", "SFMono-Regular", "monospace"],
        // Named font-family aliases from Stitch design (font-body-md etc.)
        "display-lg":        ["var(--font-inter)", "Inter"],
        "headline-lg":       ["var(--font-inter)", "Inter"],
        "headline-lg-mobile":["var(--font-inter)", "Inter"],
        "headline-md":       ["var(--font-inter)", "Inter"],
        "headline-sm":       ["var(--font-inter)", "Inter"],
        "body-lg":           ["var(--font-inter)", "Inter"],
        "body-md":           ["var(--font-inter)", "Inter"],
        "body-sm":           ["var(--font-inter)", "Inter"],
        "label-md":          ["var(--font-inter)", "Inter"],
      },

      fontSize: {
        // ── Stitch Obsidian type scale ────────────────────────────
        "display-lg":        ["48px", { lineHeight: "56px",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg":       ["32px", { lineHeight: "40px",  fontWeight: "600" }],
        "headline-lg-mobile":["28px", { lineHeight: "36px",  fontWeight: "600" }],
        "headline-md":       ["24px", { lineHeight: "32px",  fontWeight: "600" }],
        "headline-sm":       ["20px", { lineHeight: "28px",  fontWeight: "600" }],
        "body-lg":           ["18px", { lineHeight: "28px",  fontWeight: "400" }],
        "body-md":           ["16px", { lineHeight: "24px",  fontWeight: "400" }],
        "body-sm":           ["14px", { lineHeight: "20px",  fontWeight: "400" }],
        "label-md":          ["12px", { lineHeight: "16px",  letterSpacing: "0.05em", fontWeight: "600" }],
      },

      borderRadius: {
        DEFAULT: "0.25rem",  /* 4px — Stitch Obsidian DEFAULT */
        sm:  "0.125rem",
        md:  "0.25rem",
        lg:  "0.5rem",
        xl:  "0.75rem",
        full:"9999px",
      },

      boxShadow: {
        xs:     "0 1px 2px rgba(0,0,0,0.2)",
        sm:     "0 1px 3px rgba(0,0,0,0.3)",
        DEFAULT:"0 1px 4px rgba(0,0,0,0.4)",
        md:     "0 2px 6px rgba(0,0,0,0.4)",
        dialog: "0 8px 24px rgba(0,0,0,0.5)",  /* Level 2 modal elevation */
      },

      spacing: {
        "sidebar":          "280px",   /* Stitch design rail width */
        "topbar":           "64px",    /* h-16 */
        "container-max":    "1440px",
        "margin-mobile":    "16px",
        "margin-desktop":   "32px",
        "gutter":           "24px",
        "unit":             "4px",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "skeleton-pulse":  "skeleton-pulse 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
