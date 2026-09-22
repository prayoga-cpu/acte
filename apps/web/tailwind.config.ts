import type { Config } from "tailwindcss";

/**
 * Copied verbatim from prototype/acte-dashboard-v16.html's inline
 * `tailwind.config` (docs/01-product/PROTOTYPE_MAP.md "Design tokens").
 * Do not rename the "gold" tokens — the whole prototype markup (and this
 * port) references `gold`, `gold-pale`, `gold-deep` even though the ACTE
 * brand itself is monochrome; the CSS variables they resolve to are what
 * actually carries the black/white accent per theme (see globals.css).
 */
const config: Config = {
  // Theming is driven by CSS custom properties toggled via `html.light`
  // (see globals.css), not Tailwind's `dark:` variant — the prototype never
  // uses one, so darkMode is left at its default.
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--c-white) / <alpha-value>)",
        black: "rgb(var(--c-black) / <alpha-value>)",
        noir: "rgb(var(--c-noir) / <alpha-value>)",
        carbon: "rgb(var(--c-carbon) / <alpha-value>)",
        ivory: "rgb(var(--c-ivory) / <alpha-value>)",
        ash: "rgb(var(--c-ash) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          deep: "rgb(var(--c-accent2) / <alpha-value>)",
          pale: "rgb(var(--c-accent) / <alpha-value>)",
        },
      },
      fontFamily: {
        // next/font self-hosts these at build time and exposes them as CSS
        // variables (see app/layout.tsx) — never fonts.googleapis.com at
        // runtime (CLAUDE.md: GDPR, visitor IPs).
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
