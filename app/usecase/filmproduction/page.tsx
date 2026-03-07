import UseCasePage from "../../../components/sections/UseCasePage";
import Footer from "../../../components/layout/Footer";

const DATA = {
  industry: "Film & Animation",
  headline: "Production Assets for Cinematic Pipelines",
  heroImage: "/usecase/films.png",
  cardVertical: true,
  accentColor: "#e06c3b",
  tagline:
    "Create detailed models for characters, props, and environments that integrate seamlessly into animation and VFX workflows.",
  backHref: "/usecase",
  features: [
    {
      title: "High-fidelity asset generation",
      body: "Create detailed models for characters, props, and environments that integrate into animation and VFX workflows.",
    },
    {
      title: "Faster concept exploration",
      body: "Generate visual variations early in production to help teams refine direction before final modeling and texturing.",
    },
    {
      title: "Pipeline-ready exports",
      body: "Export assets in formats compatible with major DCC tools—Maya, Blender, Cinema 4D, and Houdini.",
    },
    {
      title: "Art-directed results",
      body: "Maintain visual consistency across assets by specifying style, scale, and context in your prompts.",
    },
  ],
  who: [
    {
      role: "Animation Studios",
      description: "Accelerate pre-production by generating concept assets and background props at scale.",
    },
    {
      role: "VFX Artists",
      description: "Create environment elements, debris, and background objects without diverting artist time from hero assets.",
    },
    {
      role: "Concept Artists",
      description: "Turn descriptions into 3D references quickly to communicate visual direction to the wider team.",
    },
    {
      role: "Production Designers",
      description: "Build and iterate on set dressing and prop libraries for faster creative decision-making.",
    },
  ],
};

export default function FilmProductionPage() {
  return (
    <>
      <UseCasePage data={DATA} />
      <Footer />
    </>
  );
}
