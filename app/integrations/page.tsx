import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATIONS,
  integrationsByCategory,
} from "@/lib/integrations";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Integrations — Blender, Maya, Unity, Unreal, MCP",
  description:
    "Install Hydrilla plugins for Blender, Maya, 3ds Max, Unity, Unreal, and Godot. Generate in-app, or send meshes from Studio through the local Bridge. MCP and REST API included.",
  path: "/integrations",
  keywords: [
    "Hydrilla Blender plugin",
    "Hydrilla Maya plugin",
    "Unity 3D integration",
    "Unreal Engine AI 3D",
    "MCP 3D generation",
  ],
});

const AVAILABLE_COUNT = INTEGRATIONS.filter(
  (item) => item.status === "available"
).length;

export default function IntegrationsPage() {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Integrations",
          description:
            "Connect Hydrilla to Blender, Maya, Unity, Unreal, Godot, MCP agents, and the REST API.",
          path: "/integrations",
        })}
      />
      <MarketingPage
        eyebrow="Integrations"
        title="Your tools, Hydrilla inside"
        description="Native plugins for DCCs and game engines, a local Bridge for Studio → app send, plus MCP and REST for custom pipelines."
        formats={false}
        heroRule={false}
        related={[
          { label: "API", href: "/api", hint: "Developer REST access" },
          { label: "API keys", href: "/app/api-keys", hint: "Create a hyd_live_ key" },
          { label: "Docs", href: "/docs", hint: "Studio workflow" },
        ]}
      >
        <section className="mx-auto max-w-[42rem] px-5 pb-10 sm:px-6">
          <h2
            className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
            style={{
              fontFamily:
                "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            How it works
          </h2>
          <ol className="mt-5 space-y-5 text-[16px] leading-7 text-neutral-700">
            <li className="flex gap-4">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-950"
                aria-hidden
              >
                1
              </span>
              <span>
                <span className="font-semibold text-neutral-950">Install a plugin</span>
                {" "}
                for your app (Blender, Maya, Unity, and more), then start the built-in Bridge so Studio can reach it.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-950"
                aria-hidden
              >
                2
              </span>
              <span>
                <span className="font-semibold text-neutral-950">Sign in</span>
                {" "}
                with the same Hydrilla account you use in Studio, Sync inside the plugin, and leave the Connect tab open while you generate — or paste a{" "}
                <code className="text-[14px]">hyd_live_</code> API key instead.
              </span>
            </li>
            <li className="flex gap-4">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[13px] font-semibold text-neutral-950"
                aria-hidden
              >
                3
              </span>
              <span>
                <span className="font-semibold text-neutral-950">Generate or send</span>
                {" "}
                from the plugin panel, or click Send to DCC in Studio to drop a mesh into the open scene.
              </span>
            </li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/integrations/connect"
              className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
            >
              Sign in for plugins
            </Link>
            <Link
              href="/app/api-keys"
              className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              Create API key
            </Link>
          </div>
        </section>

        {INTEGRATION_CATEGORIES.map((category) => {
          const items = integrationsByCategory(category.id);
          if (items.length === 0) {
            return null;
          }
          return (
            <section
              key={category.id}
              className="mx-auto max-w-[42rem] px-5 pb-12 sm:px-6"
            >
              <h2
                className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
                style={{
                  fontFamily:
                    "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
                }}
              >
                {category.title}
              </h2>
              <p className="mt-2 text-[15px] leading-6 text-neutral-600">
                {category.description}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <IntegrationCard key={item.slug} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mx-auto max-w-[42rem] px-5 pb-16 sm:px-6">
          <h2
            className="text-[22px] font-semibold tracking-[-0.03em] text-neutral-950"
            style={{
              fontFamily:
                "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            FAQ
          </h2>
          <dl className="mt-8 space-y-8">
            <div>
              <dt className="text-[16px] font-semibold text-neutral-950">
                Do I need a separate login for plugins?
              </dt>
              <dd className="mt-2 text-[16px] leading-7 text-neutral-700">
                No. Use Sign in for plugins with your Studio account, then Sync in the add-on.
                Keep that Connect browser tab open while you generate so your session stays fresh.
                An API key works as an alternative if you prefer keys over browser sign-in.
              </dd>
            </div>
            <div>
              <dt className="text-[16px] font-semibold text-neutral-950">
                What is the Bridge?
              </dt>
              <dd className="mt-2 text-[16px] leading-7 text-neutral-700">
                A small local server started from inside the plugin. It lets Studio send a mesh
                straight into your open DCC or engine, and it carries the signed-in session from
                the Connect page back to the plugin.
              </dd>
            </div>
            <div>
              <dt className="text-[16px] font-semibold text-neutral-950">
                What format do plugins import?
              </dt>
              <dd className="mt-2 text-[16px] leading-7 text-neutral-700">
                GLB. Apps that already support glTF/GLB import into the scene; others save the
                file so you can convert with your usual tools.
              </dd>
            </div>
            <div>
              <dt className="text-[16px] font-semibold text-neutral-950">
                How many integrations are available?
              </dt>
              <dd className="mt-2 text-[16px] leading-7 text-neutral-700">
                {AVAILABLE_COUNT} connectors ship today. Omniverse and other roadmap items are
                marked Coming soon on this page.
              </dd>
            </div>
          </dl>
        </section>
      </MarketingPage>
    </>
  );
}
