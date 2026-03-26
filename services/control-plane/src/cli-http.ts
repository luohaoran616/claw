import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { ArtifactWriter } from "./artifacts/store.js";
import { createPool } from "./db/connection.js";
import { runMigrations } from "./db/migrations.js";
import { ControlPlaneStore } from "./db/store.js";
import { createHttpApp } from "./http/app.js";
import { OpenClawCliExecutor } from "./worker/executor.js";
import { DispatchWorker } from "./worker/dispatch-worker.js";

const logger = createLogger("control-plane-http");

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  await runMigrations(pool);

  const store = new ControlPlaneStore(pool);
  const artifacts = new ArtifactWriter(config.artifactRoot);
  const worker = new DispatchWorker(
    store,
    new OpenClawCliExecutor(config),
    artifacts,
    logger,
    config.pollIntervalMs
  );
  const app = createHttpApp({
    config,
    store,
    worker
  });

  worker.start();
  await app.listen({
    host: config.host,
    port: config.port
  });
  logger.info({ host: config.host, port: config.port }, "control plane http listening");

  const shutdown = async () => {
    logger.info("shutting down control plane");
    await worker.stop();
    await app.close();
    await pool.end();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((error) => {
  logger.error({ err: error }, "failed to start control plane");
  process.exit(1);
});
