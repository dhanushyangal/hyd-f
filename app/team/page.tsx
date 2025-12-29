"use client";

import { useRef, useState } from "react";
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
];

export default function TeamPage() {
  // Refs for sections (navbar will detect scroll position)
  const heroSectionRef = useRef<HTMLElement>(null);
  const teamSectionRef = useRef<HTMLElement>(null);
  
  // Loading states for images
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());

  const handleImageLoad = (imageId: string) => {
    setImagesLoaded((prev) => new Set(prev).add(imageId));
  };

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
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6 font-mono tracking-wide">
            ( Our team is here for you. )
          </p>
          
          {/* Main Heading */}
          <h1 className="text-center">
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-tight tracking-tight font-bold font-dm-sans">
              Our Team
            </span>
          </h1>
        </div>
      </section>

      {/* Team Grid Section */}
      <section 
        ref={teamSectionRef}
        className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-neutral-50 w-[90%] max-w-none mx-auto z-10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative overflow-hidden rounded-2xl bg-white cursor-pointer transition-all duration-500 ease-out"
              >
                {/* Image - Always Visible */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-200">
                  {!imagesLoaded.has(member.id) && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-8 h-8 spinner border-black"></div>
                    </div>
                  )}
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className={`object-cover transition-all duration-500 ease-out group-hover:blur-md group-hover:scale-110 ${
                      imagesLoaded.has(member.id) ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => handleImageLoad(member.id)}
                  />
                </div>

                {/* Hover State: Clear Glassmorphism Overlay - Centered Text */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl z-10 glass-overlay">
                  <div className="flex flex-col items-center justify-center text-center gap-0.5 transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all w-full px-2 ease-[cubic-bezier(0.4,0.25,0.2,1)] duration-[382ms]">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight mb-1 font-dm-sans [text-shadow:0_2px_8px_rgba(0,0,0,0.8),0_0_20px_rgba(0,0,0,0.5)]">
                      {member.name.split(' ').map((namePart, idx) => (
                        <span key={idx} className="block">{namePart}</span>
                      ))}
                    </h3>
                    <p className="text-sm sm:text-base text-white/95 mb-3 leading-relaxed font-dm-sans font-normal [text-shadow:0_1px_4px_rgba(0,0,0,0.6),0_0_10px_rgba(0,0,0,0.4)]">
                      {member.role}
                    </p>
                    {member.connect && (
                      <>
                        <div className="border-t border-white/30 w-full max-w-[120px] my-1.5"></div>
                        <Link
                          href={member.connect}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white underline decoration-2 underline-offset-3 hover:text-white/80 transition-colors text-sm sm:text-base font-medium font-dm-sans [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
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

