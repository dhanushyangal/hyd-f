export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type NavGroup = {
  label: string;
  href: string;
  children?: NavLink[];
};

export const NAV_PRIMARY: NavGroup[] = [
  {
    label: "Product",
    href: "/features",
    children: [
      {
        label: "Features",
        href: "/features",
        description: "Text and image to 3D, preview, and pipeline exports.",
      },
      {
        label: "BlueFox 3D",
        href: "/bluefox3d",
        description: "The BlueFox 1 model for production meshes.",
      },
      {
        label: "API",
        href: "/api",
        description: "Programmatic generation for studio pipelines.",
      },
      {
        label: "Docs",
        href: "/docs",
        description: "Get started: prompt, preview, export.",
      },
    ],
  },
  {
    label: "Solutions",
    href: "/usecase",
    children: [
      {
        label: "All solutions",
        href: "/usecase",
        description: "Games, film, architecture, XR, and product visualization.",
      },
      {
        label: "Game Development",
        href: "/usecase/gamedev",
        description: "Characters, props, and environments for real-time engines.",
      },
      {
        label: "Film & Animation",
        href: "/usecase/filmproduction",
        description: "Concept and production assets for cinematic pipelines.",
      },
      {
        label: "Architecture",
        href: "/usecase/architecture",
        description: "Furniture and interiors for visualization.",
      },
      {
        label: "AR / VR & XR",
        href: "/usecase/arvr",
        description: "Lightweight assets for immersive builds.",
      },
      {
        label: "Product Visualization",
        href: "/usecase/productdesign",
        description: "SKU-ready 3D for marketing and commerce.",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  {
    label: "Company",
    href: "/about",
    children: [
      {
        label: "About",
        href: "/about",
        description: "Hydrilla and Hawan Research Labs.",
      },
      {
        label: "Research",
        href: "/research",
        description: "Hawan Research Labs and BlueFox.",
      },
      {
        label: "Careers",
        href: "/careers",
        description: "Open roles and how to apply.",
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Talk to the founders. Book a demo.",
      },
    ],
  },
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
