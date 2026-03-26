import type { Pool, PoolClient } from "pg";

import { makeApprovalId, makeArtifactId, makeAuditEventId, makeHandoffId, makeTaskRunId } from "../ids.js";
import { ConflictError, NotFoundError } from "../errors.js";
import { defaultPolicy, type ControlPlanePolicy, validateHandoffPolicy } from "../policy.js";
import type {
  AgentName,
  ApprovalDecisionInput,
  ApprovalRecord,
  ArtifactRecord,
  AuditEventRecord,
  Budget,
  CreateHandoffInput,
  HandoffDetails,
  HandoffRequestRecord,
  JsonValue,
  ListHandoffsQuery,
  ReportTaskRunInput,
  RequestStatus,
  SourceChannel,
  TaskRunRecord,
  TaskRunStatus
} from "../types.js";

interface FinalizeTaskRunInput {
  taskRunId: string;
  status: Exclude<TaskRunStatus, "running">;
  resultSummary: string | null;
  errorSummary: string | null;
  exitCode: number | null;
  artifacts?: Array<{
    id?: string;
    type: string;
    label: string;
    path: string;
    mime_type?: string | null;
    size_bytes: number;
    metadata?: Record<string, JsonValue>;
  }>;
  actorType: "system" | "agent" | "user" | "worker";
  actorId: string;
}

interface StartTaskRunInput {
  handoffId: string;
  command: string[];
}

function toIso(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}

function asBudget(value: unknown): Budget {
  return value as Budget;
}

