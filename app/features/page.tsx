import Footer from "@/components/layout/Footer";
import FeaturesSection from "@/components/sections/FeaturesSection";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Features",
  description:
    "Text and image to 3D, rigging, editing, and export pipelines built for games, film, architecture, and real-time production.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <>
      <div className="pt-24 md:pt-28">
        <FeaturesSection />
      </div>
      <Footer />
    </>
  );
}
