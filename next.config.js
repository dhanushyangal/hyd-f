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
      { source: "/3d-ai", destination: "/bluefox3d", permanent: true },
      { source: "/3d-ai/", destination: "/bluefox3d", permanent: true },
      { source: "/science-technology", destination: "/bluefox3d", permanent: true },
      { source: "/science-technology/", destination: "/bluefox3d", permanent: true },
      { source: "/roadmap", destination: "/about", permanent: true },
      { source: "/roadmap/", destination: "/about", permanent: true },
      { source: "/case-study", destination: "/usecase", permanent: true },
      { source: "/case-study/", destination: "/usecase", permanent: true },
      { source: "/hawan", destination: "/research", permanent: true },
      { source: "/hawan/", destination: "/research", permanent: true },
      { source: "/bluefox", destination: "/bluefox3d", permanent: true },
      { source: "/bluefox/", destination: "/bluefox3d", permanent: true },
      { source: "/bluefox-3d", destination: "/bluefox3d", permanent: true },
      { source: "/bluefox-3d/", destination: "/bluefox3d", permanent: true },
      { source: "/models", destination: "/bluefox3d", permanent: true },
      { source: "/models/", destination: "/bluefox3d", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/privacy/", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      { source: "/terms/", destination: "/terms-and-conditions", permanent: true },
      // Legacy blog query URLs → path-based routes (SEO + static caching)
      {
        source: "/blog",
        has: [{ type: "query", key: "category", value: "(?<category>.*)" }],
        destination: "/blog/category/:category",
        permanent: true,
      },
      {
        source: "/blog",
        has: [{ type: "query", key: "page", value: "(?<page>[0-9]+)" }],
        destination: "/blog/page/:page",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/index.md", destination: "/md/index" },
      { source: "/:file.md", destination: "/md/:file" },
      { source: "/:dir/:file.md", destination: "/md/:dir/:file" },
      { source: "/:dir/:subdir/:file.md", destination: "/md/:dir/:subdir/:file" },
    ];
  },
  // Caching headers: only static assets get long cache; documents stay fresh for Core Web Vitals
  async headers() {
    return [
      {
        // Marketing home — allow CDN to reuse prerender briefly (pairs with revalidate on page).
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/blog",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/blog/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
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
        source: "/llms.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
      {
        source: "/llms-full.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];
  },
};

module.exports = nextConfig;
