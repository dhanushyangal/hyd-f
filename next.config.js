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
    // Enable image optimization formats
    formats: ["image/avif", "image/webp"],
    // Optimize images
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

