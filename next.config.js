/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use this directory as workspace root so Turbopack doesn't warn about multiple lockfiles
  turbopack: {
    root: __dirname,
  },
  // Skew protection (stale Server Action IDs after deploy):
  // 1. Enable in Vercel → Project → Settings → Advanced → Skew Protection
  // 2. Optionally set build+runtime env NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
  //    (`openssl rand -base64 32`) so action encryption stays stable across builds.
  // https://nextjs.org/docs/messages/failed-to-find-server-action
  // https://vercel.com/docs/skew-protection
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.tencentcos.cn" },
      { protocol: "https", hostname: "**.myqcloud.com" },
      { protocol: "https", hostname: "hydrilla-outputs-1.s3.amazonaws.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
    // Cap sizes to avoid "Array buffer allocation failed" (sharp allocates less memory)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Redirect /generate → /workspace so we never compile the heavy generate page on direct hit
  async redirects() {
    return [
      { source: "/generate", destination: "/workspace", permanent: false },
      { source: "/generate/", destination: "/workspace", permanent: false },
    ];
  },
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
      {
        source: "/herohydrillasrc.jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/herohydrilla.mp4",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/hyd01.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

module.exports = nextConfig;
