# Hydrilla MCP Server

Stdio MCP server for Hydrilla developer API.

```bash
cd plugins/mcp
npm install
npm run build
HYDRILLA_API_KEY=hyd_live_… node dist/index.js
```

## Cursor / Claude Code example

```json
{
  "mcpServers": {
    "hydrilla": {
      "command": "node",
      "args": ["/absolute/path/to/plugins/mcp/dist/index.js"],
      "env": {
        "HYDRILLA_API_KEY": "hyd_live_…"
      }
    }
  }
}
```

Tools: `hydrilla_me`, `hydrilla_text_to_3d`, `hydrilla_image_to_3d`, `hydrilla_get_task`.
