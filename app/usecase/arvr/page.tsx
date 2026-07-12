import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getUseCaseJsonLd } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DESCRIPTION =
  "Create lightweight, spatially coherent 3D assets for VR, AR, and spatial applications. Export formats ready for immersive pipelines.";

const DATA = {
  id: "arvr" as const,
  headline: "Assets for immersive experiences",
  heroImages: [USECASE_HERO.arvr3, USECASE_HERO.arvrxr, USECASE_HERO.arvrxr2],
  capabilitiesHeading: "Built for spatial pipelines",
  tagline:
    "Lightweight, spatially coherent 3D for VR, AR, and spatial apps—from prototype to production.",
  features: [
    {
      title: "Real-time friendly models",
      body: "Generate assets suited for interactive environments and spatial applications.",
    },
    {
      title: "Rapid spatial prototyping",
      body: "Place objects and environments quickly while iterating immersive experiences.",
    },
    {
      title: "Platform exports",
      body: "Export GLB and related formats for Quest, Vision Pro, and WebXR workflows.",
    },
    {
      title: "Consistent scale",
      body: "Produce assets with coherent proportions for placement in spatial scenes.",
    },
  ],
  who: [
    {
      role: "XR studios",
      description: "Populate virtual spaces with contextual objects at production speed.",
    },
    {
      role: "Game developers",
      description: "Build AR and VR worlds without bottlenecking the art team.",
    },
    {
      role: "Experience designers",
      description: "Prototype spatial scenes by generating the objects you need on demand.",
    },
    {
      role: "Training teams",
      description: "Create simulation assets without custom modeling for every scenario.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "AI 3D Assets for AR, VR & XR",
  description: DESCRIPTION,
  path: "/usecase/arvr",
  keywords: [
    "AI 3D for VR",
    "AR asset generation",
    "WebXR 3D models",
    "spatial computing assets",
    "text to 3D for XR",
  ],
  ogImage: USECASE_HERO.arvr3,
});

export default function ARVRPage() {
  return (
    <>
      <JsonLd data={getUseCaseJsonLd({
        name: "AR / VR & XR",
        description: DESCRIPTION,
        path: "/usecase/arvr",
      })} />
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
