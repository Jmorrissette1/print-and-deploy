import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gothic red/purple palette
        "blood-red": "#8B0000",
        crimson: "#DC143C",
        "deep-purple": "#4B0082",
        "gothic-purple": "#301934",
      },
    },
  },
  plugins: [],
};
export default config;
