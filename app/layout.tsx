import "./globals.css";
import type { ReactNode } from "react";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { ConditionalNavbar } from "../components/layout/ConditionalNavbar";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
        <head>
          {/* Preconnect to external domains for faster resource loading */}
          <link rel="preconnect" href="https://img.icons8.com" />
          <link rel="preconnect" href="https://www.googletagmanager.com" />
          <link rel="preconnect" href="https://app.posthog.com" />
          <link rel="preconnect" href="https://us-assets.i.posthog.com" />
          <link rel="dns-prefetch" href="https://clerk.hydrilla.ai" />
          
          {/* Google tag (gtag.js) - Loaded after page is interactive */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Load gtag.js after page is interactive
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', loadGtag);
                  } else {
                    setTimeout(loadGtag, 0);
                  }
                  
                  function loadGtag() {
                    var script = document.createElement('script');
                    script.async = true;
                    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-5DMYT9CZ0S';
                    document.head.appendChild(script);
                    
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-5DMYT9CZ0S', {
                      page_path: window.location.pathname,
                    });
                  }
                })();
              `,
            }}
          />
        </head>
        <body className="min-h-screen bg-white">
          <ClientProviders>
            <ConditionalNavbar />
            <main>{children}</main>
          </ClientProviders>
          <Analytics />
          <SpeedInsights />
      </body>
    </html>
    </ClerkProvider>
  );
}
