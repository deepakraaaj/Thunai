import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0a0f1a",
        surface: "#111827",
        teal: "#2dd4bf",
        lavender: "#a78bfa",
        amber: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        tamil: ["var(--font-anek-tamil)", "sans-serif"],
      },
      boxShadow: {
        depth: "0_8px_40px_rgba(0,0,0,0.45)",
        float: "0 8px 40px rgba(0,0,0,0.45)",
        glow: "0 0 60px rgba(45,212,191,0.35)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.28s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
