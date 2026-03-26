import type {
  ApprovalDecisionInput,
  CreateHandoffInput,
  HandoffDetails,
  HandoffRequestRecord
} from "../types.js";

export class ControlPlaneHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async createHandoff(input: CreateHandoffInput): Promise<{ id: string; status: string }> {
    return this.request("/api/handoffs", {
      method: "POST",
      body: input
    });
  }

  async listHandoffs(query: Record<string, string>): Promise<{ items: HandoffRequestRecord[] }> {
    const search = new URLSearchParams(query);
    return this.request(`/api/handoffs?${search.toString()}`, {
      method: "GET"
    });
  }

  async getHandoff(handoffId: string): Promise<HandoffDetails> {
    return this.request(`/api/handoffs/${handoffId}`, {
      method: "GET"
    });
  }

  async approveHandoff(
    handoffId: string,
    input: ApprovalDecisionInput
  ): Promise<{ id: string; status: string }> {
    return this.request(`/api/handoffs/${handoffId}/approve`, {
      method: "POST",
      body: input
    });
  }

  async rejectHandoff(
    handoffId: string,
    input: ApprovalDecisionInput
  ): Promise<{ id: string; status: string }> {
    return this.request(`/api/handoffs/${handoffId}/reject`, {
      method: "POST",
      body: input
    });
  }

  async dispatchHandoff(handoffId: string): Promise<{ task_run_id: string; status: string }> {
    return this.request(`/api/handoffs/${handoffId}/dispatch`, {
      method: "POST"
    });
  }

  async cancelTaskRun(taskRunId: string): Promise<{ id: string; status: string }> {
    return this.request(`/api/task-runs/${taskRunId}/cancel`, {
      method: "POST"
    });
  }

  private async request<T>(pathname: string, init: { method: string; body?: unknown }): Promise<T> {
    const requestInit: RequestInit = {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      }
    };
    if (init.body !== undefined) {
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await fetch(new URL(pathname, this.baseUrl), requestInit);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`control plane request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }
}
