import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";
import { createPageMetadata } from "@/lib/seo";
import { USECASE_HERO } from "@/lib/cloudinary";

const DATA = {
  industry: "Game Development",
  headline: "Assets Built for Real-Time Production",
  heroImage: USECASE_HERO.games,
  accentColor: "#3b8ee8",
  tagline:
    "Generate game-ready characters, props, and environments with clean geometry optimized for Unreal Engine, Unity, and other real-time pipelines.",
  backHref: "/usecase",
  features: [
    {
      title: "Game-engine compatible models",
      body: "Generate characters, props, and environments with clean geometry suitable for Unreal Engine, Unity, and other real-time pipelines.",
    },
    {
      title: "Consistent asset iteration",
      body: "Create multiple variations of models while maintaining consistent style and scale across your game world.",
    },
    {
      title: "Scalable production pipeline",
      body: "Produce large asset libraries quickly without slowing down your development cycle or compromising visual consistency.",
    },
    {
      title: "Direct engine integration",
      body: "Export assets in formats ready for your engine workflow—FBX, GLB, OBJ, and more—with no extra conversion steps.",
    },
  ],
  who: [
    {
      role: "Game Studios",
      description: "Ship larger worlds faster by generating background assets, props, and environmental details at scale.",
    },
    {
      role: "Indie Developers",
      description: "Build complete 3D games without a large art team—generate the assets you need when you need them.",
    },
    {
      role: "3D Artists",
      description: "Accelerate concepting and asset creation with AI-generated starting points you can refine and polish.",
    },
    {
      role: "Technical Artists",
      description: "Integrate clean-topology assets directly into existing pipelines with minimal manual cleanup.",
    },
  ],
};

export const metadata = createPageMetadata({
  title: "Game Development",
  description: DATA.tagline,
  path: "/usecase/gamedev",
});

export default function GameDevPage() {
  return (
    <>
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
