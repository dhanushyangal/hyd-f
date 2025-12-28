import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import Hero from "../components/sections/Hero";
import VideoBackground from "../components/sections/VideoBackground";

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
        {/* Optimized Video Background - same as Hero section */}
        <div className="relative min-h-screen w-full overflow-hidden">
          <VideoBackground 
            videoSrc="/herohydrilla.mp4"
            posterSrc="/herohydrillasrc.jpg"
            overlay={true}
          />
          
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
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Welcome Back{userName ? `, ${userName}` : ""}!
              </h1>
              <p className="text-white/90 drop-shadow-md">Ready to create amazing 3D models?</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/generate"
                  className="px-8 py-4 text-lg font-semibold bg-white/90 backdrop-blur-md border border-white/40 text-black rounded-xl hover:bg-white transition-all shadow-lg"
                >
                  Start Generating
                </Link>
                <Link
                  href="/library"
                  className="px-8 py-4 text-lg font-semibold bg-white/90 backdrop-blur-md border border-white/40 text-black rounded-xl hover:bg-white transition-all shadow-lg"
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
