import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";

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
        {/* Authenticated users see a link to generate page */}
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
          <div className="space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-black flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-black">
              Welcome Back{userName ? `, ${userName}` : ""}!
            </h1>
            <p className="text-gray-600">Ready to create amazing 3D models?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/generate"
                className="px-8 py-4 text-lg font-semibold bg-black text-white rounded-xl hover:bg-gray-900 transition-all"
              >
                Start Generating
              </Link>
              <Link
                href="/library"
                className="px-8 py-4 text-lg font-semibold text-gray-700 border border-gray-300 rounded-xl hover:border-gray-400 hover:text-black hover:bg-gray-50 transition-all"
              >
                View Library
              </Link>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        {/* Landing page for non-authenticated users */}
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center">
          {/* Hero Section */}
          <div className="space-y-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-black text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-black animate-pulse"></span>
              Powered by Hunyuan3D-2.1
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
              Transform Ideas into{" "}
              <span className="text-black">
                Stunning 3D Models
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create professional-quality 3D assets from text descriptions or images using state-of-the-art AI. 
              Perfect for game developers, designers, and creators.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-black text-white rounded-xl hover:bg-gray-900 transition-all hover:scale-105">
                  Start Creating Free
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto px-8 py-4 text-lg font-semibold text-gray-700 border border-gray-300 rounded-xl hover:border-gray-400 hover:text-black hover:bg-gray-50 transition-all">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
              title="Text to 3D"
              description="Describe what you want and watch AI generate a detailed 3D model in minutes."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              title="Image to 3D"
              description="Upload any image and convert it into a fully textured 3D mesh instantly."
            />
            <FeatureCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              }
              title="Export GLB"
              description="Download your models in GLB format, ready for use in Unity, Unreal, or any 3D software."
            />
          </div>
        </div>
      </SignedOut>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-colors group shadow-sm hover:shadow-md">
      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