function asSourceChannel(value: unknown): SourceChannel | null {
  return (value as SourceChannel | null) ?? null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

function mapHandoff(row: Record<string, unknown>): HandoffRequestRecord {
  return {
    id: String(row.id),
    requester_agent: row.requester_agent as AgentName,
    target_agent: row.target_agent as AgentName,
    status: row.status as RequestStatus,
    priority: row.priority as "low" | "normal" | "high",
    summary: String(row.summary),
    reason: String(row.reason),
    expected_tools: asStringArray(row.expected_tools),
    write_scope: asStringArray(row.write_scope),
    budget: asBudget(row.budget),
    rollback_hint: String(row.rollback_hint),
    source_channel: asSourceChannel(row.source_channel),
    request_depth: Number(row.request_depth),
    expires_at: new Date(String(row.expires_at)).toISOString(),
    result_summary: row.result_summary ? String(row.result_summary) : null,
    error_summary: row.error_summary ? String(row.error_summary) : null,
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(String(row.updated_at)).toISOString()
  };
}

function mapApproval(row: Record<string, unknown>): ApprovalRecord {
  return {
    id: String(row.id),
    handoff_request_id: String(row.handoff_request_id),
    decision: row.decision as "approved" | "rejected",
    approver_id: String(row.approver_id),
    comment: String(row.comment),
    expires_at: new Date(String(row.expires_at)).toISOString(),
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

function mapTaskRun(row: Record<string, unknown>): TaskRunRecord {
  return {
    id: String(row.id),
    handoff_request_id: String(row.handoff_request_id),
    agent: row.agent as AgentName,
    status: row.status as TaskRunStatus,
    command: asStringArray(row.command),
    started_at: new Date(String(row.started_at)).toISOString(),
    finished_at: row.finished_at ? new Date(String(row.finished_at)).toISOString() : null,
    result_summary: row.result_summary ? String(row.result_summary) : null,
    exit_code: row.exit_code === null || row.exit_code === undefined ? null : Number(row.exit_code),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(String(row.updated_at)).toISOString()
  };
}

function mapArtifact(row: Record<string, unknown>): ArtifactRecord {
  return {
    id: String(row.id),
    handoff_request_id: String(row.handoff_request_id),
    task_run_id: row.task_run_id ? String(row.task_run_id) : null,
    type: String(row.type),
    label: String(row.label),
    path: String(row.path),
    mime_type: row.mime_type ? String(row.mime_type) : null,
    size_bytes: Number(row.size_bytes ?? 0),
    metadata: (row.metadata as Record<string, JsonValue>) ?? {},
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

function mapAudit(row: Record<string, unknown>): AuditEventRecord {
  return {
    id: String(row.id),
    handoff_request_id: String(row.handoff_request_id),
    task_run_id: row.task_run_id ? String(row.task_run_id) : null,
    event_type: String(row.event_type),
    actor_type: row.actor_type as AuditEventRecord["actor_type"],
    actor_id: String(row.actor_id),
    payload: (row.payload as Record<string, JsonValue>) ?? {},
    created_at: new Date(String(row.created_at)).toISOString()
  };
}

export class ControlPlaneStore {
  constructor(
    private readonly db: Pool,
    private readonly policy: ControlPlanePolicy = defaultPolicy,
    private readonly now: () => Date = () => new Date()
  ) {}

  async createHandoff(input: CreateHandoffInput): Promise<HandoffRequestRecord> {
    validateHandoffPolicy(input, this.policy);
    await this.ensureAgentsAreActive([input.requester_agent, input.target_agent]);

    const id = makeHandoffId();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + this.policy.approvalWindowSec * 1000);

    return this.withTransaction(async (tx) => {
      const insertResult = await tx.query(
        `
          INSERT INTO handoff_requests (
            id, requester_agent, target_agent, status, priority, summary, reason,
            expected_tools, write_scope, budget, rollback_hint, source_channel,
            request_depth, expires_at
          )
          VALUES (
            $1, $2, $3, 'pending_approval', $4, $5, $6,
            $7::jsonb, $8::jsonb, $9::jsonb, $10, $11::jsonb,
            $12, $13
          )
          RETURNING *
        `,
        [
          id,
          input.requester_agent,
          input.target_agent,
          input.priority,
          input.summary,
          input.reason,
          JSON.stringify(input.expected_tools),
          JSON.stringify(input.write_scope),
          JSON.stringify(input.budget),
          input.rollback_hint,
          input.source_channel ? JSON.stringify(input.source_channel) : null,
          input.request_depth ?? 1,
          expiresAt.toISOString()
        ]
      );
      const handoff = mapHandoff(insertResult.rows[0] as Record<string, unknown>);
      await this.insertAuditEvent(tx, {
        handoffRequestId: handoff.id,
        taskRunId: null,
        eventType: "handoff.requested",
        actorType: "agent",
        actorId: handoff.requester_agent,
        payload: {
          target_agent: handoff.target_agent,
          summary: handoff.summary,
          status: handoff.status
        }
      });
      return handoff;
    });
  }

  async listHandoffs(query: Partial<ListHandoffsQuery> = {}): Promise<HandoffRequestRecord[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (query.status) {
      values.push(query.status);
      clauses.push(`status = $${values.length}`);
    }
    if (query.requester_agent) {
      values.push(query.requester_agent);
      clauses.push(`requester_agent = $${values.length}`);
    }
    if (query.target_agent) {
      values.push(query.target_agent);
      clauses.push(`target_agent = $${values.length}`);
    }

    const limit = query.limit ?? 20;
    values.push(limit);

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await this.db.query(
      `
        SELECT *
        FROM handoff_requests
        ${where}
        ORDER BY created_at DESC
        LIMIT $${values.length}
      `,
      values
    );
    return result.rows.map((row: Record<string, unknown>) => mapHandoff(row));
  }

  async getHandoff(handoffId: string): Promise<HandoffRequestRecord> {
    const result = await this.db.query("SELECT * FROM handoff_requests WHERE id = $1", [
      handoffId
    ]);
    if (!result.rowCount) {
      throw new NotFoundError(`handoff ${handoffId} not found`);
    }
    return mapHandoff(result.rows[0] as Record<string, unknown>);
  }

  async getHandoffDetails(handoffId: string): Promise<HandoffDetails> {
    const [handoff, approvals, taskRuns, artifacts] = await Promise.all([
      this.getHandoff(handoffId),
      this.listApprovals(handoffId),
      this.listTaskRuns(handoffId),
      this.listArtifacts(handoffId)
    ]);
    return {
      handoff,
      approvals,
      task_runs: taskRuns,
      artifacts
    };
  }

  async listApprovals(handoffId: string): Promise<ApprovalRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM approvals WHERE handoff_request_id = $1 ORDER BY created_at ASC",
      [handoffId]
    );
    return result.rows.map((row: Record<string, unknown>) => mapApproval(row));
  }

  async listTaskRuns(handoffId: string): Promise<TaskRunRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM task_runs WHERE handoff_request_id = $1 ORDER BY started_at ASC",
      [handoffId]
    );
    return result.rows.map((row: Record<string, unknown>) => mapTaskRun(row));
  }

  async listArtifacts(handoffId: string): Promise<ArtifactRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM artifacts WHERE handoff_request_id = $1 ORDER BY created_at ASC",
      [handoffId]
    );
    return result.rows.map((row: Record<string, unknown>) => mapArtifact(row));
  }

  async listAuditEvents(handoffId: string): Promise<AuditEventRecord[]> {
    const result = await this.db.query(
      "SELECT * FROM audit_events WHERE handoff_request_id = $1 ORDER BY created_at ASC",
      [handoffId]
    );
    return result.rows.map((row: Record<string, unknown>) => mapAudit(row));
  }

  async approveHandoff(
    handoffId: string,
    input: ApprovalDecisionInput
  ): Promise<HandoffRequestRecord> {
    return this.withTransaction(async (tx) => {
      const handoff = await this.getHandoffForUpdate(tx, handoffId);
      if (handoff.status !== "pending_approval") {
        throw new ConflictError(`handoff ${handoffId} is not pending approval`);
      }
      if (new Date(handoff.expires_at).getTime() <= this.now().getTime()) {
        throw new ConflictError(`handoff ${handoffId} is already expired`);
      }

      await tx.query(
        `
          INSERT INTO approvals (id, handoff_request_id, decision, approver_id, comment, expires_at)
          VALUES ($1, $2, 'approved', $3, $4, $5)
        `,
        [makeApprovalId(), handoffId, input.approver_id, input.comment, handoff.expires_at]
      );

      const updated = await this.updateHandoffStatus(tx, handoffId, "approved", {
        actorType: "user",
        actorId: input.approver_id,
        eventType: "handoff.approved",
        payload: {
          comment: input.comment
        }
      });
      return updated;
    });
  }

  async rejectHandoff(handoffId: string, input: ApprovalDecisionInput): Promise<HandoffRequestRecord> {
    return this.withTransaction(async (tx) => {
      const handoff = await this.getHandoffForUpdate(tx, handoffId);
      if (handoff.status !== "pending_approval") {
        throw new ConflictError(`handoff ${handoffId} is not pending approval`);
      }

      await tx.query(
        `
          INSERT INTO approvals (id, handoff_request_id, decision, approver_id, comment, expires_at)
          VALUES ($1, $2, 'rejected', $3, $4, $5)
        `,
        [makeApprovalId(), handoffId, input.approver_id, input.comment, handoff.expires_at]
      );

      return this.updateHandoffStatus(tx, handoffId, "rejected", {
        actorType: "user",
        actorId: input.approver_id,
        eventType: "handoff.rejected",
        payload: {
          comment: input.comment
        }
      });
    });
  }

  async expirePendingApprovals(): Promise<string[]> {
    const result = await this.db.query(
      `
        SELECT id
        FROM handoff_requests
        WHERE status = 'pending_approval' AND expires_at <= NOW()
      `
    );

    const expiredIds: string[] = [];
    for (const row of result.rows) {
      const handoffId = String(row.id);
      await this.withTransaction(async (tx) => {
        const handoff = await this.getHandoffForUpdate(tx, handoffId);
        if (handoff.status !== "pending_approval") {
          return;
        }
        await this.updateHandoffStatus(tx, handoffId, "expired", {
          actorType: "system",
          actorId: "control-plane",
          eventType: "handoff.expired",
          payload: {}
        });
      });
      expiredIds.push(handoffId);
    }
    return expiredIds;
  }

  async startTaskRun(input: StartTaskRunInput): Promise<{
    handoff: HandoffRequestRecord;
    taskRun: TaskRunRecord;
  }> {
    return this.withTransaction(async (tx) => {
      const handoff = await this.getHandoffForUpdate(tx, input.handoffId);
      if (handoff.status !== "approved") {
        throw new ConflictError(`handoff ${input.handoffId} is not approved`);
      }

      const activeCount = await this.countActiveDispatches(tx);
      if (activeCount >= this.policy.maxConcurrentTaskRuns) {
        throw new ConflictError("max concurrent task runs reached");
      }

      await this.updateHandoffStatus(tx, handoff.id, "dispatched", {
        actorType: "worker",
        actorId: "dispatch-worker",
        eventType: "handoff.dispatched",
        payload: {}
      });

      const taskRunId = makeTaskRunId();
      const taskRunResult = await tx.query(
        `
          INSERT INTO task_runs (id, handoff_request_id, agent, status, command)
          VALUES ($1, $2, $3, 'running', $4::jsonb)
          RETURNING *
        `,
        [taskRunId, handoff.id, handoff.target_agent, JSON.stringify(input.command)]
      );

      const runningHandoff = await this.updateHandoffStatus(tx, handoff.id, "running", {
        actorType: "worker",
        actorId: "dispatch-worker",
        eventType: "handoff.running",
        payload: {
          task_run_id: taskRunId
        }
      });

      return {
        handoff: runningHandoff,
        taskRun: mapTaskRun(taskRunResult.rows[0] as Record<string, unknown>)
      };
    });
  }

  async finalizeTaskRun(input: FinalizeTaskRunInput): Promise<HandoffRequestRecord> {
    return this.withTransaction(async (tx) => {
      const taskRun = await this.getTaskRunForUpdate(tx, input.taskRunId);
      if (taskRun.status !== "running") {
        throw new ConflictError(`task run ${input.taskRunId} is not running`);
      }

      const finishedAt = toIso(this.now());
      await tx.query(
        `
          UPDATE task_runs
          SET status = $2,
              finished_at = $3,
              result_summary = $4,
              exit_code = $5,
              updated_at = NOW()
          WHERE id = $1
        `,
        [input.taskRunId, input.status, finishedAt, input.resultSummary, input.exitCode]
      );

      if (input.artifacts) {
        for (const artifact of input.artifacts) {
          await this.insertArtifact(tx, {
            id: artifact.id ?? makeArtifactId(),
            handoff_request_id: taskRun.handoff_request_id,
            task_run_id: taskRun.id,
            type: artifact.type,
            label: artifact.label,
            path: artifact.path,
            mime_type: artifact.mime_type ?? null,
            size_bytes: artifact.size_bytes,
            metadata: artifact.metadata ?? {}
          });
        }
      }

      const nextStatus: RequestStatus =
        input.status === "completed"
          ? "completed"
          : input.status === "cancelled"
            ? "cancelled"
            : "failed";

      return this.updateHandoffStatus(tx, taskRun.handoff_request_id, nextStatus, {
        actorType: input.actorType,
        actorId: input.actorId,
        eventType:
          nextStatus === "completed"
            ? "handoff.completed"
            : nextStatus === "cancelled"
              ? "handoff.cancelled"
              : "handoff.failed",
        payload: {
          task_run_id: taskRun.id,
          result_summary: input.resultSummary,
          error_summary: input.errorSummary,
          exit_code: input.exitCode
        },
        resultSummary: input.resultSummary,
        errorSummary: input.errorSummary
      });
    });
  }

  async reportTaskRun(taskRunId: string, input: ReportTaskRunInput): Promise<HandoffRequestRecord> {
    const artifacts = input.artifacts.map((artifact) => ({
      type: artifact.type,
      label: artifact.label ?? artifact.type,
      path: artifact.path,
      mime_type: artifact.mime_type ?? null,
      size_bytes: 0
    }));
    return this.finalizeTaskRun({
      taskRunId,
      status: input.status,
      resultSummary: input.result_summary ?? null,
      errorSummary: input.status === "failed" ? input.result_summary ?? "task failed" : null,
      exitCode: null,
      artifacts,
      actorType: "agent",
      actorId: "task-report"
    });
  }

  async cancelTaskRun(taskRunId: string, actorId = "user"): Promise<HandoffRequestRecord> {
    return this.finalizeTaskRun({
      taskRunId,
      status: "cancelled",
      resultSummary: null,
      errorSummary: "cancelled by request",
      exitCode: null,
      actorType: "user",
      actorId
    });
  }

  async getPendingApprovals(): Promise<HandoffRequestRecord[]> {
    return this.listHandoffs({
      status: "pending_approval",
      limit: 100
    });
  }

  async createArtifactRecord(input: {
    handoff_request_id: string;
    task_run_id: string | null;
    type: string;
    label: string;
    path: string;
    mime_type?: string | null;
    size_bytes: number;
    metadata?: Record<string, JsonValue>;
  }): Promise<ArtifactRecord> {
    return this.withTransaction(async (tx) => {
      const artifactId = makeArtifactId();
      await this.insertArtifact(tx, {
        id: artifactId,
        handoff_request_id: input.handoff_request_id,
        task_run_id: input.task_run_id,
        type: input.type,
        label: input.label,
        path: input.path,
        mime_type: input.mime_type ?? null,
        size_bytes: input.size_bytes,
        metadata: input.metadata ?? {}
      });
      const result = await tx.query("SELECT * FROM artifacts WHERE id = $1", [artifactId]);
      return mapArtifact(result.rows[0] as Record<string, unknown>);
    });
  }

  async getTaskRun(taskRunId: string): Promise<TaskRunRecord> {
    const result = await this.db.query("SELECT * FROM task_runs WHERE id = $1", [taskRunId]);
    if (!result.rowCount) {
      throw new NotFoundError(`task run ${taskRunId} not found`);
    }
    return mapTaskRun(result.rows[0] as Record<string, unknown>);
  }

  private async ensureAgentsAreActive(agentIds: AgentName[]): Promise<void> {
    const placeholders = agentIds.map((_, index) => `$${index + 1}`).join(", ");
    const result = await this.db.query(
      `SELECT agent_id, is_active FROM agents WHERE agent_id IN (${placeholders})`,
      agentIds
    );
    const activeAgents = new Set(
      result.rows
        .filter((row: { is_active: boolean }) => row.is_active === true)
        .map((row: { agent_id: string }) => String(row.agent_id))
    );
    for (const agentId of agentIds) {
      if (!activeAgents.has(agentId)) {
        throw new ConflictError(`agent ${agentId} is inactive or missing`);
      }
    }
  }

  private async countActiveDispatches(tx: PoolClient): Promise<number> {
    const result = await tx.query(
      "SELECT COUNT(*) AS count FROM handoff_requests WHERE status IN ('dispatched', 'running')"
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private async getHandoffForUpdate(tx: PoolClient, handoffId: string): Promise<HandoffRequestRecord> {
    const result = await tx.query("SELECT * FROM handoff_requests WHERE id = $1 FOR UPDATE", [
      handoffId
    ]);
    if (!result.rowCount) {
      throw new NotFoundError(`handoff ${handoffId} not found`);
    }
    return mapHandoff(result.rows[0] as Record<string, unknown>);
  }

  private async getTaskRunForUpdate(tx: PoolClient, taskRunId: string): Promise<TaskRunRecord> {
    const result = await tx.query("SELECT * FROM task_runs WHERE id = $1 FOR UPDATE", [taskRunId]);
    if (!result.rowCount) {
      throw new NotFoundError(`task run ${taskRunId} not found`);
    }
    return mapTaskRun(result.rows[0] as Record<string, unknown>);
  }

  private async updateHandoffStatus(
    tx: PoolClient,
    handoffId: string,
    status: RequestStatus,
    options: {
      actorType: "system" | "agent" | "user" | "worker";
      actorId: string;
      eventType: string;
      payload: Record<string, JsonValue>;
      resultSummary?: string | null;
      errorSummary?: string | null;
    }
  ): Promise<HandoffRequestRecord> {
    const result = await tx.query(
      `
        UPDATE handoff_requests
        SET status = $2,
            result_summary = COALESCE($3, result_summary),
            error_summary = COALESCE($4, error_summary),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        handoffId,
        status,
        options.resultSummary ?? null,
        options.errorSummary ?? null
      ]
    );
    const handoff = mapHandoff(result.rows[0] as Record<string, unknown>);
    await this.insertAuditEvent(tx, {
      handoffRequestId: handoffId,
      taskRunId:
        typeof options.payload.task_run_id === "string" ? options.payload.task_run_id : null,
      eventType: options.eventType,
      actorType: options.actorType,
      actorId: options.actorId,
      payload: {
        ...options.payload,
        status
      }
    });
    return handoff;
  }

  private async insertArtifact(
    tx: PoolClient,
    artifact: {
      id: string;
      handoff_request_id: string;
      task_run_id: string | null;
      type: string;
      label: string;
      path: string;
      mime_type: string | null;
      size_bytes: number;
      metadata: Record<string, JsonValue>;
    }
  ): Promise<void> {
    await tx.query(
      `
        INSERT INTO artifacts (
          id, handoff_request_id, task_run_id, type, label, path,
          mime_type, size_bytes, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
      `,
      [
        artifact.id,
        artifact.handoff_request_id,
        artifact.task_run_id,
        artifact.type,
        artifact.label,
        artifact.path,
        artifact.mime_type,
        artifact.size_bytes,
        JSON.stringify(artifact.metadata)
      ]
    );
  }

  private async insertAuditEvent(
    tx: PoolClient,
    event: {
      handoffRequestId: string;
      taskRunId: string | null;
      eventType: string;
      actorType: "system" | "agent" | "user" | "worker";
      actorId: string;
      payload: Record<string, JsonValue>;
    }
  ): Promise<void> {
    await tx.query(
      `
        INSERT INTO audit_events (
          id, handoff_request_id, task_run_id, event_type, actor_type, actor_id, payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        makeAuditEventId(),
        event.handoffRequestId,
        event.taskRunId,
        event.eventType,
        event.actorType,
        event.actorId,
        JSON.stringify(event.payload)
      ]
    );
  }

  private async withTransaction<T>(fn: (tx: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
