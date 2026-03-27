# Control Plane

This package implements the V1 approval-gated control plane for the multi-agent Feishu + OpenClaw deployment.

## What it includes

- Fastify HTTP API bound to local-only network interfaces
- Postgres-backed state for handoffs, approvals, task runs, artifacts, and audit events
- Polling dispatch worker that runs local OpenClaw agents through CLI
- MCP stdio bridge for `supervisor`, `researcher`, and `builder`
- Vitest coverage using `pg-mem`

## Commands

- `pnpm --filter @claw/control-plane build`
- `pnpm --filter @claw/control-plane test`
- `pnpm --filter @claw/control-plane migrate`
- `pnpm --filter @claw/control-plane start:http`
- `pnpm --filter @claw/control-plane start:mcp`
- `pnpm --filter @claw/control-plane smoke:postgres`

## Required environment

- `CONTROL_PLANE_TOKEN`
- `CONTROL_PLANE_DATABASE_URL`

## Optional environment

- `CONTROL_PLANE_HOST` default `127.0.0.1`
- `CONTROL_PLANE_PORT` default `18890`
- `CONTROL_PLANE_ARTIFACT_ROOT` default `/home/luo/.local/share/openclaw-control-plane/artifacts`
- `CONTROL_PLANE_OPENCLAW_NODE` default `node`
- `CONTROL_PLANE_OPENCLAW_SCRIPT` default `/home/luo/apps/openclaw/openclaw.mjs`
- `CONTROL_PLANE_MAX_CONCURRENT_RUNS` default `2`
- `CONTROL_PLANE_POLL_INTERVAL_MS` default `2000`
- `CONTROL_PLANE_APPROVAL_WINDOW_SEC` default `1800`
- `CONTROL_PLANE_DISPATCH_GRACE_SEC` default `30`
- `CONTROL_PLANE_BASE_URL` default `http://127.0.0.1:18890`
- `CONTROL_PLANE_MCP_ROLE` one of `supervisor`, `researcher`, `builder`

## Deployment notes

- Use `ops/control-plane.env.example` as the env template for Raspberry Pi.
- Use `ops/openclaw-control-plane.service` as the user-level systemd unit.
- Use `ops/openclaw-control-plane-openclaw-snippet.md` to wire the MCP bridge into OpenClaw.
- Use `ops/supervisor-first-orchestration-prompt.md` to seed the supervisor prompt pack so it prefers bounded verification and directly creates approval-gated handoffs when specialist execution is needed, without adding a redundant verbal confirmation round.
- MCP tools are role-prefixed to avoid global tool-name collisions inside one OpenClaw gateway:
  - `supervisor_request_handoff`
  - `supervisor_get_handoff_status`
  - `supervisor_list_pending_approvals`
  - `supervisor_approve_handoff`
  - `supervisor_reject_handoff`
  - `supervisor_cancel_handoff`
  - `researcher_request_handoff`
  - `researcher_get_handoff_status`
  - `builder_request_handoff`
  - `builder_get_handoff_status`

## Supervisor-first usage note

- `supervisor` should be the strongest planner and verifier, but not a builder-grade mutator.
- Prefer a stronger default model for `supervisor` and cheaper specialist defaults for `researcher` and `builder`.
- If the user has already asked for execution and specialist work is needed, prefer `supervisor_request_handoff` directly instead of first asking another yes/no permission question.
- Use `supervisor_request_handoff` for file changes, real tests, environment mutation, long-running execution, or specialist research when the work should pause at `pending_approval`.

## Approval entrypoints

- A handoff created through `supervisor_request_handoff` stays in `pending_approval` until it is approved.
- Today, pending approvals can be cleared from the same supervisor chat via `supervisor_list_pending_approvals` + `supervisor_approve_handoff`, or through the raw HTTP API (`POST /api/handoffs/:id/approve`).
- The control plane does not currently push a separate Feishu approval reminder on its own, so if you do not see a reminder card, check the supervisor chat or query the API directly.

## Feishu streaming note

- OpenClaw's Feishu channel supports streaming replies through interactive cards when `channels.feishu.streaming: true` and `channels.feishu.blockStreaming: true`.
- The current control plane does not yet emit pending-approval reminders back into Feishu cards; that would require an explicit notifier path from handoff creation to Feishu outbound messaging.
