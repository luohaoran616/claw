import { AgentName, Budget, CreateHandoffInput } from "./types.js";

export interface PolicyBudget {
  max_runtime_sec: number;
  max_cost_usd: number;
}

export interface ControlPlanePolicy {
  maxDelegationDepth: number;
  approvalWindowSec: number;
  maxConcurrentTaskRuns: number;
  allowedEdges: ReadonlySet<string>;
  agentBudgets: Record<Exclude<AgentName, "supervisor">, PolicyBudget>;
}

export const defaultPolicy: ControlPlanePolicy = {
  maxDelegationDepth: 1,
  approvalWindowSec: 1800,
  maxConcurrentTaskRuns: 2,
  allowedEdges: new Set([
    "supervisor->researcher",
    "supervisor->builder",
    "researcher->builder",
    "builder->researcher"
  ]),
  agentBudgets: {
    researcher: {
      max_runtime_sec: 600,
      max_cost_usd: 0.5
    },
    builder: {
      max_runtime_sec: 900,
      max_cost_usd: 1.5
    }
  }
};

export class PolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyError";
  }
}

export function validateHandoffPolicy(
  input: CreateHandoffInput,
  policy: ControlPlanePolicy = defaultPolicy
): void {
  if (input.requester_agent === input.target_agent) {
    throw new PolicyError("self-target handoffs are not allowed");
  }

  const edge = `${input.requester_agent}->${input.target_agent}`;
  if (!policy.allowedEdges.has(edge)) {
    throw new PolicyError(`handoff edge ${edge} is not allowed`);
  }

  const requestDepth = input.request_depth ?? 1;
  if (requestDepth > policy.maxDelegationDepth) {
    throw new PolicyError(
      `delegation depth ${requestDepth} exceeds max depth ${policy.maxDelegationDepth}`
    );
  }

  if (input.target_agent === "researcher" && input.write_scope.length > 0) {
    throw new PolicyError("researcher handoffs must not declare a write scope");
  }

  if (input.target_agent === "builder" && input.write_scope.length === 0) {
    throw new PolicyError("builder handoffs must declare a non-empty write scope");
  }

  if (input.target_agent !== "supervisor") {
    validateBudget(input.target_agent, input.budget, policy);
  }
}

function validateBudget(
  targetAgent: Exclude<AgentName, "supervisor">,
  budget: Budget,
  policy: ControlPlanePolicy
) {
  const caps = policy.agentBudgets[targetAgent];
  if (budget.max_runtime_sec > caps.max_runtime_sec) {
    throw new PolicyError(
      `${targetAgent} runtime budget exceeds ${caps.max_runtime_sec} seconds`
    );
  }
  if (budget.max_cost_usd > caps.max_cost_usd) {
    throw new PolicyError(`${targetAgent} cost budget exceeds $${caps.max_cost_usd}`);
  }
}
