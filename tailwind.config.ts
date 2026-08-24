import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Seoul Retro badge palette
        navy: "#12293A",
        navyDeep: "#0B1C28",
        cream: "#F0E6C8",
        red: "#D8402E",
        redDeep: "#B32E1F",
        gold: "#D8A94A",
        goldDeep: "#B8862F",
        // legacy aliases kept so existing classNames keep working
        body: "#12293A",
        panel: "#0B1C28",
        pad: "#F0E6C8",
        padActive: "#D8402E",
        rec: "#D8402E",
        fx: "#D8A94A",
      },
      fontFamily: {
        display: ["var(--font-press-start)", "monospace"],
        pixel: ["var(--font-vt323)", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 0 #000",
        pixelSm: "2px 2px 0 0 #000",
        pixelGold: "4px 4px 0 0 #D8A94A",
      },
    },
  },
  plugins: [],
};

export default config;
