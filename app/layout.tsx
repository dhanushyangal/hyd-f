import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { ConditionalNavbar } from "../components/layout/ConditionalNavbar";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: "Hydrilla AI",
  description: "3D Assets Made Easy",
  icons: {
    icon: "/hyd01.png",
    shortcut: "/hyd01.png",
    apple: "/hyd01.png",
  },
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
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
        <body className="min-h-screen bg-white">
          {/* Google tag (gtag.js) */}
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-5DMYT9CZ0S"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-5DMYT9CZ0S');
            `}
          </Script>
          <ClientProviders>
            <ConditionalNavbar />
            <main>{children}</main>
          </ClientProviders>
          <Analytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
