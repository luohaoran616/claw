import path from "node:path";
import { z } from "zod";

import { agentNameSchema, AgentName } from "./types.js";

const sharedConfigSchema = z.object({
  CONTROL_PLANE_TOKEN: z.string().min(1),
  CONTROL_PLANE_BASE_URL: z.string().min(1).default("http://127.0.0.1:18890"),
  CONTROL_PLANE_MCP_ROLE: agentNameSchema.optional()
});

const httpConfigSchema = sharedConfigSchema.extend({
  CONTROL_PLANE_PORT: z.coerce.number().int().positive().default(18890),
  CONTROL_PLANE_HOST: z.string().min(1).default("127.0.0.1"),
  CONTROL_PLANE_DATABASE_URL: z.string().min(1),
  CONTROL_PLANE_ARTIFACT_ROOT: z
    .string()
    .min(1)
    .default("/home/luo/.local/share/openclaw-control-plane/artifacts"),
  CONTROL_PLANE_OPENCLAW_NODE: z.string().min(1).default("node"),
  CONTROL_PLANE_OPENCLAW_SCRIPT: z
    .string()
    .min(1)
    .default("/home/luo/apps/openclaw/openclaw.mjs"),
  CONTROL_PLANE_MAX_CONCURRENT_RUNS: z.coerce.number().int().positive().default(2),
  CONTROL_PLANE_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  CONTROL_PLANE_APPROVAL_WINDOW_SEC: z.coerce.number().int().positive().default(1800),
  CONTROL_PLANE_DISPATCH_GRACE_SEC: z.coerce.number().int().positive().default(30)
});

export interface ControlPlaneConfig {
  host: string;
  port: number;
  token: string;
  databaseUrl: string;
  artifactRoot: string;
  openclawNode: string;
  openclawScript: string;
  maxConcurrentRuns: number;
  pollIntervalMs: number;
  approvalWindowSec: number;
  dispatchGraceSec: number;
  baseUrl: string;
  mcpRole: AgentName | null;
}

export interface ControlPlaneMcpClientConfig {
  token: string;
  baseUrl: string;
  mcpRole: AgentName;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ControlPlaneConfig {
  const parsed = httpConfigSchema.parse(env);
  return {
    host: parsed.CONTROL_PLANE_HOST,
    port: parsed.CONTROL_PLANE_PORT,
    token: parsed.CONTROL_PLANE_TOKEN,
    databaseUrl: parsed.CONTROL_PLANE_DATABASE_URL,
    artifactRoot: path.resolve(parsed.CONTROL_PLANE_ARTIFACT_ROOT),
    openclawNode: parsed.CONTROL_PLANE_OPENCLAW_NODE,
    openclawScript: parsed.CONTROL_PLANE_OPENCLAW_SCRIPT,
    maxConcurrentRuns: parsed.CONTROL_PLANE_MAX_CONCURRENT_RUNS,
    pollIntervalMs: parsed.CONTROL_PLANE_POLL_INTERVAL_MS,
    approvalWindowSec: parsed.CONTROL_PLANE_APPROVAL_WINDOW_SEC,
    dispatchGraceSec: parsed.CONTROL_PLANE_DISPATCH_GRACE_SEC,
    baseUrl: parsed.CONTROL_PLANE_BASE_URL,
    mcpRole: parsed.CONTROL_PLANE_MCP_ROLE ?? null
  };
}

export function loadMcpClientConfig(
  env: NodeJS.ProcessEnv = process.env
): ControlPlaneMcpClientConfig {
  const parsed = sharedConfigSchema.parse(env);
  if (!parsed.CONTROL_PLANE_MCP_ROLE) {
    throw new Error("CONTROL_PLANE_MCP_ROLE must be set to supervisor, researcher, or builder");
  }

  return {
    token: parsed.CONTROL_PLANE_TOKEN,
    baseUrl: parsed.CONTROL_PLANE_BASE_URL,
    mcpRole: parsed.CONTROL_PLANE_MCP_ROLE
  };
}
