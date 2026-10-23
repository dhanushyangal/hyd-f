import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleResearchPage,
  PickleResearchCard,
  type PickleRelatedItem,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";
import { INTEGRATIONS } from "@/lib/integrations";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Integrations — Blender, Unity, Unreal, MCP",
  description:
    "Install the Hydrilla Blender add-on, plus Unity, Unreal, Godot, MCP, and REST API connectors. Generate in-app or send meshes from Studio through the local Bridge.",
  path: "/integrations",
  keywords: [
    "Hydrilla Blender plugin",
    "Unity 3D integration",
    "Unreal Engine AI 3D",
    "MCP 3D generation",
  ],
});

const AVAILABLE_COUNT = INTEGRATIONS.filter(
  (item) => item.status === "available"
).length;

const THUMB_BY_SLUG: Record<string, PickleThumbVariant> = {
  blender: "pipeline-arch",
  unity: "unity-engine",
  unreal: "unreal-engine",
  godot: "godot-engine",
  mcp: "privacy-enclave",
  api: "api-stream",
};

export default function IntegrationsPage() {
  const cards: PickleRelatedItem[] = INTEGRATIONS.map((item) => ({
    title: item.name,
    subtitle: item.summary,
    href: `/integrations/${item.slug}`,
    date: item.status === "available" ? "Available" : "Coming soon",
    author: item.category === "engines" ? "Game Engine Plugin" : item.category === "modeling" ? "DCC Add-on" : "Developer Connector",
    imageSrc: item.guideSteps?.[0]?.imageSrc || null,
    thumbVariant: THUMB_BY_SLUG[item.slug] || "pipeline-arch",
  }));

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Integrations",
          description:
            "Connect Hydrilla to Blender, Unity, Unreal, Godot, MCP agents, and the REST API.",
          path: "/integrations",
        })}
      />
      <PickleResearchPage
        title="Integrations"
        description="Native Blender add-on, game-engine plugins, a local Bridge for Studio-to-DCC send, plus MCP and REST for custom pipelines."
        items={cards}
      >
        <div className="pickle-article-column" style={{ marginTop: "96px" }}>
          <section className="pickle-head-block">
            <h2 className="pickle-h2">How the local Bridge works</h2>
            <div className="pickle-text">
              <ol>
                <li>
                  <strong>Install a plugin</strong> for Blender or your game engine,
                  then start the built-in Bridge so Studio can reach it on{" "}
                  <code>127.0.0.1:7345</code>.
                </li>
                <li>
                  <strong>Sign in</strong> with the same Hydrilla account you use in
                  Studio, click Sync inside the plugin, and leave the Connect tab open
                  while you generate — or paste a <code>hyd_live_</code> API key instead.
                </li>
                <li>
                  <strong>Generate or send</strong> from the plugin panel, or click
                  Send to DCC in Studio to drop a mesh straight into your open scene.
                </li>
              </ol>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/integrations/connect" className="pickle-pill-solid">
                Sign in for plugins
              </Link>
              <Link
                href="/app/api-keys"
                className="pickle-glass-pill"
                style={{ height: "48px", fontSize: "17px", padding: "0 22px" }}
              >
                Create API key
              </Link>
            </div>
          </section>

          <section className="pickle-head-block">
            <h2 className="pickle-h2">Frequently asked questions</h2>
            <div className="pickle-text">
              <p>
                <strong>Do I need a separate login for plugins?</strong>
                <br />
                No. Use Sign in for plugins with your Studio account, then Sync in the
                add-on. Keep that Connect browser tab open while you generate so your
                session stays fresh. An API key works as an alternative if you prefer
                keys over browser sign-in.
              </p>
              <p>
                <strong>What is the Bridge?</strong>
                <br />
                A small local server started from inside the plugin. It lets Studio send
                a mesh straight into your open DCC or engine, and it carries the
                signed-in session from the Connect page back to the plugin.
              </p>
              <p>
                <strong>What format do plugins import?</strong>
                <br />
                GLB. Apps that already support glTF/GLB import directly into the scene;
                others save the file so you can convert with your usual tools.
              </p>
              <p>
                <strong>How many integrations ship today?</strong>
                <br />
                {AVAILABLE_COUNT} connectors ship today — Blender for modeling, Unity,
                Unreal Engine, and Godot 4 for game engines, plus MCP and the REST API.
              </p>
            </div>
          </section>
        </div>
      </PickleResearchPage>
    </>
  );
}
