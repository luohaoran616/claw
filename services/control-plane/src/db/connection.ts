import { Pool } from "pg";

import { ControlPlaneConfig } from "../config.js";

export function createPool(config: ControlPlaneConfig): Pool {
  return new Pool({
    connectionString: config.databaseUrl
  });
}
