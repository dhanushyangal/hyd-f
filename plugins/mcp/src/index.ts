#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = (process.env.HYDRILLA_API_KEY || process.env.HYDRILLA_API_TOKEN || "").trim();
const API_BASE = (process.env.HYDRILLA_API_BASE || "https://api.hydrilla.ai").replace(/\/$/, "");

async function api<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  if (!API_KEY) {
    throw new Error("Set HYDRILLA_API_KEY to a hyd_live_ key from /app/api-keys");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${API_KEY}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message =
      data?.error?.message || data?.message || `Hydrilla API ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function waitForTask(taskId: string) {
  for (;;) {
    const task = await api<{
      status: string;
      progress?: number;
      error?: string | null;
      result?: { mesh_url?: string; format?: string } | null;
    }>(`/v1/3d/tasks/${encodeURIComponent(taskId)}`);
    if (task.status === "SUCCEEDED" || task.status === "FAILED" || task.status === "CANCELLED") {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

const server = new McpServer({
  name: "hydrilla",
  version: "1.0.0",
});

server.tool(
  "hydrilla_me",
  "Return the authenticated Hydrilla developer profile and credit balance",
  {},
  async () => {
    const me = await api<Record<string, unknown>>("/v1/user/me");
    return {
      content: [{ type: "text", text: JSON.stringify(me, null, 2) }],
    };
  }
);

server.tool(
  "hydrilla_text_to_3d",
  "Generate a 3D GLB from a text prompt via Hydrilla",
  {
    prompt: z.string().min(1).describe("Text prompt for 3D generation"),
    wait: z.boolean().optional().describe("Wait until the task finishes (default true)"),
  },
  async ({ prompt, wait = true }) => {
    const created = await api<{ id: string }>("/v1/3d/text-to-3d", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
    if (!wait) {
      return {
        content: [{ type: "text", text: JSON.stringify(created, null, 2) }],
      };
    }
    const task = await waitForTask(created.id);
    return {
      content: [{ type: "text", text: JSON.stringify({ id: created.id, ...task }, null, 2) }],
    };
  }
);

server.tool(
  "hydrilla_image_to_3d",
  "Generate a 3D GLB from an image URL via Hydrilla",
  {
    image_url: z.string().url().describe("Public image URL"),
    wait: z.boolean().optional().describe("Wait until the task finishes (default true)"),
  },
  async ({ image_url, wait = true }) => {
    const created = await api<{ id: string }>("/v1/3d/image-to-3d", {
      method: "POST",
      body: JSON.stringify({ image_url }),
    });
    if (!wait) {
      return {
        content: [{ type: "text", text: JSON.stringify(created, null, 2) }],
      };
    }
    const task = await waitForTask(created.id);
    return {
      content: [{ type: "text", text: JSON.stringify({ id: created.id, ...task }, null, 2) }],
    };
  }
);

server.tool(
  "hydrilla_get_task",
  "Poll a Hydrilla 3D task by id",
  {
    task_id: z.string().min(1),
  },
  async ({ task_id }) => {
    const task = await api<Record<string, unknown>>(
      `/v1/3d/tasks/${encodeURIComponent(task_id)}`
    );
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
