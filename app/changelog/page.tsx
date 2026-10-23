import {
  PickleResearchPage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

const ENTRIES: PickleRelatedItem[] = [
  {
    title: "BlueFox 1 in the studio",
    subtitle:
      "Text-to-3D and image-to-3D with segmented meshes, PBR maps, in-browser preview, and GLB, FBX, OBJ, and USDZ export across Free, Starter, and Pro plans.",
    href: "/bluefox3d",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    videoSrc: WHY_HYDRILLA_MEDIA.bluefox.video,
    imageSrc: WHY_HYDRILLA_MEDIA.bluefox.poster,
  },
  {
    title: "Blender, Unity, Unreal & Godot Bridge",
    subtitle:
      "Local Bridge on 127.0.0.1:7345 and native add-ons for one-click Send to DCC from Studio, plus MCP Server for AI coding agents.",
    href: "/integrations",
    date: "Aug 24, 2026",
    author: "Hydrilla Team",
    thumbVariant: "pipeline-arch",
  },
  {
    title: "Studio REST API",
    subtitle:
      "Job-based generation for studios with an existing pipeline. Submit a prompt or reference image, poll status, and download production formats.",
    href: "/api",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "api-stream",
  },
  {
    title: "Docs, FAQ, and pipeline notes",
    subtitle:
      "Public getting-started docs, buyer FAQ, Hawan Research Labs model card, and comparison notes versus Meshy, Luma, and Tripo.",
    href: "/docs",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "critter-rig",
  },
];

export default function ChangelogPage() {
  return (
    <PickleResearchPage
      title="Changelog"
      description="Notes from the Hydrilla team on what shipped across BlueFox 1, Studio, DCC integrations, and the REST API."
      items={ENTRIES}
    />
  );
}
