# Final Multi-Agent Production Plan

## Decision

Adopt `C-thin` now as the production target.

`C-thin` means:

- multiple Feishu app bots from day 1
- one shared supervisor/control-plane service from day 1
- no bot-to-bot triggering through Feishu group chat
- all cross-agent handoff goes through a backend approval gate
- one OpenClaw gateway by default, hosting multiple agents and multiple Feishu accounts
- split into multiple gateways only for strict isolation, redundancy, or rescue-bot needs

This keeps the final architecture shape from the start, while trimming only scale and role count.

## Why This Shape

Compared with `A`, this avoids a later re-platform from "one bot with many internal roles" into "many real bots with governance".

Compared with full `C`, this removes only non-essential weight:

- fewer initial specialist bots
- single production host at first
- simple approval transport
- simple artifact storage

The control boundaries stay correct from the beginning.

## Target Architecture

### 1. Ingress Layer

- `feishu-supervisor`
  - primary user entry
  - owns task intake, approvals, summaries, and escalation visibility
- `feishu-researcher`
  - retrieval, reading, evidence collection
- `feishu-writer`
  - drafting, editing, packaging
- `feishu-builder`
  - code, scripts, automation, environment repair
- optional later:
  - `feishu-reviewer`
  - `feishu-ops`
  - `feishu-hardware`

Rule:

- users may talk to any specialist directly
- specialists must not directly trigger each other through Feishu message events
- all inter-agent collaboration goes through the control plane

### 2. Runtime Layer

Preferred production baseline: one OpenClaw gateway with:

- multiple `agents.list[]`
- multiple `channels.feishu.accounts.*`
- deterministic `bindings`
- per-agent workspace, `agentDir`, session store, tool policy, and sandbox policy

This follows current OpenClaw guidance most closely:

- one gateway is the default recommendation
- one gateway can host multiple messaging connections and agents
- Feishu supports multiple accounts plus binding-based routing

Use multiple gateways only when at least one of these is true:

- you need a rescue bot that stays alive when the main runtime is broken
- you need hard process/state separation between operator domains
- you need different restart cadence or failure domains
- you want a cold-standby or canary gateway for upgrades

Single-gateway baseline service:

- `openclaw-gateway.service`

Optional later split:

- `openclaw-gateway.service`
- `openclaw-gateway-rescue.service`
- `openclaw-gateway-canary.service`

### 3. Control Plane

Build one small coordination service that owns:

- approval queue
- task registry
- agent registry
- dispatch policy
- audit log
- budget and timeout enforcement
- execution callbacks

This service is the hard boundary between "an agent wants help" and "another agent is allowed to act".

### 4. Shared Services

Initial production choices:

- database: Postgres
- queue: Postgres-backed job table first, Redis optional later
- artifact store: local filesystem or object storage with stable paths
- memory retrieval: QMD remains shared infrastructure, but each agent has scoped access policy
- logs: structured JSON logs per service

## Approval State Machine

Use one state machine for all cross-agent collaboration and high-risk actions.

`draft -> pending_approval -> approved | rejected | expired -> dispatched -> running -> completed | failed | cancelled`

Approval should be mandatory for:

- cross-agent delegation
- external side effects
- write actions outside the caller's own bounded area
- privileged tools
- budget or runtime over-threshold actions

Approval payload should include:

- requester agent
- target agent
- task summary
- reason for delegation
- expected tools
- expected write scope
- expected cost and timeout
- rollback hint

## Production Rules

### 1. No Direct Peer Delegation

Disable or wrap direct `sessions_spawn` / `sessions_send` for production specialists.

Production path should be:

`agent -> request_handoff tool -> control plane -> human approval -> target agent dispatch`

This is the single most important rule for keeping the system governable.

### 2. Per-Agent Least Privilege

Each agent gets only the minimum tools it needs.

Suggested starting shape:

- `supervisor`
  - messaging
  - approval tools
  - read-only search and summarization tools
  - no direct filesystem write outside coordination artifacts
