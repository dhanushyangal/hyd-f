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
          { label: "Text to 3D", href: "/docs#text-to-3d", icon: "text" },
          { label: "Image to 3D", href: "/docs#image-to-3d", icon: "image" },
          { label: "BlueFox 3D", href: "/bluefox3d", icon: "bluefox" },
        ],
      },
      {
        heading: "Pipeline",
        items: [
          { label: "Features", href: "/features", icon: "features" },
          { label: "Preview", href: "/docs#preview", icon: "preview" },
          { label: "Exports", href: "/docs#export", icon: "export" },
        ],
      },
      {
        heading: "Build",
        items: [
          { label: "API", href: "/api", icon: "api" },
          { label: "Rigging", href: "/rigging", icon: "rigging" },
        ],
      },
      {
        heading: "Scale",
        items: [
          { label: "Enterprise", href: "/enterprise", icon: "enterprise" },
          { label: "Security", href: "/security", icon: "security" },
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
          { label: "Game development", href: "/usecase/gamedev", icon: "game" },
          { label: "Film & animation", href: "/usecase/filmproduction", icon: "film" },
          { label: "Architecture", href: "/usecase/architecture", icon: "architecture" },
          { label: "AR / VR & XR", href: "/usecase/arvr", icon: "arvr" },
        ],
      },
      {
        heading: "Visualization",
        items: [
          { label: "Product visualization", href: "/usecase/productdesign", icon: "product" },
          { label: "All solutions", href: "/usecase", icon: "features" },
        ],
      },
      {
        heading: "Teams",
        items: [
          { label: "Studios", href: "/enterprise", icon: "studio" },
          { label: "Enterprise", href: "/enterprise", icon: "enterprise" },
          { label: "Startup", href: "/pricing", icon: "startup" },
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
          { label: "Documentation", href: "/docs", icon: "docs" },
          { label: "FAQ", href: "/faq", icon: "faq" },
          { label: "Blog", href: "/blog", icon: "blog" },
          { label: "Changelog", href: "/changelog", icon: "changelog" },
        ],
      },
      {
        heading: "Compare",
        items: [
          { label: "Hydrilla vs Meshy", href: "/compare/hydrilla-vs-meshy", icon: "compare" },
          { label: "Hydrilla vs Tripo", href: "/compare/hydrilla-vs-tripo", icon: "compare" },
          { label: "Hydrilla vs Luma", href: "/compare/hydrilla-vs-luma", icon: "compare" },
          { label: "Best AI 3D generators", href: "/compare/best-ai-3d-generators", icon: "features" },
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
          { label: "About", href: "/about", icon: "about" },
          { label: "Team", href: "/team", icon: "team" },
          { label: "Careers", href: "/careers", icon: "careers" },
          { label: "Contact", href: "/contact", icon: "contact" },
        ],
      },
      {
        heading: "Lab",
        items: [
          { label: "Research", href: "/research", icon: "research" },
          { label: "BlueFox 3D", href: "/bluefox3d", icon: "bluefox" },
        ],
      },
      {
        heading: "Trust",
        items: [
          { label: "Security", href: "/security", icon: "security" },
          { label: "Brand", href: "/brand", icon: "brand" },
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
