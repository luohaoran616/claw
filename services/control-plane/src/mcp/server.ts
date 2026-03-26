import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import type { AgentName } from "../types.js";
import { ControlPlaneHttpClient } from "./client.js";

function toStructuredContent(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

const requestHandoffSchema = z.object({
  target_agent: z.enum(["researcher", "builder"]),
  summary: z.string().min(1),
  reason: z.string().min(1),
  expected_tools: z.array(z.string()).default([]),
  write_scope: z.array(z.string()).default([]),
  budget: z.object({
    max_runtime_sec: z.number().int().positive(),
    max_cost_usd: z.number().positive()
  }),
  rollback_hint: z.string().min(1),
  source_platform: z.string().optional(),
  chat_id: z.string().optional(),
  thread_id: z.string().optional()
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
      description: "Request an approval-gated handoff to another specialist agent.",
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
      description: "Fetch the full status of a previously created handoff request.",
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
