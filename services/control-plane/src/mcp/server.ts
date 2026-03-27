import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import type { AgentName } from "../types.js";
import { ControlPlaneHttpClient } from "./client.js";

function toStructuredContent(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function buildRequestHandoffBudgetSchema() {
  return z.object({
    max_runtime_sec: z
      .number()
      .int()
      .positive()
      .describe("Maximum runtime in seconds for the specialist task."),
    max_cost_usd: z
      .number()
      .positive()
      .describe("Maximum model/tool cost budget in USD for the specialist task.")
  });
}

const requestHandoffSchema = z.object({
  target_agent: z
    .enum(["researcher", "builder"])
    .describe(
      "Use researcher for read-only evidence gathering and source comparison. Use builder for implementation, file changes, real tests, or environment work."
    ),
  summary: z
    .string()
    .min(1)
    .describe("One or two sentences describing the delegated task. Keep it concise and actionable."),
  reason: z
    .string()
    .min(1)
    .describe("Why delegation is needed now. Mention tool boundary, specialist fit, cost, or task scope."),
  expected_tools: z
    .array(z.string())
    .default([])
    .describe(
      "Optional expected tool families or tool ids, such as web_search/read for researcher or read/edit/apply_patch/exec for builder."
    ),
  write_scope: z
    .array(z.string())
    .default([])
    .describe(
      "Exact files or directories the specialist may modify. Required for builder handoffs. Leave empty for researcher."
    ),
  budget: buildRequestHandoffBudgetSchema().describe("Execution budget cap for the delegated task."),
  rollback_hint: z
    .string()
    .min(1)
    .describe("Short rollback or fallback note in case the delegated task fails or must be reversed."),
  source_platform: z
    .string()
    .optional()
    .describe("Optional source platform identifier such as feishu."),
  chat_id: z
    .string()
    .optional()
    .describe("Optional source chat or conversation id for traceability."),
  thread_id: z
    .string()
    .optional()
    .describe("Optional thread id for traceability.")
});

const getStatusSchema = z.object({
  handoff_id: z.string().min(1)
});

const approvalSchema = z.object({
  handoff_id: z.string().min(1),
  approver_id: z.string().min(1),
  comment: z.string().min(1)
});

const cancelSchema = z.object({
  handoff_id: z.string().min(1)
});

export function getRequestHandoffToolDescription(role: AgentName): string {
  const packaging =
    "Keep the request compact and decision-ready: summary, delegation reason, expected tool family, bounded write scope when needed, and rollback hint.";
  if (role === "supervisor") {
    return (
      "Request an approval-gated handoff to another specialist agent. " +
      "If the user has already asked you to carry out the specialist work, create the handoff directly instead of asking a redundant yes/no permission question first. " +
      "Use this when you intentionally want a separate pending-approval checkpoint before work begins. " +
      "Prefer this when the task needs file changes, real tests, environment mutation, long-running execution, or would be cheaper or clearer for a specialist. " +
      "Use direct answers only for read-only synthesis, lightweight verification, or coordination work. " +
      packaging
    );
  }
  return (
    "Request an approval-gated handoff to another specialist agent when the task exceeds your tool boundary or the other specialist is a better fit. " +
    packaging
  );
}

export function getHandoffStatusToolDescription(role: AgentName): string {
  if (role === "supervisor") {
    return "Fetch the full status of a previously created handoff request so you can track specialist work instead of resubmitting it.";
  }
  return "Fetch the full status of a previously created handoff request instead of guessing or re-requesting the same work.";
}

export function listToolNamesForRole(role: AgentName): string[] {
  const requesterTools = [
    `${role}_request_handoff`,
    `${role}_get_handoff_status`
  ];
  if (role === "supervisor") {
    return [
      ...requesterTools,
      "supervisor_list_pending_approvals",
      "supervisor_approve_handoff",
      "supervisor_reject_handoff",
      "supervisor_cancel_handoff"
    ];
  }
  return requesterTools;
}

export function createMcpServer(role: AgentName, client: ControlPlaneHttpClient): McpServer {
  const server = new McpServer({
    name: `claw-control-plane-${role}`,
    version: "0.1.0"
  });
  const requesterToolNames = {
    request: `${role}_request_handoff`,
    status: `${role}_get_handoff_status`
  } as const;

  server.registerTool(
    requesterToolNames.request,
    {
      title: "Request Handoff",
      description: getRequestHandoffToolDescription(role),
      inputSchema: requestHandoffSchema
    },
    async (input) => {
      const result = await client.createHandoff({
        requester_agent: role,
        target_agent: input.target_agent,
        priority: "normal",
        summary: input.summary,
        reason: input.reason,
        expected_tools: input.expected_tools,
        write_scope: input.write_scope,
        budget: input.budget,
        rollback_hint: input.rollback_hint,
        source_channel: input.source_platform
          ? {
              platform: input.source_platform,
              ...(input.chat_id ? { chat_id: input.chat_id } : {}),
              ...(input.thread_id ? { thread_id: input.thread_id } : {})
            }
          : undefined
      });
      return {
        content: [
          {
            type: "text",
            text: `handoff ${result.id} created with status ${result.status}`
          }
        ],
        structuredContent: toStructuredContent(result)
      };
    }
  );

  server.registerTool(
    requesterToolNames.status,
    {
      title: "Get Handoff Status",
      description: getHandoffStatusToolDescription(role),
      inputSchema: getStatusSchema
    },
    async ({ handoff_id }) => {
      const result = await client.getHandoff(handoff_id);
      return {
        content: [
          {
            type: "text",
            text: `handoff ${handoff_id} is ${result.handoff.status}`
          }
        ],
        structuredContent: toStructuredContent(result)
      };
    }
  );

  if (role === "supervisor") {
    server.registerTool(
      "supervisor_list_pending_approvals",
      {
        title: "List Pending Approvals",
        description: "List all handoffs waiting for supervisor approval.",
        inputSchema: z.object({})
      },
      async () => {
        const result = await client.listHandoffs({
          status: "pending_approval",
          limit: "100"
        });
        return {
          content: [
            {
              type: "text",
              text:
                result.items.length === 0
                  ? "no pending approvals"
                  : result.items
                      .map((item) => `${item.id}: ${item.requester_agent} -> ${item.target_agent} | ${item.summary}`)
                      .join("\n")
            }
          ],
          structuredContent: toStructuredContent(result)
        };
      }
    );

    server.registerTool(
      "supervisor_approve_handoff",
      {
        title: "Approve Handoff",
        description: "Approve a pending handoff request.",
        inputSchema: approvalSchema
      },
      async ({ handoff_id, approver_id, comment }) => {
        const result = await client.approveHandoff(handoff_id, {
          approver_id,
          comment
        });
        return {
          content: [
            {
              type: "text",
              text: `handoff ${result.id} approved`
            }
          ],
          structuredContent: toStructuredContent(result)
        };
      }
    );

    server.registerTool(
      "supervisor_reject_handoff",
      {
        title: "Reject Handoff",
        description: "Reject a pending handoff request.",
        inputSchema: approvalSchema
      },
      async ({ handoff_id, approver_id, comment }) => {
        const result = await client.rejectHandoff(handoff_id, {
          approver_id,
          comment
        });
        return {
          content: [
            {
              type: "text",
              text: `handoff ${result.id} rejected`
            }
          ],
          structuredContent: toStructuredContent(result)
        };
      }
    );

    server.registerTool(
      "supervisor_cancel_handoff",
      {
        title: "Cancel Handoff",
        description:
          "Cancel a running handoff by cancelling its latest running task run. Pending requests should be rejected instead.",
        inputSchema: cancelSchema
      },
      async ({ handoff_id }) => {
        const details = await client.getHandoff(handoff_id);
        const runningTask = [...details.task_runs]
          .reverse()
          .find((taskRun) => taskRun.status === "running");

        if (!runningTask) {
          return {
            content: [
              {
                type: "text",
                text: `handoff ${handoff_id} has no running task. Current status: ${details.handoff.status}.`
              }
            ],
            structuredContent: toStructuredContent(details)
          };
        }

        const result = await client.cancelTaskRun(runningTask.id);
        return {
          content: [
            {
              type: "text",
              text: `handoff ${result.id} cancelled`
            }
          ],
          structuredContent: toStructuredContent(result)
        };
      }
    );
  }

  return server;
}

export async function startMcpServer(role: AgentName, client: ControlPlaneHttpClient): Promise<void> {
  const server = createMcpServer(role, client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
