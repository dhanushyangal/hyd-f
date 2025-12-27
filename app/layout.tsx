import "./globals.css";
import type { ReactNode } from "react";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { DM_Sans, Playfair_Display } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: "Hydrilla 3D Generator",
  description: "AI 3D generation powered by Tencent Hunyuan 3D Pro",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden",
          footerPages: "hidden",
        },
      }}
    >
    <html lang="en" className={`${dmSans.variable} ${playfairDisplay.variable}`}>
        <body className="min-h-screen bg-white">
          <ClientProviders>
            {children}
          </ClientProviders>
      </body>
    </html>
    </ClerkProvider>
  );
}
