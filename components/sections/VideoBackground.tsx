"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface VideoBackgroundProps {
  videoSrc: string;
  posterSrc: string;
  overlay?: boolean;
}

/**
 * Optimized Video Background Component
 * Features mobile performance optimizations
 */
export default function VideoBackground({ 
  videoSrc, 
  posterSrc, 
  overlay = true 
}: VideoBackgroundProps) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Detect low-end devices and slow networks
    const checkDeviceAndNetwork = () => {
      // Check for low-end device indicators
      const hardwareConcurrency = navigator.hardwareConcurrency || 2;
      const deviceMemory = (navigator as any).deviceMemory || 4;
      const isLowEnd = hardwareConcurrency <= 2 || deviceMemory <= 2;

      // Check network connection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const isSlowNetwork = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.saveData === true
      );

      setIsLowEndDevice(isLowEnd || isSlowNetwork);

      // Delay video loading to not block first contentful paint
      if (!isLowEnd && !isSlowNetwork) {
        const timer = setTimeout(() => {
          setShouldLoadVideo(true);
        }, 100); // Small delay after initial render

        return () => clearTimeout(timer);
      }
    };

    checkDeviceAndNetwork();
  }, []);

  const handleVideoCanPlay = () => {
    setVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, but video is ready
      });
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      {/* Poster Image (shown immediately) */}
      <Image
        src={posterSrc}
        alt="Background"
        fill
        className="object-cover"
        priority
      />
      
      {/* Overlay for better text readability */}
      {overlay && <div className="absolute inset-0 bg-black/20"></div>}

      {/* Video Background - Lazy loaded and optimized */}
      {shouldLoadVideo && !isLowEndDevice && (
        <>
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            poster={posterSrc}
            playsInline
            muted
            loop
            preload="metadata"
            onCanPlay={handleVideoCanPlay}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          {/* Overlay for better text readability */}
          {overlay && <div className="absolute inset-0 bg-black/20"></div>}
        </>
      )}
    </div>
  );
}

