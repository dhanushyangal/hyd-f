import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { createPageMetadata } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DATA = {
  industry: "Architecture & Interiors",
  headline: "Architectural Visualization Assets",
  heroImage: USECASE_HERO.archi,
  accentColor: "#7b5af5",
  tagline:
    "Generate furniture, architectural components, and interior objects suitable for visualization workflows—without the modeling bottleneck.",
  backHref: "/usecase",
  features: [
    {
      title: "Interior and structural elements",
      body: "Generate furniture, architectural components, and interior objects suitable for visualization workflows.",
    },
    {
      title: "Rapid design iteration",
      body: "Explore layout and design variations quickly before committing to final modeling and rendering.",
    },
    {
      title: "Client-ready visualization",
      body: "Create compelling 3D assets for client presentations and project pitches with speed and precision.",
    },
    {
      title: "Compatible exports",
      body: "Export models in formats compatible with your visualization and rendering tools—3ds Max, Revit, SketchUp, and more.",
    },
  ],
  who: [
    {
      role: "Architecture Firms",
      description: "Speed up design development by generating 3D representations of spaces and components.",
    },
    {
      role: "Interior Designers",
      description: "Populate rooms with furniture and objects instantly to visualize and present design concepts.",
    },
    {
      role: "Visualization Studios",
      description: "Produce large quantities of set dressing and props without exhausting your modeling pipeline.",
    },
    {
      role: "Real Estate Developers",
      description: "Generate staged interior visuals quickly for marketing materials and buyer presentations.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "Architecture & Interiors",
  description: DATA.tagline,
  path: "/usecase/architecture",
});

export default function ArchitecturePage() {
  return (
    <>
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
