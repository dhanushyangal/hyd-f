import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Hydrilla 3D Generator",
  description: "AI 3D generation powered by Tencent Hunyuan 3D Pro",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="text-lg font-semibold">Hydrilla 3D</div>
            <nav className="space-x-4 text-sm font-medium text-slate-700">
              <a href="/generate">Generate</a>
              <a href="/library">Library</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

