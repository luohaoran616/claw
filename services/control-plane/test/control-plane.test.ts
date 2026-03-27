import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { DataType, newDb } from "pg-mem";
import { afterEach, describe, expect, test } from "vitest";

import { ArtifactWriter } from "../src/artifacts/store.js";
import type { ControlPlaneConfig } from "../src/config.js";
import { loadMcpClientConfig } from "../src/config.js";
import { runMigrations } from "../src/db/migrations.js";
import { ControlPlaneStore } from "../src/db/store.js";
import { createHttpApp } from "../src/http/app.js";
import {
  getHandoffStatusToolDescription,
  getRequestHandoffToolDescription,
  listToolNamesForRole
} from "../src/mcp/server.js";
import type { DispatchExecutionHandle, DispatchExecutor, TaskExecutionResult } from "../src/types.js";
import { DispatchWorker } from "../src/worker/dispatch-worker.js";

const cleanupTasks: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanupTasks.length > 0) {
    const task = cleanupTasks.pop();
    if (task) {
      await task();
    }
  }
});

class FakeExecutor implements DispatchExecutor {
  constructor(
    private readonly buildResult: (command: string[]) => Promise<TaskExecutionResult> | TaskExecutionResult
  ) {}

  startDispatch(args: {
    targetAgent: "supervisor" | "researcher" | "builder";
    prompt: string;
    maxRuntimeSec: number;
  }): DispatchExecutionHandle {
    const command = [
      "node",
      "/home/luo/apps/openclaw/openclaw.mjs",
      "agent",
      "--agent",
      args.targetAgent,
      "--message",
      args.prompt,
      "--json",
      "--timeout",
      String(args.maxRuntimeSec)
    ];
    let cancelled = false;
    return {
      command,
      wait: async () => {
        if (cancelled) {
          return {
            stdout: "",
            stderr: "cancelled",
            exitCode: null,
            timedOut: true,
            rawOutput: null,
            finalText: null
          };
        }
        return this.buildResult(command);
      },
      cancel() {
        cancelled = true;
      }
    };
  }
}

async function createTestContext(executor: DispatchExecutor) {
  const db = newDb();
  db.public.registerFunction({
    name: "version",
    returns: DataType.text,
    implementation: () => "16.0"
  });
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  await runMigrations(pool);

  const artifactRoot = await fs.mkdtemp(path.join(os.tmpdir(), "control-plane-"));
  cleanupTasks.push(async () => {
    await pool.end();
    await fs.rm(artifactRoot, { recursive: true, force: true });
  });

  const store = new ControlPlaneStore(pool);
  const worker = new DispatchWorker(
    store,
    executor,
    new ArtifactWriter(artifactRoot),
    {
      info() {},
      error() {},
      debug() {}
    } as never,
    10_000
  );
  const config: ControlPlaneConfig = {
    host: "127.0.0.1",
    port: 18890,
    token: "test-token",
    databaseUrl: "postgres://test/test",
    artifactRoot,
    openclawNode: "node",
    openclawScript: "/home/luo/apps/openclaw/openclaw.mjs",
    maxConcurrentRuns: 2,
    pollIntervalMs: 2000,
    approvalWindowSec: 1800,
    dispatchGraceSec: 30,
    baseUrl: "http://127.0.0.1:18890",
    mcpRole: null
  };
  const app = createHttpApp({ config, store, worker });
  cleanupTasks.push(async () => {
    await app.close();
  });

  return { app, store, worker, pool };
}

async function waitForStatus(
  store: ControlPlaneStore,
  handoffId: string,
  expected: string,
  timeoutMs = 2000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const handoff = await store.getHandoff(handoffId);
    if (handoff.status === expected) {
      return handoff;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`handoff ${handoffId} did not reach status ${expected}`);
}

