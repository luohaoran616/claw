import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Pool, PoolClient } from "pg";

type DbLike = Pool | PoolClient;

function getMigrationsDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "../../migrations");
}

export async function runMigrations(db: DbLike): Promise<void> {
  const schemaTable = await db.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'schema_migrations'
    `
  );
  if (!schemaTable.rowCount) {
    await db.query(`
      CREATE TABLE schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ
      )
    `);
  }

  const migrationsDir = getMigrationsDir();
  const entries = await fs.readdir(migrationsDir);
  const sqlFiles = entries.filter((entry) => entry.endsWith(".sql")).sort();

  for (const fileName of sqlFiles) {
    const existing = await db.query<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [fileName]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, fileName), "utf8");
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations(version, applied_at) VALUES ($1, NOW())", [
        fileName
      ]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
}
