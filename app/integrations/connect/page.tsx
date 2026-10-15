import { Suspense } from "react";
import { ConnectClient } from "@/components/integrations";
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
    <main className="flex min-h-[70vh] items-center justify-center bg-neutral-50 px-5 pt-28 text-[15px] text-neutral-600">
      Loading connect…
    </main>
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
    </>
  );
}
