import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/landing/**/*.{ts,tsx}",
    "./components/landing/**/*.{ts,tsx}",
  ],
  corePlugins: {
    // Preflight is disabled so Tailwind doesn't reset the existing
    // dashboard's plain-CSS styles. Landing route opts in via its own layout.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#03050d",
          900: "#050816",
          800: "#0a0f1f",
          700: "#0f1530",
        },
        cyber: {
          cyan: "#22D3EE",
          indigo: "#6366F1",
          violet: "#8B5CF6",
          green: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "spin-slow": "spin 18s linear infinite",
        "spin-reverse": "spin-reverse 24s linear infinite",
        "spin-fast": "spin 9s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-out infinite",
        "marquee": "marquee 30s linear infinite",
      },
      keyframes: {
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", filter: "blur(20px)" },
          "50%": { opacity: "1", filter: "blur(28px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
