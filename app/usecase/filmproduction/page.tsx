import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getUseCaseJsonLd } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DESCRIPTION =
  "Create characters, props, and environments for animation and VFX. Export to Maya, Blender, Cinema 4D, and Houdini-ready formats.";

const DATA = {
  id: "filmproduction" as const,
  headline: "Production assets for film pipelines",
  heroImage: USECASE_HERO.films,
  cardVertical: true,
  capabilitiesHeading: "Built for cinematic workflows",
  tagline:
    "Characters, props, and environments for animation and VFX—from early concept to DCC-ready exports.",
  example:
    "Use Hydrilla for concept meshes and set dressing before DCC hero work in Maya, Blender, Cinema 4D, or Houdini — a block-in you can light, not a finished film hero.",
  features: [
    {
      title: "High-detail generation",
      body: "Produce characters, props, and environments suited for animation and VFX review.",
    },
    {
      title: "Faster concept exploration",
      body: "Explore visual directions early—before committing artist time to final modeling.",
    },
    {
      title: "DCC-ready exports",
      body: "Export GLB, FBX, and OBJ for Maya, Blender, Cinema 4D, and Houdini.",
    },
    {
      title: "Art-directed control",
      body: "Guide style, scale, and context in prompts to keep results coherent.",
    },
  ],
  who: [
    {
      role: "Animation studios",
      description: "Accelerate pre-production with concept assets and background props.",
    },
    {
      role: "VFX artists",
      description: "Generate environment fill and debris without diverting hero-asset time.",
    },
    {
      role: "Concept artists",
      description: "Turn descriptions into 3D references for clearer team direction.",
    },
    {
      role: "Production designers",
      description: "Iterate set dressing and prop libraries for faster creative decisions.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "AI 3D Assets for Film & Animation",
  description: DESCRIPTION,
  path: "/usecase/filmproduction",
  keywords: [
    "AI 3D for film",
    "VFX asset generation",
    "animation 3D models",
    "text to 3D for VFX",
    "cinematic 3D assets",
  ],
  ogImage: USECASE_HERO.films,
});

export default function FilmProductionPage() {
  return (
    <>
      <JsonLd data={getUseCaseJsonLd({
        name: "Film & Animation",
        description: DESCRIPTION,
        path: "/usecase/filmproduction",
      })} />
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
