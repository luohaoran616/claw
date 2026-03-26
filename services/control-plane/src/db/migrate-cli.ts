import { loadConfig } from "../config.js";
import { createLogger } from "../logger.js";
import { createPool } from "./connection.js";
import { runMigrations } from "./migrations.js";

const logger = createLogger("control-plane-migrate");

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  try {
    await runMigrations(pool);
    logger.info({ databaseUrl: config.databaseUrl }, "migrations complete");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "migration failed");
  process.exit(1);
});
