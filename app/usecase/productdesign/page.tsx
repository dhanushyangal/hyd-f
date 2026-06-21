import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { createPageMetadata } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DATA = {
  industry: "Product Visualization",
  headline: "Product Assets for Visualization and Marketing",
  heroImage: USECASE_HERO.prod,
  accentColor: "#f0a830",
  tagline:
    "Create detailed models suitable for product visualization, marketing assets, and e-commerce experiences—from concept to production in seconds.",
  backHref: "/usecase",
  features: [
    {
      title: "Clean product model generation",
      body: "Create detailed models suitable for product visualization, marketing assets, and e-commerce experiences.",
    },
    {
      title: "Flexible concept presentation",
      body: "Turn early product ideas into visual assets that teams can use across design, marketing, and presentation workflows.",
    },
    {
      title: "E-commerce ready",
      body: "Generate product visuals optimized for 3D commerce platforms and AR try-on experiences.",
    },
    {
      title: "Rapid variant creation",
      body: "Create color, material, and configuration variants of products quickly for comprehensive marketing coverage.",
    },
  ],
  who: [
    {
      role: "Product Designers",
      description: "Visualize product concepts in 3D early in the process to validate design direction before physical prototyping.",
    },
    {
      role: "Marketing Teams",
      description: "Generate a full library of product visuals for campaigns, ads, and digital channels without a full studio shoot.",
    },
    {
      role: "E-commerce Brands",
      description: "Create 3D product listings and AR try-on experiences that increase buyer confidence and reduce returns.",
    },
    {
      role: "Industrial Designers",
      description: "Accelerate the concepting phase by generating and iterating on 3D product forms rapidly.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "Product Visualization",
  description: DATA.tagline,
  path: "/usecase/productdesign",
});

export default function ProductDesignPage() {
  return (
    <>
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
