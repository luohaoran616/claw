# Control-Plane API Draft

## Purpose

This API is the mandatory coordination boundary for production multi-agent collaboration.

No production specialist should directly hand work to another specialist without going through this API.

This API is intentionally gateway-topology-agnostic:

- it must work when many agents live inside one OpenClaw gateway
- it must also keep working if some roles are later split into separate gateways

## Core Objects

### `handoff_request`

```json
{
  "id": "hr_01",
  "requester_agent": "supervisor",
  "target_agent": "builder",
  "status": "pending_approval",
  "priority": "normal",
  "summary": "Patch the deployment health-check script",
  "reason": "User requested an implementation change",
  "expected_tools": ["shell", "git", "test"],
  "write_scope": [
    "D:/lhr/app/openclaw/scripts/**",
    "D:/lhr/app/openclaw/src/**"
  ],
  "budget": {
    "max_runtime_sec": 900,
    "max_cost_usd": 1.5
  },
  "artifacts": [],
  "rollback_hint": "revert last commit or restore known-good file copy",
  "source_channel": {
    "platform": "feishu",
    "chat_id": "oc_xxx",
    "thread_id": "omt_xxx"
  },
  "created_at": "2026-03-27T12:00:00Z"
}
```

### `approval`

```json
{
  "id": "ap_01",
  "handoff_request_id": "hr_01",
  "decision": "approved",
  "approver_id": "user_primary",
  "comment": "Proceed, but do not touch deployment credentials",
  "expires_at": "2026-03-27T12:30:00Z",
  "created_at": "2026-03-27T12:05:00Z"
}
```

### `task_run`

```json
{
  "id": "tr_01",
  "handoff_request_id": "hr_01",
  "agent": "builder",
  "status": "running",
  "started_at": "2026-03-27T12:06:00Z",
  "finished_at": null,
  "result_summary": null,
  "artifact_ids": []
}
```

## Endpoints

### 1. Create Handoff Request

`POST /api/handoffs`

Used by an agent-facing tool such as `request_handoff`.

Request body:

```json
{
  "requester_agent": "supervisor",
  "target_agent": "researcher",
  "summary": "Collect official docs about Feishu group mention behavior",
  "reason": "Need evidence before architecture decision",
  "expected_tools": ["web_search", "docs_read"],
  "write_scope": [],
  "budget": {
    "max_runtime_sec": 600,
    "max_cost_usd": 0.5
  },
  "rollback_hint": "none"
}
```

Response:

```json
{
  "id": "hr_02",
  "status": "pending_approval"
}
```

### 2. List Pending Approvals

`GET /api/handoffs?status=pending_approval`

Used by:

- supervisor bot
- control UI
- audit operators

Current practical approval entrypoints:

- same supervisor chat through supervisor approval tools
- control UI if one is deployed
- raw API clients for operator/debug flows

### 3. Approve Handoff

`POST /api/handoffs/{id}/approve`

Request body:

```json
{
  "approver_id": "user_primary",
  "comment": "Approved. Limit changes to the control-plane service only."
}
```

Response:

```json
{
  "id": "hr_02",
  "status": "approved"
}
```

### 4. Reject Handoff

`POST /api/handoffs/{id}/reject`

Request body:

```json
{
  "approver_id": "user_primary",
  "comment": "Rejected. Break the task into a read-only investigation first."
}
```

### 5. Dispatch Handoff

`POST /api/handoffs/{id}/dispatch`

Usually called by the control-plane worker after approval.

Response:

```json
{
  "task_run_id": "tr_02",
  "status": "running"
}
```

### 6. Report Task Result

`POST /api/task-runs/{id}/report`

Request body:

```json
{
  "status": "completed",
  "result_summary": "Collected 3 official references and a short recommendation.",
  "artifacts": [
    {
      "type": "markdown",
      "path": "/var/lib/openclaw/artifacts/hr_02-summary.md"
    }
  ]
}
```

### 7. Cancel Task Run

`POST /api/task-runs/{id}/cancel`

Used when:

- user cancels
- approval expires before dispatch completes
- supervisor detects downstream risk

## Required Policy Checks

Before `POST /api/handoffs` succeeds:

- requester agent is active
- target agent is allowed by policy
- requested tools are compatible with target policy
- write scope is declared
- budget is within limit

Before approval is accepted:

- request is still `pending_approval`
- request has not expired
- approver is authorized

Before dispatch:

- request is `approved`
- target agent is healthy
- concurrency cap is not exceeded

## Agent-Facing Tool Surface

Production agents should not see raw control-plane HTTP details.

Wrap them as tools:

- `request_handoff`
- `get_handoff_status`
- `report_handoff_result`

Supervisor-only tools:

- `list_pending_approvals`
- `approve_handoff`
- `reject_handoff`
- `cancel_handoff`

Recommended usage:

- `request_handoff` for specialist delegation
- if the user already asked for execution, create the pending-approval handoff directly instead of asking an extra verbal confirmation question first

## Event Types

Emit structured events for every transition:

- `handoff.requested`
- `handoff.approved`
- `handoff.rejected`
- `handoff.expired`
- `handoff.dispatched`
- `handoff.completed`
- `handoff.failed`
- `handoff.cancelled`

## V1 Constraints

- one approver is enough
- max delegation depth = 1
- synchronous approval is not required
- dispatch worker may poll Postgres instead of using Redis
- artifact storage may start on local disk with stable absolute paths
- assume one OpenClaw gateway hosts `supervisor`, `researcher`, and `builder` in v1

## Open Questions For Implementation

- whether approvals should be issued only in supervisor DM or also in Control UI
- whether target-agent selection is free-form or limited to policy templates
- whether `builder` should support sub-task batching in v1 or remain strictly single-request
