"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "../../components/layout/Footer";

// Team member data structure
interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  connect?: string;
}

// Team members data
const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Tharak Nagaveti",
    role: "Co-Founder & CEO",
    image: "/Tharakhydrilla1.png",
    connect: "https://www.linkedin.com/in/tharak-nagaveti-8a5270187/"
    
  },
  {
    id: "2",
    name: "Dharani Kumar",
    role: "Co-Founder & CTO",
    image: "/WhatsApp Image 2025-08-30 at 1.22.42 AM.jpeg",
    connect: "https://www.linkedin.com/in/yengala-dharani-kumar-4b7948221/"
    
  },
  {
    id: "3",
    name: "Tejesh Varma",
    role: "Co-Founder & CGO",
    image: "/WhatsApp Image 2025-08-30 at 12.11.21 AM.jpeg",
    connect: "https://www.linkedin.com/in/yenugudhati-tejesh-varma-478b51343/"
    
  },
  {
    id: "4",
    name: "Aditya Sontena",
    role: "Team Member",
    image: "/WhatsApp Image 2025-08-30 at 1.54.55 AM.jpeg",
    connect: "https://www.linkedin.com/in/aditya-sai-sontena-a90125334/"
  },
  {
    id: "5",
    name: "Rishik Kalyan",
    role: "Team Member",
    image: "/WhatsApp Image 2025-08-30 at 1.26.51 AM.jpeg",
    connect: "https://www.linkedin.com/in/rishik-kalyan-078ab631a/"
  },
  {
    id: "6",
    name: "Hem Charan",
    role: "Software Engineer",
    image: "/hemhydrilla.png",
    connect: "https://www.linkedin.com/in/mundlapati-hemcharan-58a506333/"
  },
  {
    id: "7",
    name: "Krishna Manohar",
    role: "Software Engineer",
    image: "/manhydrilla.png",
    connect: "https://www.linkedin.com/in/varada-krishna-manohar-9a36a5369/"
  },
  {
    id: "8",
    name: "Kishan Kumar",
    role: "Marketing Head",
    image: "/kishanhydrilla.png",
    connect: "https://www.linkedin.com/in/kishan-kumar-t-321149319/"
  },
];

export default function TeamPage() {
  // Refs for sections (navbar will detect scroll position)
  const heroSectionRef = useRef<HTMLElement>(null);
  const teamSectionRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative min-h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/ourteamhydrilla.webp"
            alt="Our Team Background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
          {/* Subtitle */}
          <p 
            className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6 font-mono tracking-wide"
            style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, monospace' }}
          >
            ( Our team is here for you. )
          </p>
          
          {/* Main Heading */}
          <h1 className="text-center">
            <span 
              className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight tracking-tight font-bold"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Our Team
            </span>
          </h1>
        </div>
      </section>

      {/* Team Grid Section */}
      <section 
        ref={teamSectionRef}
        className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-neutral-50"
        style={{
          paddingBlock: 'calc(var(--spacing, 0.25rem) * 24)',
          paddingBottom: 'calc(var(--spacing, 0.25rem) * 48)',
          width: '90%',
          maxWidth: 'none',
          marginInline: 'auto',
          paddingInline: 'calc(var(--spacing, 0.25rem) * 4)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative overflow-hidden rounded-2xl bg-white cursor-pointer transition-all duration-500 ease-out"
              >
                {/* Image - Always Visible */}
                <div className="relative aspect-square overflow-hidden rounded-2xl">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-all duration-500 ease-out group-hover:blur-md group-hover:scale-110"
                  />
                </div>

                {/* Hover State: Clear Glassmorphism Overlay - Centered Text */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl z-10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div 
                    className="flex flex-col items-center justify-center text-center gap-0.5 transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out w-full px-2"
                    style={{
                      transitionTimingFunction: 'cubic-bezier(0.4, 0.25, 0.2, 1)',
                      transitionDuration: '0.382s',
                    }}
                  >
                    <h3 
                      className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight mb-1"
                      style={{ 
                        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
                        fontWeight: 'var(--font-weight-bold, 700)',
                      }}
                    >
                      {member.name.split(' ').map((namePart, idx) => (
                        <span key={idx} className="block">{namePart}</span>
                      ))}
                    </h3>
                    <p 
                      className="text-sm sm:text-base text-white/95 mb-3 leading-relaxed"
                      style={{ 
                        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 0, 0, 0.4)',
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      {member.role}
                    </p>
                    {member.connect && (
                      <>
                        <div className="border-t border-white/30 w-full max-w-[120px] my-1.5"></div>
                        <Link
                          href={member.connect}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white underline decoration-2 underline-offset-3 hover:text-white/80 transition-colors text-sm sm:text-base font-medium"
                          style={{ 
                            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                            textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                            fontWeight: 'var(--font-weight-medium, 500)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          CONNECT
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

