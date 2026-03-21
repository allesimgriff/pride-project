import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
        },
        primary: {
          50: "#e8f4f8",
          100: "#c5e3ec",
          200: "#9ed0df",
          300: "#6eb5cc",
          400: "#4a9bb8",
          500: "#2d7a96",
          600: "#24637a",
          700: "#1e5064",
          800: "#1a4253",
          900: "#163746",
        },
        accent: {
          50: "#f5f3ef",
          100: "#e8e4dc",
          200: "#d4cdc2",
          300: "#b8ad9d",
          400: "#9a8c78",
          500: "#7d6f5c",
        },
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      keyframes: {
        "nav-progress": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
      },
      animation: {
        "nav-progress": "nav-progress 1.05s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
