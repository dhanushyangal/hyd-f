import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { ConditionalNavbar } from "../components/layout/ConditionalNavbar";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import { HERO_POSTER_PRELOAD_URL } from "@/lib/cloudinary";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Production-Ready 3D Assets, Generated Fast`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  icons: {
    icon: "/hyd01.png",
    shortcut: "/hyd01.png",
    apple: "/hyd01.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Production-Ready 3D Assets, Generated Fast`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hydrillaai",
    creator: "@hydrillaai",
    title: `${SITE_NAME} | Production-Ready 3D Assets, Generated Fast`,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
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
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app/studio"
      signUpFallbackRedirectUrl="/app/studio"
    >
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
        <head>
          <link rel="preload" as="image" href={HERO_POSTER_PRELOAD_URL} fetchPriority="high" />
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
          {/* Preconnect only to auth — analytics loads lazily after idle */}
          <link rel="preconnect" href="https://clerk.hydrilla.ai" />
          <link rel="dns-prefetch" href="https://clerk.hydrilla.ai" />
        </head>
        <body className="min-h-screen bg-white">
          <ClientProviders>
            <ConditionalNavbar />
            <main>{children}</main>
          </ClientProviders>
          <Analytics />
          <SpeedInsights />
          <GoogleAnalytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
