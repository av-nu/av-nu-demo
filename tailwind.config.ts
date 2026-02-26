import type { Config } from "tailwindcss";

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
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        text: "rgb(var(--text-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        pink: "rgb(var(--pink-rgb) / <alpha-value>)",
        burgundy: "rgb(var(--burgundy-rgb) / <alpha-value>)",
        divider: "var(--divider)",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        headline: ["var(--font-headline)", "ui-serif", "serif"],
      },
      borderColor: {
        DEFAULT: "var(--divider)",
      },
    },
  },
  plugins: [],
};

export default config;
