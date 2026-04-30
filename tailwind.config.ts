import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // OKLCH triplets stored as bare CSS variable strings, e.g. "0.14 0.055 258".
      // Tailwind composes them via `oklch(var(--X) / <alpha-value>)` so utilities
      // like `bg-bg/40` produce real alpha instead of dropping the modifier.
      colors: {
        bg: "oklch(var(--bg) / <alpha-value>)",
        fg: "oklch(var(--fg) / <alpha-value>)",
        muted: "oklch(var(--muted) / <alpha-value>)",
        accent: "oklch(var(--accent) / <alpha-value>)",
        line: "oklch(var(--line) / <alpha-value>)",
        glow: "oklch(var(--glow) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["clamp(42px, 7vw, 60px)", { lineHeight: "1.05" }],
        headline: ["clamp(28px, 4.2vw, 32px)", { lineHeight: "1.15" }],
        subhead: ["20px", { lineHeight: "1.35" }],
        body: ["17px", { lineHeight: "1.55" }],
        small: ["14px", { lineHeight: "1.45" }],
        caption: ["12px", { lineHeight: "1.4" }],
      },
      maxWidth: {
        reading: "880px",
      },
      spacing: {
        section: "6rem",
      },
      transitionTimingFunction: {
        chamber: "cubic-bezier(0.2, 0.6, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
