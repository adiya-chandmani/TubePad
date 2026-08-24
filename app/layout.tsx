import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubePad — YouTube MPC Sampler",
  description: "Turn YouTube moments into playable pads.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
