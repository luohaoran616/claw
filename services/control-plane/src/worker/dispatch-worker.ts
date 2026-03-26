import type pino from "pino";

import { ArtifactWriter } from "../artifacts/store.js";
import { ConflictError } from "../errors.js";
import { buildDispatchPrompt } from "../prompt.js";
import type { ControlPlaneStore } from "../db/store.js";
import type { DispatchExecutor, HandoffRequestRecord, TaskExecutionResult } from "../types.js";

interface ActiveRun {
  handoffId: string;
  taskRunId: string;
  cancel: () => void;
  completion: Promise<HandoffRequestRecord>;
  cancelledByUser: boolean;
}

export class DispatchWorker {
  private timer: NodeJS.Timeout | null = null;
  private tickInFlight = false;
  private readonly activeRuns = new Map<string, ActiveRun>();

  constructor(
    private readonly store: ControlPlaneStore,
    private readonly executor: DispatchExecutor,
    private readonly artifacts: ArtifactWriter,
    private readonly logger: pino.Logger,
    private readonly pollIntervalMs: number
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);
    void this.tick();
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await Promise.allSettled([...this.activeRuns.values()].map((run) => run.completion));
  }

  async tick(): Promise<void> {
    if (this.tickInFlight) {
      return;
    }
    this.tickInFlight = true;
    try {
      const expired = await this.store.expirePendingApprovals();
      if (expired.length > 0) {
        this.logger.info({ expiredCount: expired.length, handoffIds: expired }, "expired handoffs");
      }

      const approved = await this.store.listHandoffs({ status: "approved", limit: 10 });
      for (const handoff of approved) {
        if ([...this.activeRuns.values()].some((run) => run.handoffId === handoff.id)) {
          continue;
        }
        void this.startHandoff(handoff.id);
      }
    } finally {
      this.tickInFlight = false;
    }
  }

  async cancel(taskRunId: string): Promise<HandoffRequestRecord> {
    const active = this.activeRuns.get(taskRunId);
    if (!active) {
      return this.store.cancelTaskRun(taskRunId, "control-plane-worker");
    }
    active.cancelledByUser = true;
    active.cancel();
    return active.completion;
  }

  async startHandoff(handoffId: string): Promise<{ taskRunId: string; status: "running" }> {
    if ([...this.activeRuns.values()].some((run) => run.handoffId === handoffId)) {
      const existing = [...this.activeRuns.values()].find((run) => run.handoffId === handoffId)!;
      return {
        taskRunId: existing.taskRunId,
        status: "running"
      };
    }

    try {
      const handoff = await this.store.getHandoff(handoffId);
      const prompt = buildDispatchPrompt(handoff);
      const handle = this.executor.startDispatch({
        targetAgent: handoff.target_agent,
        prompt,
        maxRuntimeSec: handoff.budget.max_runtime_sec
      });

      const started = await this.store.startTaskRun({
        handoffId,
        command: handle.command
      });

      const requestArtifact = await this.artifacts.writeJsonArtifact({
        handoffId,
        taskRunId: started.taskRun.id,
        fileName: "request.json",
        payload: {
          handoff: started.handoff,
          prompt,
          command: handle.command
        }
      });
      await this.store.createArtifactRecord({
        handoff_request_id: handoffId,
        task_run_id: started.taskRun.id,
        type: "json",
        label: "request",
        path: requestArtifact.path,
        mime_type: "application/json",
        size_bytes: requestArtifact.sizeBytes,
        metadata: {
          file_name: "request.json"
        }
      });

      let activeRun!: ActiveRun;
      activeRun = {
        handoffId,
        taskRunId: started.taskRun.id,
        cancel: handle.cancel,
        completion: this.waitForCompletion(started.taskRun.id, handoffId, handle.wait(), () => activeRun.cancelledByUser),
        cancelledByUser: false
      };
      this.activeRuns.set(started.taskRun.id, activeRun);
      void activeRun.completion;
      return {
        taskRunId: started.taskRun.id,
        status: "running"
      };
    } catch (error) {
      if (error instanceof ConflictError) {
        this.logger.debug({ handoffId, err: error }, "dispatch skipped");
        throw error;
      }
      this.logger.error({ handoffId, err: error }, "dispatch failed before execution");
      throw error;
    }
  }

  private async waitForCompletion(
    taskRunId: string,
    handoffId: string,
    execution: Promise<TaskExecutionResult>,
    wasCancelled: () => boolean
  ): Promise<HandoffRequestRecord> {
    try {
      const result = await execution;
      const isCancelled = wasCancelled();
      const status = isCancelled
        ? "cancelled"
        : result.exitCode === 0 && !result.timedOut
          ? "completed"
          : "failed";

      const artifactName =
        status === "completed" ? "result.json" : status === "cancelled" ? "error.json" : "error.json";
      const artifactPayload =
        status === "completed"
          ? { raw_output: result.rawOutput, stdout: result.stdout, final_text: result.finalText }
          : {
              stdout: result.stdout,
              stderr: result.stderr,
              exit_code: result.exitCode,
              timed_out: result.timedOut,
              cancelled: isCancelled
            };
      const artifact = await this.artifacts.writeJsonArtifact({
        handoffId,
        taskRunId,
        fileName: artifactName,
        payload: artifactPayload
      });

      return await this.store.finalizeTaskRun({
        taskRunId,
        status,
        resultSummary:
          status === "completed"
            ? summarize(result.finalText ?? result.stdout)
            : status === "cancelled"
              ? "dispatch cancelled by operator"
              : null,
        errorSummary:
          status === "completed"
            ? null
            : isCancelled
              ? "dispatch cancelled by operator"
              : summarize(result.stderr || result.stdout || "dispatch failed"),
        exitCode: result.exitCode,
        artifacts: [
          {
            type: "json",
            label: status === "completed" ? "result" : "error",
            path: artifact.path,
            mime_type: "application/json",
            size_bytes: artifact.sizeBytes,
            metadata: {
              file_name: artifactName
            }
          }
        ],
        actorType: "worker",
        actorId: "dispatch-worker"
      });
    } catch (error) {
      this.logger.error({ handoffId, taskRunId, err: error }, "dispatch execution crashed");
      const artifact = await this.artifacts.writeJsonArtifact({
        handoffId,
        taskRunId,
        fileName: "error.json",
        payload: {
          error: error instanceof Error ? error.message : String(error)
        }
      });
      return this.store.finalizeTaskRun({
        taskRunId,
        status: "failed",
        resultSummary: null,
        errorSummary: error instanceof Error ? error.message : String(error),
        exitCode: null,
        artifacts: [
          {
            type: "json",
            label: "error",
            path: artifact.path,
            mime_type: "application/json",
            size_bytes: artifact.sizeBytes,
            metadata: {
              file_name: "error.json"
            }
          }
        ],
        actorType: "worker",
        actorId: "dispatch-worker"
      });
    } finally {
      this.activeRuns.delete(taskRunId);
    }
  }
}

function summarize(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 280 ? `${trimmed.slice(0, 277)}...` : trimmed;
}
