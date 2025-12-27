import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/sections/Hero";
import Navbar from "@/components/layout/Navbar";
import { Navigation } from "@/components/Navigation";

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
        {/* Video Background */}
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/hydrilla-video.mp4" type="video/mp4" />
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Authenticated users see a link to generate page */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
          <div className="space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden">
              <Image
                src="/hyd01.png"
                alt="Hydrilla Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Welcome Back{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-gray-200 drop-shadow-md">Ready to create amazing 3D models?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/generate"
                className="px-8 py-4 text-lg font-semibold bg-black/90 backdrop-blur-sm text-white rounded-xl hover:bg-black transition-all border border-white/20 shadow-lg"
              >
                Start Generating
              </Link>
              <Link
                href="/library"
                className="px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-xl hover:border-white/50 hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg"
              >
                View Library
              </Link>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        {/* New Hero Section for non-authenticated users */}
        <Navbar />
        <Hero />
      </SignedOut>
    </>
  );
}
