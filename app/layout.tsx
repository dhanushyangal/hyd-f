import "./globals.css";
import type { ReactNode } from "react";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";
import { Navigation } from "../components/Navigation";

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
    <html lang="en">
        <body className="min-h-screen bg-white">
          <ClientProviders>
            <Navigation />
            <main>{children}</main>
          </ClientProviders>
      </body>
    </html>
    </ClerkProvider>
  );
}
