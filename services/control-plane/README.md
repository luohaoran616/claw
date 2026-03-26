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
