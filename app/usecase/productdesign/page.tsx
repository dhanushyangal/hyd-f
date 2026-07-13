import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getUseCaseJsonLd } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DESCRIPTION =
  "Turn product concepts into polished 3D for marketing, e-commerce, and digital storefronts. Export standard formats for your stack.";

const DATA = {
  id: "productdesign" as const,
  headline: "Product visuals from concept to commerce",
  heroImage: USECASE_HERO.prod,
  capabilitiesHeading: "Built for product teams",
  tagline:
    "Marketing-ready 3D for packaging, campaigns, and digital storefronts.",
  features: [
    {
      title: "Clean product models",
      body: "Generate detailed product forms for visualization and marketing.",
    },
    {
      title: "Concept to presentation",
      body: "Turn early ideas into assets design and marketing can share.",
    },
    {
      title: "Commerce-ready exports",
      body: "Download GLB and related formats for 3D viewers and digital storefronts.",
    },
    {
      title: "Rapid variants",
      body: "Explore color, material, and configuration options without remastering each asset.",
    },
  ],
  who: [
    {
      role: "Product designers",
      description: "Validate form and direction in 3D before physical prototyping.",
    },
    {
      role: "Marketing teams",
      description: "Build campaign visuals without a full studio shoot for every SKU.",
    },
    {
      role: "E-commerce brands",
      description: "Add 3D product views that help buyers decide with confidence.",
    },
    {
      role: "Industrial designers",
      description: "Iterate product forms faster in early concept phases.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "AI 3D Assets for Product Visualization",
  description: DESCRIPTION,
  path: "/usecase/productdesign",
  keywords: [
    "AI product visualization",
    "3D product models",
    "e-commerce 3D assets",
    "text to 3D product design",
    "marketing 3D generation",
  ],
  ogImage: USECASE_HERO.prod,
});

export default function ProductDesignPage() {
  return (
    <>
      <JsonLd data={getUseCaseJsonLd({
        name: "Product Visualization",
        description: DESCRIPTION,
        path: "/usecase/productdesign",
      })} />
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
