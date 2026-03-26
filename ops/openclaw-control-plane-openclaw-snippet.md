# OpenClaw Control-Plane Wiring Snippet

Apply this shape to the Raspberry Pi `openclaw.json` after the control plane is built and deployed.

## 1. Add MCP servers

Use one stdio MCP process per role so each agent only sees the intended tool set.

```json
{
  "mcpServers": {
    "control-plane-supervisor": {
      "command": "/usr/bin/node",
      "args": ["/home/luo/apps/claw/services/control-plane/dist/src/cli-mcp.js"],
      "env": {
        "CONTROL_PLANE_TOKEN": "${CONTROL_PLANE_TOKEN}",
        "CONTROL_PLANE_BASE_URL": "http://127.0.0.1:18890",
        "CONTROL_PLANE_MCP_ROLE": "supervisor"
      }
    },
    "control-plane-researcher": {
      "command": "/usr/bin/node",
      "args": ["/home/luo/apps/claw/services/control-plane/dist/src/cli-mcp.js"],
      "env": {
        "CONTROL_PLANE_TOKEN": "${CONTROL_PLANE_TOKEN}",
        "CONTROL_PLANE_BASE_URL": "http://127.0.0.1:18890",
        "CONTROL_PLANE_MCP_ROLE": "researcher"
      }
    },
    "control-plane-builder": {
      "command": "/usr/bin/node",
      "args": ["/home/luo/apps/claw/services/control-plane/dist/src/cli-mcp.js"],
      "env": {
        "CONTROL_PLANE_TOKEN": "${CONTROL_PLANE_TOKEN}",
        "CONTROL_PLANE_BASE_URL": "http://127.0.0.1:18890",
        "CONTROL_PLANE_MCP_ROLE": "builder"
      }
    }
  }
}
```

## 2. Attach tools to agents

`supervisor` should get request + approval tools.

`researcher` and `builder` should get requester tools only.

## 3. Explicitly deny direct peer delegation

Keep these tools disabled or removed from all three production agents:

- `sessions_send`
- `sessions_spawn`
- `sessions_yield`
- `subagents`

## 4. Keep current Feishu routing

- `main` remains the internal supervisor agent
- `researcher` remains the researcher specialist
- `builder` remains the builder specialist
- current group policy stays:
  - group enabled
  - `@mention` required
  - only the approved user may trigger group processing
