import { loadConfig } from "../src/config.js";
import { createPool } from "../src/db/connection.js";
import { runMigrations } from "../src/db/migrations.js";
import { ControlPlaneStore } from "../src/db/store.js";

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  try {
    await runMigrations(pool);
    const store = new ControlPlaneStore(pool);
    const handoff = await store.createHandoff({
      requester_agent: "supervisor",
      target_agent: "researcher",
      priority: "normal",
      summary: "postgres smoke test",
      reason: "verify control-plane persistence path",
      expected_tools: ["docs_read"],
      write_scope: [],
      budget: {
        max_runtime_sec: 600,
        max_cost_usd: 0.5
      },
      rollback_hint: "none"
    });
    const rejected = await store.rejectHandoff(handoff.id, {
      approver_id: "smoke-test",
      comment: "cleanup"
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          handoff_id: handoff.id,
          final_status: rejected.status
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exit(1);
});