- `researcher`
  - web/search/read tools
  - citation packaging
  - no deployment tools
- `writer`
  - document generation and editing tools
  - no shell/admin tools
- `builder`
  - repo, shell, test, deployment-prep tools
  - bounded write scope

### 3. Separate Identity From Capability

Feishu bot identity, OpenClaw agent role, and tool privilege should be separate configuration layers.

That lets us:

- change a bot's persona without changing privilege
- rotate credentials without changing runtime policy
- add new specialists without touching the approval core

### 4. Linux First For Production

Use Linux as the production home for:

- control plane
- OpenClaw gateways
- approval store
- audit logs

Windows should stay the development and emergency recovery environment, not the primary 24x7 ingress.

### 5. Upstream Alignment Strategy

To stay close to official OpenClaw updates:

- prefer stock OpenClaw multi-agent and multi-account config primitives
- keep approval orchestration in an external control-plane service
- add only thin integration points on the OpenClaw side
- avoid patching core routing logic unless upstream primitives are truly insufficient

Priority order:

1. config
2. plugin/tool wrapper
3. sidecar service
4. core fork patch

If we can express a behavior with `agents.list`, `channels.feishu.accounts`, `bindings`, per-agent tools, and sandbox settings, do that instead of modifying OpenClaw internals.

## Fastest Path To Production

Do not build every specialist first.

Ship this smallest real production slice:

### Slice 1

- `feishu-supervisor`
- `feishu-researcher`
- `feishu-builder`
- one control-plane service
- one OpenClaw gateway
- Postgres-backed approval queue
- audit logging
- manual approval through supervisor DM or control UI

This slice already supports:

- research -> builder handoff
- builder -> researcher evidence request
- user-visible approvals
- auditable multi-agent work

### Slice 2

Add:

- `feishu-writer`
- role-specific prompt packs
- per-agent budgets and timeouts
- artifact links and delivery formatting

### Slice 3

Add:

- `feishu-reviewer`
- multi-step approval policies
- multi-tenant separation
- object storage
- Redis or dedicated worker queue if throughput demands it

## Suggested Build Order

1. Stand up the control plane first.
2. Register `supervisor`, `researcher`, and `builder` as separate production services.
3. Replace direct inter-agent delegation with approval-gated handoff requests.
4. Expose approval actions in Feishu and Control UI.
5. Add audit, replay, timeout, and cancellation handling before adding more roles.
6. Only then expand specialist count.

## Data Model Minimum

Create durable tables or their equivalent for:

- `agents`
- `handoff_requests`
- `approvals`
- `task_runs`
- `artifacts`
- `audit_events`

Minimum audit event types:

- request_created
- request_approved
- request_rejected
- dispatch_started
- dispatch_finished
- dispatch_failed
- task_cancelled

## Operational Guardrails

- max delegation depth: `1` initially
- max parallel child tasks per request: `2` initially
- per-agent timeout caps
- per-agent token or cost budgets
- strict write-scope declaration for builder-like agents
- explicit rollback note for any deploy or config mutation action

## Recommended Immediate Next Deliverables

1. Define the control-plane API:
   - `create_handoff_request`
   - `approve_handoff_request`
   - `reject_handoff_request`
   - `dispatch_handoff_request`
   - `report_task_result`
2. Define the first three production agents:
   - supervisor
   - researcher
   - builder
3. Define one approval UX:
   - approve/reject in supervisor DM
4. Define one deployment topology:
   - one Linux production host
   - one OpenClaw systemd unit
   - one Postgres instance
   - optional rescue/canary gateway later

## What Not To Do

- do not assume independent bot identities automatically require multiple gateways
- do not let bots coordinate by Feishu group-message chaining
- do not give `supervisor` builder-grade write privileges
- do not couple approval state only to chat transcripts
- do not start with too many specialists

## Practical Decision

The fastest way to your final architecture is not "build A and rewrite later".

It is:

- build the `C` boundaries now
- launch a smaller number of real specialist bots on top of one gateway first
- centralize approval and audit from day 1
- scale role count later without changing the core shape
