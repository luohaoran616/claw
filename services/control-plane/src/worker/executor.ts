import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";

import type { ControlPlaneConfig } from "../config.js";
import type { AgentName, DispatchExecutionHandle, DispatchExecutor, TaskExecutionResult } from "../types.js";
import { extractFinalText, parseJsonOutput } from "./final-text.js";

export class OpenClawCliExecutor implements DispatchExecutor {
  constructor(private readonly config: ControlPlaneConfig) {}

  startDispatch(args: {
    targetAgent: AgentName;
    prompt: string;
    maxRuntimeSec: number;
  }): DispatchExecutionHandle {
    const timeoutSec = args.maxRuntimeSec + this.config.dispatchGraceSec;
    const command = [
      this.config.openclawNode,
      this.config.openclawScript,
      "agent",
      "--agent",
      args.targetAgent,
      "--message",
      args.prompt,
      "--json",
      "--timeout",
      String(timeoutSec)
    ];

    const child: ChildProcessByStdio<null, Readable, Readable> = spawn(
      command[0]!,
      command.slice(1),
      {
      stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutSec * 1000);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    const wait = async (): Promise<TaskExecutionResult> =>
      new Promise((resolve, reject) => {
        child.on("error", (error: Error) => {
          clearTimeout(timer);
          reject(error);
        });

        child.on("close", (exitCode: number | null) => {
          clearTimeout(timer);
          const rawOutput = parseJsonOutput(stdout);
          resolve({
            stdout,
            stderr,
            exitCode,
            timedOut,
            rawOutput,
            finalText: extractFinalText(rawOutput)
          });
        });
      });

    return {
      command,
      wait,
      cancel() {
        timedOut = true;
        child.kill("SIGTERM");
      }
    };
  }
}
