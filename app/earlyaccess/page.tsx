"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "../../components/layout/Footer";
import { checkEarlyAccess, createEarlyAccessPayment } from "../../lib/api";

// Hook for scroll-triggered animations
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main content component that uses useSearchParams
function EarlyAccessContent() {
  const { userId, getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const { ref: paymentSectionRef } = useScrollAnimation();
  
  // Get user's account email
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || null;

  // Scroll to top on page load - instant
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Check if user already has access on page load
  useEffect(() => {
    const checkAccess = async () => {
      if (!isSignedIn || !userEmail) {
        setHasAccess(false);
        return;
      }

      try {
        const { hasAccess: access } = await checkEarlyAccess(userEmail, getToken);
        setHasAccess(access);
      } catch (err) {
        console.error("Error checking access:", err);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [isSignedIn, userEmail, getToken]);

  // Handle payment success redirect
  useEffect(() => {
    const status = searchParams.get("status");
    const shouldRedirect = searchParams.get("redirect") === "home";
    
    if (status === "success") {
      // Payment completed - refresh access status
      if (userEmail) {
        checkEarlyAccess(userEmail, getToken).then(({ hasAccess }) => {
          setHasAccess(hasAccess);
          
          // Redirect to landing page after 2 seconds if redirect param is set
          if (shouldRedirect && hasAccess) {
            setTimeout(() => {
              router.push("/");
            }, 2000);
          }
        }).catch(() => {});
      }
    }
  }, [searchParams, getToken, router, userEmail]);

  const handleGetEarlyAccess = async () => {
    if (!isSignedIn || !userEmail) {
      setError("Please sign in to get early access");
      return;
    }

    if (!userEmail || !userEmail.includes("@")) {
      setError("Valid email is required");
      return;
    }

    // CRITICAL: Check access status BEFORE attempting payment
    // This prevents duplicate payment attempts
    try {
      const { hasAccess: currentAccess } = await checkEarlyAccess(userEmail, getToken);
      if (currentAccess) {
        setHasAccess(true);
        setError("You already have early access activated. Payment button disabled.");
        setIsLoading(false);
        return;
      }
    } catch (checkErr) {
      console.error("Error checking access before payment:", checkErr);
      // Continue to payment attempt if check fails (but log it)
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createEarlyAccessPayment(userEmail, getToken);
      
      // Redirect to checkout URL
      if (result.paymentLink) {
        window.location.href = result.paymentLink;
      } else {
        setError("Failed to create payment link. Please try again.");
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error("Error creating payment:", err);
      let errorMessage = "Failed to create payment link. Please try again.";
      
      // Handle ALREADY_HAS_ACCESS status from backend
      if (err instanceof Error && err.message) {
        if (err.message.includes("ALREADY_HAS_ACCESS") || 
            err.message.includes("already has early access") ||
            err.message.includes("This email already has early access")) {
          errorMessage = "Early Access already activated for this email. Payment disabled.";
          setHasAccess(true);
          // Refresh access status
          checkEarlyAccess(userEmail, getToken).then(({ hasAccess }) => {
            setHasAccess(hasAccess);
          }).catch(() => {});
        } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = "Cannot connect to server. Please check if the backend is running.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Show "Already Have Access" card if user has paid
  if (hasAccess === true) {
    return (
      <div className="min-h-screen bg-white">
        <section 
          ref={heroSectionRef}
          className="relative min-h-screen w-full overflow-hidden bg-neutral-900"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/future.jpg"
              alt="Our Future Plans"
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={80}
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 md:p-14 shadow-2xl border border-white/20">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 
                    className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-dm-sans"
                  >
                    You Already Have Hydrilla Pass
                  </h2>
                  <p 
                    className="text-lg sm:text-xl text-white/90 mb-8 font-space-grotesk"
                  >
                    Thank you for being an early supporter! You have full access to all premium features.
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-white text-black px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl font-dm-sans"
                  >
                    Go to Home
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Show sign-in prompt if not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white">
        <section 
          ref={heroSectionRef}
          className="relative min-h-screen w-full overflow-hidden bg-neutral-900"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src="/future.jpg"
              alt="Our Future Plans"
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={80}
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-10 md:p-14 shadow-2xl border border-white/20">
                <h2 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-dm-sans"
                >
                  Sign In Required
                </h2>
                <p 
                  className="text-lg sm:text-xl text-white/90 mb-8 font-space-grotesk"
                >
                  Please sign in to get early access to Hydrilla.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 bg-white text-black px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl font-dm-sans"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - bg-neutral-900 prevents flash while image loads */}
      <section 
        ref={heroSectionRef}
        className="relative min-h-screen w-full overflow-hidden bg-neutral-900"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/future.jpg"
            alt="Our Future Plans"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={80}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
          <p 
            className="text-xs sm:text-sm md:text-base text-white/90 mb-6 sm:mb-8 tracking-[0.2em] uppercase font-medium animate-fade-in font-space-grotesk"
          >
            ( Early Access )
          </p>
          
          <h1 className="text-center animate-fade-in-up mb-6 sm:mb-8">
            <span 
              className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-[1.05] tracking-[-0.02em] font-bold drop-shadow-2xl font-dm-sans"
            >
              Join the Future
            </span>
          </h1>

          <div className="text-center max-w-3xl mx-auto animate-fade-in-up animate-delay-200">
            <p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed mb-4 font-space-grotesk"
            >
              Be part of the next generation of 3D creation. Get early access to cutting-edge features, priority support, and exclusive updates.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Card Section */}
      <section 
        ref={paymentSectionRef}
        className="relative w-full bg-neutral-50 py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Payment Status Messages */}
          {searchParams.get("status") === "success" && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
              <p 
                className="text-lg sm:text-xl text-green-800 font-medium mb-2 font-dm-sans"
              >
                ✅ Payment successful! Redirecting to home...
              </p>
            </div>
          )}

          {/* Payment Card - Minimal & Premium */}
          <div 
            className="bg-white rounded-3xl p-8 sm:p-10 md:p-14 shadow-2xl border border-gray-100 relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-500"
          >
            {/* Subtle premium gradient glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="text-center mb-12 border-b border-gray-100 pb-10">
                <div className="inline-block mb-4">
                  <span className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-bold tracking-widest uppercase font-dm-sans">
                    One-Time Payment
                  </span>
                </div>
                
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span 
                    className="text-7xl sm:text-8xl md:text-9xl font-bold text-black tracking-tighter"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    $1.99
                  </span>
                </div>
                
                <p 
                  className="text-sm text-gray-500 uppercase tracking-widest font-space-grotesk"
                >
                  Lifetime Access
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
                {[
                  "Unlimited 3D generation",
                  "Priority processing queue",
                  "Advanced 3D features",
                  "Early access to new tools",
                  "Premium priority support",
                  "Multiple export formats",
                  "High-resolution outputs",
                  "Plugin for Blender",
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p 
                      className="text-base sm:text-lg text-gray-600 font-dm-sans"
                    >
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              {/* User Email Display (read-only) */}
              {userEmail && (
                <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span 
                    className="text-sm text-gray-500 font-space-grotesk"
                  >
                    Account:
                  </span>
                  <span 
                    className="text-sm sm:text-base font-medium text-black font-dm-sans"
                  >
                    {userEmail}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <p 
                    className="text-sm text-red-600 text-center font-space-grotesk"
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Get Early Access Button */}
              <div className="space-y-6">
                {hasAccess ? (
                  <div className="w-full bg-gray-50 text-gray-400 px-6 sm:px-8 py-5 rounded-2xl text-lg font-bold text-center border border-gray-200 cursor-not-allowed font-dm-sans">
                    Early Access Already Activated
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGetEarlyAccess}
                    disabled={isLoading || !userEmail || hasAccess !== false}
                    className="w-full bg-black text-white px-6 sm:px-8 py-5 rounded-2xl text-lg sm:text-xl font-bold hover:bg-gray-900 transition-all duration-300 shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-dm-sans relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isLoading ? "Processing..." : "Get Instant Access"}
                      {!isLoading && (
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </span>
                  </button>
                )}
                
                <p className="text-xs text-center text-gray-400 font-space-grotesk">
                  Secure payment via Dodo Payments. Instant activation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Main page component with Suspense boundary
export default function EarlyAccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EarlyAccessContent />
    </Suspense>
  );
}
