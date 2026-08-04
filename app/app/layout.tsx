"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppLayoutProvider } from "../../context/AppLayoutContext";
import { AppSidebar } from "../../components/app/AppSidebar";
import { AppNavbar } from "../../components/app/AppNavbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <AppLayoutProvider>
          <div className="h-screen flex bg-[#fafafa]">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <AppNavbar />
              <div className="flex-1 min-h-0 overflow-auto bg-[#fafafa]">
                {children}
              </div>
            </div>
          </div>
        </AppLayoutProvider>
      </SignedIn>
    </>
  );
}

function RedirectToSignIn() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);
  return (
    <div className="h-screen flex items-center justify-center bg-neutral-50">
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
    </div>
  );
}
