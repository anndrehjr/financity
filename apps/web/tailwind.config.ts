import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { display: ["var(--font-display)", "system-ui", "sans-serif"], body: ["var(--font-body)", "system-ui", "sans-serif"] },
      colors: { ink: "#1e1b4b", city: { sky: "#7dd3fc", sun: "#fbbf24", coral: "#fb7185", mint: "#34d399", grape: "#7c3aed", navy: "#1e3a8a" } },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        pop: { "0%": { transform: "scale(.92)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        walk: { "0%": { transform: "translateX(-30px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
      },
      animation: { floaty: "floaty 3s ease-in-out infinite", pop: "pop .35s ease-out both", walk: "walk .6s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
