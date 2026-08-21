import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getUseCaseJsonLd } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DESCRIPTION =
  "Generate game-ready characters, props, and environments with clean geometry for Unreal Engine, Unity, and real-time pipelines.";

const DATA = {
  id: "gamedev" as const,
  headline: "Ship game-ready assets faster",
  heroImage: USECASE_HERO.games,
  capabilitiesHeading: "Built for real-time production",
  tagline:
    "Characters, props, and environments with clean geometry for Unreal, Unity, and other real-time pipelines.",
  example:
    "A typical Hydrilla job here is background props and environment fill for Unreal or Unity — crates, dressing, and set pieces you can import and light — not hero characters with no cleanup.",
  features: [
    {
      title: "Engine-ready models",
      body: "Generate characters, props, and environments with topology suited for Unreal, Unity, and other real-time engines.",
    },
    {
      title: "Consistent iteration",
      body: "Create variations while keeping style and scale coherent across your world.",
    },
    {
      title: "Scalable asset libraries",
      body: "Fill backgrounds, props, and environment details without slowing the art pipeline.",
    },
    {
      title: "Standard exports",
      body: "Download GLB, FBX, and OBJ for direct import into your engine workflow.",
    },
  ],
  who: [
    {
      role: "Game studios",
      description: "Scale background and environment assets without expanding the art team.",
    },
    {
      role: "Indie developers",
      description: "Build complete 3D worlds without a full modeling crew.",
    },
    {
      role: "3D artists",
      description: "Start from generated bases, then refine and polish.",
    },
    {
      role: "Technical artists",
      description: "Bring clean assets into existing pipelines with less cleanup.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "AI 3D Assets for Game Development",
  description: DESCRIPTION,
  path: "/usecase/gamedev",
  keywords: [
    "AI 3D game assets",
    "Unreal Engine 3D generation",
    "Unity asset generation",
    "game-ready 3D models",
    "text to 3D for games",
  ],
  ogImage: USECASE_HERO.games,
});

export default function GameDevPage() {
  return (
    <>
      <JsonLd data={getUseCaseJsonLd({
        name: "Game Development",
        description: DESCRIPTION,
        path: "/usecase/gamedev",
      })} />
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