describe("control plane api validation", () => {
  test("loads MCP client config without requiring database settings", () => {
    const config = loadMcpClientConfig({
      CONTROL_PLANE_TOKEN: "test-token",
      CONTROL_PLANE_BASE_URL: "http://127.0.0.1:18890",
      CONTROL_PLANE_MCP_ROLE: "supervisor"
    });

    expect(config).toEqual({
      token: "test-token",
      baseUrl: "http://127.0.0.1:18890",
      mcpRole: "supervisor"
    });
  });

  test("rejects invalid builder handoffs and invalid approval transitions", async () => {
    const { app } = await createTestContext(
      new FakeExecutor(() => ({
        stdout: "{\"final\":\"ok\"}",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        rawOutput: { final: "ok" },
        finalText: "ok"
      }))
    );

    const invalidBuilder = await app.inject({
      method: "POST",
      url: "/api/handoffs",
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        requester_agent: "supervisor",
        target_agent: "builder",
        summary: "patch something",
        reason: "need code changes",
        expected_tools: ["shell"],
        write_scope: [],
        budget: {
          max_runtime_sec: 900,
          max_cost_usd: 1.5
        },
        rollback_hint: "git checkout"
      }
    });
    expect(invalidBuilder.statusCode).toBe(400);

    const created = await app.inject({
      method: "POST",
      url: "/api/handoffs",
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        requester_agent: "supervisor",
        target_agent: "researcher",
        summary: "collect docs",
        reason: "need evidence",
        expected_tools: ["web"],
        write_scope: [],
        budget: {
          max_runtime_sec: 600,
          max_cost_usd: 0.5
        },
        rollback_hint: "none"
      }
    });
    expect(created.statusCode).toBe(200);
    const createdJson = created.json<{ id: string }>();

    const rejected = await app.inject({
      method: "POST",
      url: `/api/handoffs/${createdJson.id}/reject`,
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        approver_id: "user_primary",
        comment: "not now"
      }
    });
    expect(rejected.statusCode).toBe(200);

    const approveAfterReject = await app.inject({
      method: "POST",
      url: `/api/handoffs/${createdJson.id}/approve`,
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        approver_id: "user_primary",
        comment: "too late"
      }
    });
    expect(approveAfterReject.statusCode).toBe(409);
  });
});

