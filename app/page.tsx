import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import Hero from "../components/sections/Hero";
import Navbar from "../components/layout/Navbar";

export default async function Home() {
  const { userId } = await auth();
  let userName = "";
  
  if (userId) {
    const user = await currentUser();
    userName = user?.firstName || user?.fullName || user?.username || "";
  }

  return (
    <>
      <SignedIn>
        <Navbar />
        {/* Premium White Background */}
        <div className="min-h-screen bg-white">
          {/* Authenticated users see a link to generate page */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 sm:pt-24">
            <div className="space-y-6 max-w-md">
              <div className="w-20 h-20 mx-auto flex items-center justify-center">
                <Image
                  src="/hyd01.png"
                  alt="Hydrilla Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-black">
                Welcome Back{userName ? `, ${userName}` : ""}!
              </h1>
              <p className="text-gray-600">Ready to create amazing 3D models?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/generate"
                  className="px-8 py-4 text-lg font-semibold text-black border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all shadow-lg"
                >
                  Start Generating
                </Link>
                <Link
                  href="/library"
                  className="px-8 py-4 text-lg font-semibold text-black border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all shadow-lg"
                >
                  View Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        {/* Landing page for non-authenticated users - Hero Section */}
        <Hero />
      </SignedOut>
    </>
  );
}
