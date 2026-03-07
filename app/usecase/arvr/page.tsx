import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";

const DATA = {
  industry: "AR / VR & XR",
  headline: "Assets Designed for Immersive Environments",
  heroImages: ["/usecase/arvr3.jpg", "/usecase/arvrxr.jpg", "/usecase/arvrxr2.jpg"],
  accentColor: "#3bbf8e",
  tagline:
    "Create lightweight assets and explore Gaussian splatting–based worlds for VR and XR. From real-time 3D models to interactive splat environments—inspired by approaches like World Labs' Splat World—optimized for immersive pipelines.",
  backHref: "/usecase",
  features: [
    {
      title: "Real-time optimized models",
      body: "Create lightweight assets suitable for interactive environments, simulations, and spatial applications.",
    },
    {
      title: "Gaussian splatting & interactive worlds",
      body: "Use 3D assets alongside splat-based environments for VR—similar to World Labs' Marble and Splat World: interactive, physics-aware scenes built in tools like Unity with real-time splat manipulation, lighting, and effects.",
    },
    {
      title: "Rapid spatial prototyping",
      body: "Generate objects and environments quickly while developing immersive experiences.",
    },
    {
      title: "Platform-ready exports",
      body: "Export assets optimized for Meta Quest, Apple Vision Pro, and WebXR applications with no extra conversion.",
    },
    {
      title: "Consistent spatial scale",
      body: "Generate assets with accurate real-world scale, ready for immediate placement in immersive environments.",
    },
  ],
  who: [
    {
      role: "XR Studios",
      description: "Populate virtual spaces with contextual objects and environments generated at production speed.",
    },
    {
      role: "Game Developers",
      description: "Build AR and VR game worlds faster by generating optimized assets without bottlenecking the art team.",
    },
    {
      role: "Experience Designers",
      description: "Prototype and iterate on spatial experiences quickly by generating the objects you need on demand.",
    },
    {
      role: "Enterprise Training Teams",
      description: "Create 3D training environments and simulation assets without custom modeling for each scenario.",
    },
  ],
};

export default function ARVRPage() {
  return (
    <>
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
