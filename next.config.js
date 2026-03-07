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
  // Add caching headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Static assets - long cache
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Images - long cache
        source: "/:all*(jpg|jpeg|png|gif|svg|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

