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

`supervisor` should get delegation + approval tools.

`researcher` and `builder` should get requester tools only.

Recommended per-agent allow additions:

- `main` / supervisor:
  - `supervisor_request_handoff`
  - `supervisor_get_handoff_status`
  - `supervisor_list_pending_approvals`
  - `supervisor_approve_handoff`
  - `supervisor_reject_handoff`
  - `supervisor_cancel_handoff`
- `researcher`:
  - `researcher_request_handoff`
  - `researcher_get_handoff_status`
- `builder`:
  - `builder_request_handoff`
  - `builder_get_handoff_status`

Recommended supervisor-first core tool shape:

- `main` / supervisor:
  - stronger default model than specialists
  - `tools.profile: "minimal"`
  - allow:
    - `message`
    - `session_status`
    - `sessions_list`
    - `sessions_history`
    - `agents_list`
    - `read`
    - `memory_search`
    - `memory_get`
    - `memory_expand`
    - `group:web`
    - all `supervisor_*` control-plane tools above
  - deny:
    - `sessions_send`
    - `sessions_spawn`
    - `sessions_yield`
    - `subagents`
    - `exec`
    - `process`
    - `write`
    - `edit`
    - `apply_patch`
    - `gateway`
    - `cron`
    - `browser`
    - `canvas`
- `researcher`:
  - cheap specialist model
  - `tools.profile: "minimal"`
  - allow:
    - `message`
    - `session_status`
    - `sessions_list`
    - `sessions_history`
    - `read`
    - `memory_search`
    - `memory_get`
    - `memory_expand`
    - `group:web`
    - `researcher_*` control-plane tools above
  - deny the same direct peer-delegation and mutation tools as supervisor
- `builder`:
  - cheap specialist model
  - `tools.profile: "coding"`
  - keep code/runtime tools
  - explicitly deny:
    - `sessions_send`
    - `sessions_spawn`
    - `sessions_yield`
    - `subagents`
    - `browser`
    - `canvas`
    - `cron`

Important note:

- OpenClaw does not currently expose a dedicated dry-run-only runtime tool for supervisor.
- If supervisor needs host-level verification beyond read/search/inspection, prefer a bounded builder handoff instead of widening supervisor into direct shell or config mutation.
- If the user has already asked the supervisor to execute specialist work, prefer `supervisor_request_handoff` directly instead of asking an extra yes/no question first.
- `supervisor_request_handoff` should create a visible `pending_approval` pause, not silently auto-approve.

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

## 5. Pair with prompt guidance

Use `ops/supervisor-first-orchestration-prompt.md` as the supervisor prompt pack snippet so the stronger supervisor directly uses `supervisor_request_handoff` when specialist work is needed, without adding an extra verbal confirmation round.
