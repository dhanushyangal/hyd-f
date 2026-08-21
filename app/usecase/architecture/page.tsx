import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getUseCaseJsonLd } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DESCRIPTION =
  "Generate furniture, interiors, and architectural elements for visualization, client presentations, and design reviews.";

const DATA = {
  id: "architecture" as const,
  headline: "Visualization assets without the modeling wait",
  heroImage: USECASE_HERO.archi,
  capabilitiesHeading: "Built for design visualization",
  tagline:
    "Furniture, interiors, and architectural components for presentations and design reviews.",
  example:
    "Furniture and interior fill for visualization — chairs, tables, and dressing you can drop into a viz scene. Hydrilla is not BIM and not a CAD kernel.",
  features: [
    {
      title: "Interiors & furnishings",
      body: "Generate furniture and interior objects for visualization scenes.",
    },
    {
      title: "Rapid design iteration",
      body: "Explore layout and material directions before final modeling and rendering.",
    },
    {
      title: "Client-ready visuals",
      body: "Produce 3D assets for pitches and reviews without a long modeling cycle.",
    },
    {
      title: "Standard 3D exports",
      body: "Download GLB, FBX, and OBJ for import into your visualization tools.",
    },
  ],
  who: [
    {
      role: "Architecture firms",
      description: "Speed design development with 3D representations of spaces and components.",
    },
    {
      role: "Interior designers",
      description: "Populate rooms with furniture and objects for concept presentations.",
    },
    {
      role: "Visualization studios",
      description: "Scale set dressing and props without exhausting the modeling pipeline.",
    },
    {
      role: "Real estate teams",
      description: "Stage interior visuals quickly for marketing and buyer materials.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "AI 3D Assets for Architecture & Interiors",
  description: DESCRIPTION,
  path: "/usecase/architecture",
  keywords: [
    "AI architectural visualization",
    "3D furniture generation",
    "interior design 3D assets",
    "archviz AI",
    "text to 3D architecture",
  ],
  ogImage: USECASE_HERO.archi,
});

export default function ArchitecturePage() {
  return (
    <>
      <JsonLd data={getUseCaseJsonLd({
        name: "Architecture & Interiors",
        description: DESCRIPTION,
        path: "/usecase/architecture",
      })} />
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
