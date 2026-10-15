export type IntegrationCategory =
  | "modeling"
  | "engines"
  | "agents"
  | "api";

export type IntegrationStatus = "available" | "bridge" | "coming_soon";

export type IntegrationGuideStep = {
  title: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
};

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
  guideSteps?: IntegrationGuideStep[];
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
      "Install the Hydrilla Blender add-on, open the sidebar Hydrilla tab, sign in with your Studio account, and generate meshes in place — or receive one-click Send from Studio through the local Bridge.",
    downloadPath: "/plugins/hydrilla-blender.zip",
    bridgeTarget: "blender",
    installSteps: [
      "Download hydrilla-blender.zip.",
      "In Blender: Edit → Preferences → Add-ons → dropdown → Install from Disk… and select the zip.",
      "Enable the Hydrilla add-on, then press N (or the sidebar arrow) and open the Hydrilla tab.",
      "Start the Bridge, Sign in, Sync, and keep the Connect tab open while generating.",
    ],
    guideSteps: [
      {
        title: "Install from Disk",
        body: "Open Edit → Preferences → Add-ons. Open the dropdown in the top-right and choose Install from Disk…. Select hydrilla-blender.zip, then enable the Hydrilla add-on.",
        imageSrc: "/integrations/blender/01-install-from-disk.jpg",
        imageAlt: "Blender Preferences Add-ons menu with Install from Disk highlighted",
      },
      {
        title: "Open the sidebar",
        body: "Back in the 3D Viewport, click the small arrow on the right edge of the viewport (or press N) to open the sidebar.",
        imageSrc: "/integrations/blender/02-open-sidebar.jpg",
        imageAlt: "Blender 3D Viewport with arrow pointing to the sidebar toggle",
      },
      {
        title: "Open the Hydrilla tab",
        body: "In the sidebar tabs, click Hydrilla. Start the Bridge, Sign in with your Hydrilla account, Sync, then Generate. Keep the Connect browser tab open while you work.",
        imageSrc: "/integrations/blender/03-hydrilla-tab.jpg",
        imageAlt: "Blender sidebar showing the Hydrilla tab",
      },
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
];

export const INTEGRATION_CATEGORIES: Array<{
  id: IntegrationCategory;
  title: string;
  description: string;
}> = [
  {
    id: "modeling",
    title: "3D Modeling",
    description: "Generate and import meshes inside Blender.",
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
