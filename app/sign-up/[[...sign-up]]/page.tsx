"use client";

import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon, Type, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[440px]">
          {/* Logo */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center">
              <span className="text-2xl font-semibold text-black tracking-tight">
                Hydrilla
              </span>
            </Link>
          </div>

          {/* Sign Up Component */}
          <SignUp
            afterSignUpUrl="/generate"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-lg border border-gray-200 rounded-2xl p-8 bg-white",
                headerTitle: "text-black text-2xl font-bold mb-2",
                headerSubtitle: "text-gray-600 text-base",
                socialButtonsBlockButton:
                  "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium rounded-lg h-11",
                socialButtonsBlockButtonText: "text-gray-700 font-medium",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500 text-sm",
                formFieldLabel: "text-gray-700 text-sm font-medium",
                formFieldInput:
                  "bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg",
                formButtonPrimary:
                  "bg-black text-white hover:bg-gray-900 font-semibold transition-all rounded-lg",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                footerActionText: "text-gray-600",
                identityPreviewText: "text-gray-900",
                identityPreviewEditButton: "text-blue-600",
                formFieldInputShowPasswordButton: "text-gray-600 hover:text-gray-900",
                footer: "hidden",
                footerPages: "hidden",
                formFooter: "hidden",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
          />

          {/* Already have account link */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">Already have an account? </span>
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Video Background */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden">
        {/* Background GIF - No overlay, just clean video */}
        <div className="absolute inset-0">
          <Image
            src="/bg-hydrilla.gif"
            alt="Hydrilla Background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg mx-auto px-12">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-semibold text-white mb-5 leading-tight tracking-tight">
              Create stunning
              <br />
              3D models with AI
            </h2>

            <p className="text-lg text-white/95 leading-relaxed">
              Transform your ideas into production-ready 3D assets
            </p>
          </div>

          {/* Features with professional glacier icons */}
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-lg">
                <ImageIcon className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-medium text-white">Image to 3D</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-lg">
                <Type className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-medium text-white">Text to 3D</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center flex-shrink-0 border border-white/20 shadow-lg">
                <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-xl font-medium text-white">Production Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

