import { Suspense } from "react";
import { ConnectClient } from "@/components/integrations";
import Footer from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Connect DCC plugin",
  description:
    "Sign in with Hydrilla and connect Blender, Maya, Unity, and other DCC plugins through the local Bridge.",
  path: "/integrations/connect",
  noIndex: true,
});

function ConnectFallback() {
  return (
    <div className="pickle-article">
      <header className="pickle-article-header">
        <p className="pickle-article-kicker">Integrations</p>
        <h1 className="pickle-article-title">Studio Bridge</h1>
        <p className="pickle-article-subtitle">Loading local Bridge connection…</p>
      </header>
    </div>
  );
}

export default function IntegrationsConnectPage() {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Connect DCC plugin",
          description: "Sign in and connect your local Hydrilla Bridge.",
          path: "/integrations/connect",
        })}
      />
      <Suspense fallback={<ConnectFallback />}>
        <ConnectClient />
      </Suspense>
      <Footer />
    </>
  );
}
