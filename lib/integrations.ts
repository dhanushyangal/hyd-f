export type IntegrationCategory =
  | "modeling"
  | "engines"
  | "agents"
  | "api";

export type IntegrationStatus = "available" | "bridge" | "coming_soon";

export type Integration = {
  slug: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  summary: string;
  description: string;
  downloadPath?: string;
  docsAnchor?: string;
  bridgeTarget: string;
  installSteps: string[];
};

export const BRIDGE_DEFAULT_PORT = 7345;
export const BRIDGE_DEFAULT_URL = `http://127.0.0.1:${BRIDGE_DEFAULT_PORT}`;

export const INTEGRATIONS: Integration[] = [
  {
    slug: "blender",
    name: "Blender",
    category: "modeling",
    status: "available",
    summary: "Generate text/image to 3D and import GLB in Blender.",
    description:
      "The Hydrilla Blender add-on lets you sign in with your Studio account or an API key, generate meshes in the sidebar, and receive one-click Send from Studio through the local Bridge.",
    downloadPath: "/plugins/hydrilla-blender.zip",
    bridgeTarget: "blender",
    installSteps: [
      "Download hydrilla-blender.zip and install it in Blender (Edit → Preferences → Add-ons → Install…).",
      "Open the Hydrilla sidebar and start the Bridge.",
      "Click Sign in, finish login in the browser, then Sync. Keep the Connect tab open while generating.",
      "Or set a hyd_live_ API key in Add-on Preferences if you prefer keys.",
    ],
  },
  {
    slug: "maya",
    name: "Maya",
    category: "modeling",
    status: "available",
    summary: "Generate and pull Hydrilla meshes into Maya scenes.",
    description:
      "The Hydrilla Maya shelf plugin generates via the developer API and receives Studio sends over the local Bridge. Jobs download as GLB and import with the bundled glTF helper when available.",
    downloadPath: "/plugins/hydrilla-maya.zip",
    bridgeTarget: "maya",
    installSteps: [
      "Download hydrilla-maya.zip and unzip into your Maya scripts path.",
      "Run hydrilla_maya.show(), start the Bridge, then Sign in.",
      "Sync pulls your Hydrilla session (or paste an API key).",
    ],
  },
  {
    slug: "3ds-max",
    name: "3ds Max",
    category: "modeling",
    status: "available",
    summary: "Import Hydrilla GLB into 3ds Max without manual downloads.",
    description:
      "Python panel for 3ds Max with API key auth, text/image generation, and Bridge import into the active scene.",
    downloadPath: "/plugins/hydrilla-3dsmax.zip",
    bridgeTarget: "3dsmax",
    installSteps: [
      "Download hydrilla-3dsmax.zip and place scripts on your Max Python path.",
      "Run hydrilla_max.py from the MaxScript/Python listener.",
      "Set your API key, generate, or enable Bridge listening.",
    ],
  },
  {
    slug: "unity",
    name: "Unity",
    category: "engines",
    status: "available",
    summary: "Import game-ready GLB into the Unity Editor.",
    description:
      "Editor window that authenticates with a Hydrilla API key, creates generation tasks, downloads GLB into Assets/Hydrilla, and accepts Studio Send via the local Bridge.",
    downloadPath: "/plugins/hydrilla-unity.zip",
    bridgeTarget: "unity",
    installSteps: [
      "Download hydrilla-unity.zip and copy the Hydrilla folder into Assets/.",
      "Open Window → Hydrilla → Generate 3D.",
      "Paste your hyd_live_ API key and generate, or start the Bridge for Studio send.",
    ],
  },
  {
    slug: "unreal",
    name: "Unreal Engine",
    category: "engines",
    status: "available",
    summary: "Import Hydrilla meshes into Unreal Editor.",
    description:
      "Unreal Editor Python plugin for Hydrilla generation and Bridge import. Downloads GLB into Content/Hydrilla for your glTF importer.",
    downloadPath: "/plugins/hydrilla-unreal.zip",
    bridgeTarget: "unreal",
    installSteps: [
      "Enable the Python Editor Script Plugin in Unreal.",
      "Copy the Hydrilla folder into your project’s Content/Python or Plugins path.",
      "Run the Hydrilla toolbar actions and set your API key.",
    ],
  },
  {
    slug: "godot",
    name: "Godot",
    category: "engines",
    status: "available",
    summary: "Bring Hydrilla GLB into Godot 4 projects.",
    description:
      "Godot 4 editor plugin with API generation and Bridge receive. Imported meshes land under res://hydrilla/.",
    downloadPath: "/plugins/hydrilla-godot.zip",
    bridgeTarget: "godot",
    installSteps: [
      "Copy addons/hydrilla into your Godot project.",
      "Enable the Hydrilla plugin in Project Settings → Plugins.",
      "Open the Hydrilla dock, add your API key, and generate or listen on the Bridge.",
    ],
  },
  {
    slug: "mcp",
    name: "MCP Server",
    category: "agents",
    status: "available",
    summary: "Let AI agents generate 3D through Hydrilla over MCP.",
    description:
      "Local stdio MCP server wrapping the Hydrilla developer REST API. Works with Cursor, Claude Code, and other MCP clients that support stdio servers.",
    downloadPath: "/plugins/hydrilla-mcp.zip",
    bridgeTarget: "mcp",
    installSteps: [
      "Download the MCP package from /plugins/hydrilla-mcp.zip.",
      "Set HYDRILLA_API_KEY=hyd_live_… in the MCP server env.",
      "Register the server in your client (see the integration guide).",
    ],
  },
  {
    slug: "api",
    name: "REST API",
    category: "api",
    status: "available",
    summary: "Build custom pipelines with the Hydrilla API.",
    description:
      "Task-based REST API for text-to-3D and image-to-3D. Authenticate with hyd_live_ keys, poll tasks, and download GLB — the same contract the DCC plugins use.",
    docsAnchor: "/api",
    bridgeTarget: "api",
    installSteps: [
      "Create a key at /app/api-keys.",
      "POST /v1/3d/text-to-3d or /v1/3d/image-to-3d with Bearer auth.",
      "Poll GET /v1/3d/tasks/:id until SUCCEEDED, then download result.mesh_url.",
    ],
  },
  {
    slug: "omniverse",
    name: "Omniverse",
    category: "modeling",
    status: "coming_soon",
    summary: "OpenUSD handoff to Omniverse — on the roadmap.",
    description:
      "Planned OpenUSD / Omniverse connector for sim-ready stages. Until then, export GLB from Studio or the REST API and convert in your Omniverse pipeline.",
    bridgeTarget: "omniverse",
    installSteps: [
      "Use Studio Export GLB or the REST API today.",
      "Convert to USD in your Omniverse toolchain.",
      "Watch this page for the native Omniverse connector.",
    ],
  },
];

export const INTEGRATION_CATEGORIES: Array<{
  id: IntegrationCategory;
  title: string;
  description: string;
}> = [
  {
    id: "modeling",
    title: "3D Modeling",
    description: "Generate and import meshes inside your DCC.",
  },
  {
    id: "engines",
    title: "Game Engines",
    description: "Drop production meshes into real-time engines.",
  },
  {
    id: "agents",
    title: "AI Agents",
    description: "Drive Hydrilla from MCP-compatible agents.",
  },
  {
    id: "api",
    title: "Build your own",
    description: "REST API for custom studio and pipeline tooling.",
  },
];
export function getIntegration(slug: string): Integration | undefined {
  return INTEGRATIONS.find((item) => item.slug === slug);
}

export function integrationsByCategory(
  category: IntegrationCategory
): Integration[] {
  return INTEGRATIONS.filter((item) => item.category === category);
}
