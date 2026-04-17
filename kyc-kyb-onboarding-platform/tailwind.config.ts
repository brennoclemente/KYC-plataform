import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/presentation/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:    "var(--color-primary)",
        secondary:  "var(--color-secondary)",
        background: "var(--color-background)",
        foreground: "var(--color-text)",
        text:       "var(--color-text)",
        surface:    "var(--color-surface)",
        border:     "var(--color-border)",
        muted:      "var(--color-muted)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        sm:  "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md:  "var(--shadow-md)",
        lg:  "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
