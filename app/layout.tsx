import "./globals.css";
import type { ReactNode } from "react";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ClientProviders } from "../components/ClientProviders";

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
            <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold text-black">
                    Hydrilla 3D
                  </span>
                </a>

                <nav className="flex items-center gap-6">
                  <SignedIn>
                    <a
                      href="/generate"
                      className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                    >
                      Generate
                    </a>
                    <a
                      href="/library"
                      className="text-sm font-medium text-gray-700 hover:text-black transition-colors"
                    >
                      My Library
                    </a>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8 ring-2 ring-gray-200",
                        },
                      }}
                    />
                  </SignedIn>

                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="text-sm font-medium text-gray-700 hover:text-black transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-900 transition-all">
                        Get Started
                      </button>
                    </SignUpButton>
                  </SignedOut>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
