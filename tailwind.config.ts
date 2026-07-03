import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        primary: { DEFAULT: "#1D9E75", foreground: "#FFFFFF" },
        muted: { DEFAULT: "hsl(210 40% 96%)", foreground: "hsl(215 16% 47%)" },
        danger: "#D85A30",
        success: "#1D9E75",
      },
      borderRadius: { lg: "12px", md: "8px", sm: "4px" },
    },
  },
  plugins: [],
};
export default config;
