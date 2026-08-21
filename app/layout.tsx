import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { ConditionalNavbar } from "../components/layout/ConditionalNavbar";
import { CLERK_JS_VERSION, clerkPreconnectHost } from "@/lib/clerkConfig";
import { DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/hyd01.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/hyd01.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
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
    title: HOME_TITLE,
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const clerkHost = clerkPreconnectHost();

  return (
    <ClerkProvider
      clerkJSVersion={CLERK_JS_VERSION}
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
    <html lang="en" className={dmSans.variable}>
        <head>
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
          <link rel="preconnect" href={clerkHost} crossOrigin="" />
          <link rel="dns-prefetch" href={clerkHost} />
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
