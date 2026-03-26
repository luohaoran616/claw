import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";

import type { ControlPlaneConfig } from "../config.js";
import { ConflictError, NotFoundError } from "../errors.js";
import { PolicyError } from "../policy.js";
import {
  approvalDecisionSchema,
  createHandoffSchema,
  listHandoffsQuerySchema,
  reportTaskRunSchema
} from "../types.js";
import type { ControlPlaneStore } from "../db/store.js";
import type { DispatchWorker } from "../worker/dispatch-worker.js";

interface CreateHttpAppOptions {
  config: ControlPlaneConfig;
  store: ControlPlaneStore;
  worker: DispatchWorker;
}

export function createHttpApp(options: CreateHttpAppOptions): FastifyInstance {
  const app = Fastify({
    logger: true
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/")) {
      return;
    }
    const header = request.headers.authorization;
    if (header !== `Bearer ${options.config.token}`) {
      reply.code(401).send({
        error: "unauthorized"
      });
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode =
      error instanceof ZodError
        ? 400
        : error instanceof PolicyError
          ? 400
          : error instanceof ConflictError
            ? 409
            : error instanceof NotFoundError
              ? 404
              : 500;

    reply.code(statusCode).send({
      error: error instanceof Error ? error.message : String(error)
    });
  });

  app.get("/healthz", async () => {
    return {
      ok: true
    };
  });

  app.post("/api/handoffs", async (request) => {
    const input = createHandoffSchema.parse(request.body);
    const handoff = await options.store.createHandoff(input);
    return {
      id: handoff.id,
      status: handoff.status
    };
  });

  app.get("/api/handoffs", async (request) => {
    const query = listHandoffsQuerySchema.parse(request.query);
    const handoffs = await options.store.listHandoffs(query);
    return {
      items: handoffs
    };
  });

  app.get("/api/handoffs/:id", async (request) => {
    const params = request.params as { id: string };
    return options.store.getHandoffDetails(params.id);
  });

  app.post("/api/handoffs/:id/approve", async (request) => {
    const params = request.params as { id: string };
    const input = approvalDecisionSchema.parse(request.body);
    const handoff = await options.store.approveHandoff(params.id, input);
    return {
      id: handoff.id,
      status: handoff.status
    };
  });

  app.post("/api/handoffs/:id/reject", async (request) => {
    const params = request.params as { id: string };
    const input = approvalDecisionSchema.parse(request.body);
    const handoff = await options.store.rejectHandoff(params.id, input);
    return {
      id: handoff.id,
      status: handoff.status
    };
  });

  app.post("/api/handoffs/:id/dispatch", async (request) => {
    const params = request.params as { id: string };
    const result = await options.worker.startHandoff(params.id);
    return {
      task_run_id: result.taskRunId,
      status: result.status
    };
  });

  app.post("/api/task-runs/:id/report", async (request) => {
    const params = request.params as { id: string };
    const input = reportTaskRunSchema.parse(request.body);
    const handoff = await options.store.reportTaskRun(params.id, input);
    return {
      id: handoff.id,
      status: handoff.status
    };
  });

  app.post("/api/task-runs/:id/cancel", async (request) => {
    const params = request.params as { id: string };
    const handoff = await options.worker.cancel(params.id);
    return {
      id: handoff.id,
      status: handoff.status
    };
  });

  return app;
}
