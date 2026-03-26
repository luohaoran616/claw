import { HandoffRequestRecord } from "./types.js";

export function buildDispatchPrompt(handoff: HandoffRequestRecord): string {
  const sourceChannel = handoff.source_channel
    ? JSON.stringify(handoff.source_channel, null, 2)
    : "null";

  return [
    "You are executing an approval-gated handoff from the OpenClaw control plane.",
    "",
    `handoff_id: ${handoff.id}`,
    `requester_agent: ${handoff.requester_agent}`,
    `target_agent: ${handoff.target_agent}`,
    `priority: ${handoff.priority}`,
    "",
    "task_summary:",
    handoff.summary,
    "",
    "delegation_reason:",
    handoff.reason,
    "",
    "expected_tools:",
    handoff.expected_tools.length > 0 ? handoff.expected_tools.join(", ") : "(none declared)",
    "",
    "declared_write_scope:",
    handoff.write_scope.length > 0 ? handoff.write_scope.join("\n") : "(read-only)",
    "",
    "runtime_budget:",
    `- max_runtime_sec: ${handoff.budget.max_runtime_sec}`,
    `- max_cost_usd: ${handoff.budget.max_cost_usd}`,
    "",
    "rollback_hint:",
    handoff.rollback_hint,
    "",
    "source_channel:",
    sourceChannel,
    "",
    "Execution rules:",
    "1. Stay strictly inside the declared write scope and tool expectations.",
    "2. Stop and explain why if the task would exceed the declared scope or budget.",
    "3. Prefer the smallest change set that satisfies the request.",
    "4. Include a concise final summary and any important follow-up risks.",
    "5. Do not delegate to another agent; this handoff is already the approved execution boundary."
  ].join("\n");
}
