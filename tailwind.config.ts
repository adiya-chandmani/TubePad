import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        body: "#D7D4CA",
        panel: "#1B1B19",
        pad: "#CBCBC7",
        padActive: "#3B82F6",
        rec: "#DC2626",
        fx: "#F97316",
      },
    },
  },
  plugins: [],
};

export default config;
