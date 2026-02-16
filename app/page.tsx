import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import Hero from "../components/sections/Hero";
import VideoBackground from "../components/sections/VideoBackground";
import Showcase from "../components/sections/Showcase";
import Footer from "../components/layout/Footer";
import EarlyAccessCard from "../components/sections/EarlyAccessCard";
import StartGeneratingButton from "../components/StartGeneratingButton";

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
        <section className="relative min-h-screen w-full overflow-hidden">
          <VideoBackground 
            videoSrc="/herohydrilla.mp4"
            posterSrc="/herohydrillasrc.jpg"
            overlay={true}
          />
          
          {/* Authenticated users see a link to generate page */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8">
            <div className="space-y-8 sm:space-y-10 md:space-y-12 max-w-2xl md:max-w-3xl w-full mx-auto">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto flex items-center justify-center">
                <Image
                  src="/hyd01.png"
                  alt="Hydrilla Logo"
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                  priority
                />
              </div>
              <h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg leading-tight"
                style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
              >
                Welcome Back{userName ? `, ${userName}` : ""}!
              </h1>
              <p 
                className="text-lg sm:text-xl md:text-2xl text-white/90 drop-shadow-md"
                style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
              >
                Ready to create amazing 3D models?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
                <StartGeneratingButton />
                <Link
                  href="/library"
                  className="inline-flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/40 text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-white hover:scale-[1.02] transition-all duration-200 shadow-md active:scale-[0.98]"
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  View Library
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Showcase Section */}
        <Showcase />
        
        {/* Mission Section */}
        <section className="relative w-full bg-gradient-to-b from-white to-[#faf8f5] py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <p 
              className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight tracking-tight"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Our mission is to build intelligent workflows that accelerate animation and 3D production.
            </p>
          </div>
        </section>
      </SignedIn>

      <SignedOut>
        {/* Landing page for non-authenticated users - Hero Section */}
        <Hero />
      </SignedOut>
      
      {/* Early Access Card Section - Above Footer */}
      <EarlyAccessCard />
      
      {/* Footer */}
      <Footer />
    </>
  );
}