describe("control plane state machine", () => {
  test("completes a successful approved dispatch and writes artifacts", async () => {
    const { app, store } = await createTestContext(
      new FakeExecutor(() => ({
        stdout: "{\"final\":\"Collected 3 sources\"}",
        stderr: "",
        exitCode: 0,
        timedOut: false,
        rawOutput: { final: "Collected 3 sources" },
        finalText: "Collected 3 sources"
      }))
    );

    const created = await app.inject({
      method: "POST",
      url: "/api/handoffs",
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        requester_agent: "supervisor",
        target_agent: "researcher",
        summary: "collect official references",
        reason: "support architecture decision",
        expected_tools: ["web_search"],
        write_scope: [],
        budget: {
          max_runtime_sec: 600,
          max_cost_usd: 0.5
        },
        rollback_hint: "none"
      }
    });
    const { id } = created.json<{ id: string }>();

    await app.inject({
      method: "POST",
      url: `/api/handoffs/${id}/approve`,
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        approver_id: "user_primary",
        comment: "approved"
      }
    });

    const dispatched = await app.inject({
      method: "POST",
      url: `/api/handoffs/${id}/dispatch`,
      headers: {
        authorization: "Bearer test-token"
      }
    });
    expect(dispatched.statusCode).toBe(200);

    const handoff = await waitForStatus(store, id, "completed");
    expect(handoff.result_summary).toContain("Collected 3 sources");

    const details = await store.getHandoffDetails(id);
    expect(details.task_runs[0]?.status).toBe("completed");
    expect(details.artifacts.map((artifact) => artifact.label)).toEqual(["request", "result"]);
    const events = await store.listAuditEvents(id);
    expect(events.map((event) => event.event_type)).toEqual([
      "handoff.requested",
      "handoff.approved",
      "handoff.dispatched",
      "handoff.running",
      "handoff.completed"
    ]);
  });

  test("expires pending approvals and records failures", async () => {
    const { app, store, pool } = await createTestContext(
      new FakeExecutor(() => ({
        stdout: "",
        stderr: "command failed",
        exitCode: 1,
        timedOut: false,
        rawOutput: null,
        finalText: null
      }))
    );

    const expiring = await app.inject({
      method: "POST",
      url: "/api/handoffs",
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        requester_agent: "builder",
        target_agent: "researcher",
        summary: "inspect docs",
        reason: "need read-only evidence",
        expected_tools: ["docs_read"],
        write_scope: [],
        budget: {
          max_runtime_sec: 600,
          max_cost_usd: 0.5
        },
        rollback_hint: "none"
      }
    });
    const expiringId = expiring.json<{ id: string }>().id;
    await pool.query("UPDATE handoff_requests SET expires_at = NOW() - interval '1 minute' WHERE id = $1", [
      expiringId
    ]);
    await store.expirePendingApprovals();
    expect((await store.getHandoff(expiringId)).status).toBe("expired");

    const failing = await app.inject({
      method: "POST",
      url: "/api/handoffs",
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        requester_agent: "supervisor",
        target_agent: "builder",
        summary: "patch a script",
        reason: "user asked for code change",
        expected_tools: ["shell", "test"],
        write_scope: ["services/control-plane/**"],
        budget: {
          max_runtime_sec: 900,
          max_cost_usd: 1.5
        },
        rollback_hint: "restore file copy"
      }
    });
    const failingId = failing.json<{ id: string }>().id;
    await app.inject({
      method: "POST",
      url: `/api/handoffs/${failingId}/approve`,
      headers: {
        authorization: "Bearer test-token"
      },
      payload: {
        approver_id: "user_primary",
        comment: "proceed"
      }
    });
    await app.inject({
      method: "POST",
      url: `/api/handoffs/${failingId}/dispatch`,
      headers: {
        authorization: "Bearer test-token"
      }
    });

    const failed = await waitForStatus(store, failingId, "failed");
    expect(failed.error_summary).toContain("command failed");
    const details = await store.getHandoffDetails(failingId);
    expect(details.artifacts.at(-1)?.label).toBe("error");
  });
});

describe("mcp tool surface", () => {
  test("exposes approval tools only to supervisor", () => {
    expect(listToolNamesForRole("supervisor")).toEqual([
      "supervisor_request_handoff",
      "supervisor_get_handoff_status",
      "supervisor_list_pending_approvals",
      "supervisor_approve_handoff",
      "supervisor_reject_handoff",
      "supervisor_cancel_handoff"
    ]);
    expect(listToolNamesForRole("researcher")).toEqual([
      "researcher_request_handoff",
      "researcher_get_handoff_status"
    ]);
    expect(listToolNamesForRole("builder")).toEqual([
      "builder_request_handoff",
      "builder_get_handoff_status"
    ]);
  });

  test("describes supervisor handoffs as specialist-first execution", () => {
    const description = getRequestHandoffToolDescription("supervisor");
    expect(description).toContain("redundant yes/no permission question");
    expect(description).toContain("pending-approval checkpoint");
    expect(description).toContain("file changes");
    expect(description).toContain("read-only synthesis");
    expect(description).toContain("bounded write scope");
  });

  test("describes specialist handoffs as boundary-based escalation", () => {
    const description = getRequestHandoffToolDescription("researcher");
    expect(description).toContain("exceeds your tool boundary");
    expect(description).toContain("rollback hint");
  });

  test("describes status checks as follow-up instead of re-requesting work", () => {
    expect(getHandoffStatusToolDescription("supervisor")).toContain("instead of resubmitting");
    expect(getHandoffStatusToolDescription("builder")).toContain("instead of guessing");
  });
});
