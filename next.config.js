/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use this directory as workspace root so Turbopack doesn't warn about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.tencentcos.cn" },
      { protocol: "https", hostname: "**.myqcloud.com" },
      { protocol: "https", hostname: "**" }
    ],
    // Cap sizes to avoid "Array buffer allocation failed" (sharp allocates less memory)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Caching headers: only static assets get long cache; documents stay fresh for Core Web Vitals
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Allow CDN/browser to cache images in common paths
        source: "/3d-images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

