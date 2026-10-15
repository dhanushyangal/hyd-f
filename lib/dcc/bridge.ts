import { BRIDGE_DEFAULT_URL } from "@/lib/integrations";

export type SendToDccPayload = {
  meshUrl: string;
  name?: string;
  target?: string;
  jobId?: string;
};

export type BridgeHealth = {
  ok: boolean;
  service?: string;
  pending?: number;
  clients?: Array<{ app: string; name?: string }>;
};

export async function checkBridgeHealth(
  bridgeUrl: string = BRIDGE_DEFAULT_URL
): Promise<BridgeHealth> {
  const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/health`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Bridge returned ${response.status}`);
  }
  return (await response.json()) as BridgeHealth;
}

export async function sendMeshToBridge(
  payload: SendToDccPayload,
  bridgeUrl: string = BRIDGE_DEFAULT_URL
): Promise<void> {
  const response = await fetch(`${bridgeUrl.replace(/\/$/, "")}/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      mesh_url: payload.meshUrl,
      name: payload.name,
      target: payload.target || "any",
      job_id: payload.jobId,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Bridge import failed (${response.status})`);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  const parts: string[] = [];
  for (let index = 0; index < bytes.length; index += chunk) {
    const slice = bytes.subarray(index, index + chunk);
    parts.push(String.fromCharCode(...slice));
  }
  return btoa(parts.join(""));
}

/** Fetch GLB (with optional Clerk token for proxy URLs) and push bytes to the local Bridge. */
export async function sendGlbBytesToBridge(options: {
  meshUrl: string;
  name?: string;
  target?: string;
  jobId?: string;
  getToken?: () => Promise<string | null>;
  bridgeUrl?: string;
}): Promise<void> {
  const bridgeUrl = (options.bridgeUrl || BRIDGE_DEFAULT_URL).replace(/\/$/, "");
  const token = options.getToken ? await options.getToken() : null;
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(options.meshUrl, {
    headers,
    credentials: token ? "include" : "omit",
  });
  if (!response.ok) {
    throw new Error(`Could not download mesh for Bridge (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const fileBase64 = arrayBufferToBase64(buffer);
  const importResponse = await fetch(`${bridgeUrl}/import-file`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      file_base64: fileBase64,
      name: options.name,
      target: options.target || "any",
      job_id: options.jobId,
    }),
  });
  if (!importResponse.ok) {
    const text = await importResponse.text();
    throw new Error(text || `Bridge import-file failed (${importResponse.status})`);
  }
}
