export type NavIconName =
  | "text"
  | "image"
  | "bluefox"
  | "features"
  | "preview"
  | "export"
  | "api"
  | "rigging"
  | "enterprise"
  | "security"
  | "game"
  | "film"
  | "architecture"
  | "arvr"
  | "product"
  | "studio"
  | "startup"
  | "docs"
  | "faq"
  | "blog"
  | "changelog"
  | "compare"
  | "about"
  | "team"
  | "careers"
  | "contact"
  | "research"
  | "brand";

export type NavLink = {
  label: string;
  href: string;
  description?: string;
  icon?: NavIconName;
};

export type NavColumn = {
  heading: string;
  items: NavLink[];
};

export type NavFeatured = {
  eyebrow: string;
  title: string;
  href: string;
  visual: "formats" | "game" | "docs" | "lab";
};

export type NavGroup = {
  label: string;
  href: string;
  columns?: NavColumn[];
  featured?: NavFeatured;
};

export const NAV_PRIMARY: NavGroup[] = [
  {
    label: "Product",
    href: "/features",
    columns: [
      {
        heading: "Generate",
        items: [
          { label: "Text to 3D", href: "/docs#text-to-3d", icon: "text", description: "Turn a sentence into a production mesh." },
          { label: "Image to 3D", href: "/docs#image-to-3d", icon: "image", description: "Start from a photo or concept render." },
          { label: "BlueFox 3D", href: "/bluefox3d", icon: "bluefox", description: "The model behind Hydrilla generation." },
        ],
      },
      {
        heading: "Pipeline",
        items: [
          { label: "Features", href: "/features", icon: "features", description: "What the studio pipeline includes." },
          { label: "Preview", href: "/docs#preview", icon: "preview", description: "Inspect materials before you export." },
          { label: "Exports", href: "/docs#export", icon: "export", description: "GLB, FBX, OBJ, and USDZ." },
        ],
      },
      {
        heading: "Build",
        items: [
          { label: "API", href: "/api", icon: "api", description: "Generate from your own product." },
          { label: "Rigging", href: "/rigging", icon: "rigging", description: "Pose characters for animation." },
        ],
      },
      {
        heading: "Scale",
        items: [
          { label: "Enterprise", href: "/enterprise", icon: "enterprise", description: "Seats, controls, and team support." },
          { label: "Security", href: "/security", icon: "security", description: "How customer data is handled." },
        ],
      },
    ],
    featured: {
      eyebrow: "BlueFox 1",
      title: "Give studios production meshes with PBR, ready for their engines",
      href: "/bluefox3d",
      visual: "formats",
    },
  },
  {
    label: "Solutions",
    href: "/usecase",
    columns: [
      {
        heading: "Industries",
        items: [
          { label: "Game development", href: "/usecase/gamedev", icon: "game", description: "Props and characters for real-time engines." },
          { label: "Film & animation", href: "/usecase/filmproduction", icon: "film", description: "Assets for shots, previs, and lookdev." },
          { label: "Architecture", href: "/usecase/architecture", icon: "architecture", description: "Spatial models for presentations." },
          { label: "AR / VR & XR", href: "/usecase/arvr", icon: "arvr", description: "Lightweight meshes for immersive apps." },
        ],
      },
      {
        heading: "Visualization",
        items: [
          { label: "Product visualization", href: "/usecase/productdesign", icon: "product", description: "Catalog-ready product models." },
          { label: "All solutions", href: "/usecase", icon: "features", description: "Every industry workflow in one place." },
        ],
      },
      {
        heading: "Teams",
        items: [
          { label: "Studios", href: "/enterprise", icon: "studio", description: "Pipelines built for production teams." },
          { label: "Enterprise", href: "/enterprise", icon: "enterprise", description: "Shared workspaces and admin controls." },
          { label: "Startup", href: "/pricing", icon: "startup", description: "Start generating without a studio setup." },
        ],
      },
    ],
    featured: {
      eyebrow: "Game development",
      title: "Characters, props, and environments for real-time engines",
      href: "/usecase/gamedev",
      visual: "game",
    },
  },
  {
    label: "Resources",
    href: "/docs",
    columns: [
      {
        heading: "Learn",
        items: [
          { label: "Documentation", href: "/docs", icon: "docs", description: "Guides from the first prompt to export." },
          { label: "FAQ", href: "/faq", icon: "faq", description: "Answers before you book a call." },
          { label: "Blog", href: "/blog", icon: "blog", description: "Notes on the product and the craft." },
          { label: "Changelog", href: "/changelog", icon: "changelog", description: "What shipped recently." },
        ],
      },
      {
        heading: "Compare",
        items: [
          { label: "Hydrilla vs Meshy", href: "/compare/hydrilla-vs-meshy", icon: "compare", description: "How the pipelines differ." },
          { label: "Hydrilla vs Tripo", href: "/compare/hydrilla-vs-tripo", icon: "compare", description: "Output, controls, and exports." },
          { label: "Hydrilla vs Luma", href: "/compare/hydrilla-vs-luma", icon: "compare", description: "Generation quality, side by side." },
          { label: "Best AI 3D generators", href: "/compare/best-ai-3d-generators", icon: "features", description: "A short field guide." },
        ],
      },
    ],
    featured: {
      eyebrow: "Docs",
      title: "From first prompt to a production export in your engine",
      href: "/docs",
      visual: "docs",
    },
  },
  {
    label: "Company",
    href: "/about",
    columns: [
      {
        heading: "Hydrilla",
        items: [
          { label: "About", href: "/about", icon: "about", description: "Why Hydrilla exists." },
          { label: "Team", href: "/team", icon: "team", description: "The people building BlueFox." },
          { label: "Careers", href: "/careers", icon: "careers", description: "Open roles at the lab." },
          { label: "Contact", href: "/contact", icon: "contact", description: "Talk with the team." },
        ],
      },
      {
        heading: "Lab",
        items: [
          { label: "Research", href: "/research", icon: "research", description: "Hawan Research Labs." },
          { label: "BlueFox 3D", href: "/bluefox3d", icon: "bluefox", description: "The model behind the product." },
        ],
      },
      {
        heading: "Trust",
        items: [
          { label: "Security", href: "/security", icon: "security", description: "Trust, access, and data handling." },
          { label: "Brand", href: "/brand", icon: "brand", description: "Marks, color, and usage." },
        ],
      },
    ],
    featured: {
      eyebrow: "Hawan Research Labs",
      title: "The lab that builds BlueFox, the model behind Hydrilla",
      href: "/research",
      visual: "lab",
    },
  },
  { label: "Pricing", href: "/pricing" },
];

export const FOOTER_NAV: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "Product",
    links: [
      { label: "How It Works", href: "/features" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "BlueFox 3D", href: "/bluefox3d" },
      { label: "API", href: "/api" },
      { label: "Enterprise", href: "/enterprise" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "Game Development", href: "/usecase/gamedev" },
      { label: "Film & Animation", href: "/usecase/filmproduction" },
      { label: "Architecture & Interiors", href: "/usecase/architecture" },
      { label: "AR / VR & XR", href: "/usecase/arvr" },
      { label: "Product Visualization", href: "/usecase/productdesign" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Compare", href: "/compare" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Research", href: "/research" },
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Security", href: "/security" },
    ],
  },
];
