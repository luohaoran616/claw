import { loadConfig } from "./config.js";
import { ControlPlaneHttpClient } from "./mcp/client.js";
import { startMcpServer } from "./mcp/server.js";

async function main() {
  const config = loadConfig();
  if (!config.mcpRole) {
    throw new Error("CONTROL_PLANE_MCP_ROLE must be set to supervisor, researcher, or builder");
  }

  const client = new ControlPlaneHttpClient(config.baseUrl, config.token);
  await startMcpServer(config.mcpRole, client);
  console.error(JSON.stringify({ event: "control-plane-mcp-started", role: config.mcpRole }));
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      event: "control-plane-mcp-failed",
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exit(1);
});
