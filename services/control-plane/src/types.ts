import { z } from "zod";

export const agentNameSchema = z.enum(["supervisor", "researcher", "builder"]);
export type AgentName = z.infer<typeof agentNameSchema>;

export const requestStatusSchema = z.enum([
  "pending_approval",
  "approved",
  "rejected",
  "expired",
  "dispatched",
  "running",
  "completed",
  "failed",
  "cancelled"
]);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

export const taskRunStatusSchema = z.enum([
  "running",
  "completed",
  "failed",
  "cancelled"
]);
export type TaskRunStatus = z.infer<typeof taskRunStatusSchema>;

export const budgetSchema = z.object({
  max_runtime_sec: z.number().int().positive(),
  max_cost_usd: z.number().positive()
});
export type Budget = z.infer<typeof budgetSchema>;

export const sourceChannelSchema = z.object({
  platform: z.string().min(1),
  chat_id: z.string().min(1).optional(),
  thread_id: z.string().min(1).optional()
});
export type SourceChannel = z.infer<typeof sourceChannelSchema>;

export const createHandoffSchema = z.object({
  requester_agent: agentNameSchema,
  target_agent: agentNameSchema,
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  summary: z.string().min(1).max(500),
  reason: z.string().min(1).max(4000),
  expected_tools: z.array(z.string().min(1)).default([]),
  write_scope: z.array(z.string().min(1)).default([]),
  budget: budgetSchema,
  rollback_hint: z.string().min(1).max(1000),
  source_channel: sourceChannelSchema.optional(),
  request_depth: z.number().int().positive().max(10).optional()
});
export type CreateHandoffInput = z.infer<typeof createHandoffSchema>;

export const approvalDecisionSchema = z.object({
  approver_id: z.string().min(1).max(255),
  comment: z.string().min(1).max(4000)
});
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

export const reportTaskRunSchema = z.object({
  status: taskRunStatusSchema.exclude(["running"]),
  result_summary: z.string().min(1).max(4000).optional(),
  artifacts: z
    .array(
      z.object({
        type: z.string().min(1),
        path: z.string().min(1),
        label: z.string().min(1).optional(),
        mime_type: z.string().min(1).optional()
      })
    )
    .default([])
});
export type ReportTaskRunInput = z.infer<typeof reportTaskRunSchema>;

export const listHandoffsQuerySchema = z.object({
  status: requestStatusSchema.optional(),
  requester_agent: agentNameSchema.optional(),
  target_agent: agentNameSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20)
});
export type ListHandoffsQuery = z.infer<typeof listHandoffsQuerySchema>;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AgentRecord {
  agent_id: AgentName;
  is_active: boolean;
  max_runtime_sec: number;
  max_cost_usd: number;
  requires_write_scope: boolean;
  created_at: string;
  updated_at: string;
}

export interface HandoffRequestRecord {
  id: string;
  requester_agent: AgentName;
  target_agent: AgentName;
  status: RequestStatus;
  priority: "low" | "normal" | "high";
  summary: string;
  reason: string;
  expected_tools: string[];
  write_scope: string[];
  budget: Budget;
  rollback_hint: string;
  source_channel: SourceChannel | null;
  request_depth: number;
  expires_at: string;
  result_summary: string | null;
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRecord {
  id: string;
  handoff_request_id: string;
  decision: "approved" | "rejected";
  approver_id: string;
  comment: string;
  expires_at: string;
  created_at: string;
}

export interface TaskRunRecord {
  id: string;
  handoff_request_id: string;
  agent: AgentName;
  status: TaskRunStatus;
  command: string[];
  started_at: string;
  finished_at: string | null;
  result_summary: string | null;
  exit_code: number | null;
  created_at: string;
  updated_at: string;
}

export interface ArtifactRecord {
  id: string;
  handoff_request_id: string;
  task_run_id: string | null;
  type: string;
  label: string;
  path: string;
  mime_type: string | null;
  size_bytes: number;
  metadata: Record<string, JsonValue>;
  created_at: string;
}

export interface AuditEventRecord {
  id: string;
  handoff_request_id: string;
  task_run_id: string | null;
  event_type: string;
  actor_type: "system" | "agent" | "user" | "worker";
  actor_id: string;
  payload: Record<string, JsonValue>;
  created_at: string;
}

export interface HandoffDetails {
  handoff: HandoffRequestRecord;
  approvals: ApprovalRecord[];
  task_runs: TaskRunRecord[];
  artifacts: ArtifactRecord[];
}

export interface TaskExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  rawOutput: JsonValue | null;
  finalText: string | null;
}

export interface DispatchExecutionHandle {
  command: string[];
  wait(): Promise<TaskExecutionResult>;
  cancel(): void;
}

export interface DispatchExecutor {
  startDispatch(args: {
    targetAgent: AgentName;
    prompt: string;
    maxRuntimeSec: number;
  }): DispatchExecutionHandle;
}
