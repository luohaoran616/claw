CREATE TABLE agents (
  agent_id TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_runtime_sec INTEGER NOT NULL,
  max_cost_usd NUMERIC(10,2) NOT NULL,
  requires_write_scope BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE handoff_requests (
  id TEXT PRIMARY KEY,
  requester_agent TEXT NOT NULL REFERENCES agents(agent_id),
  target_agent TEXT NOT NULL REFERENCES agents(agent_id),
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  expected_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  write_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget JSONB NOT NULL,
  rollback_hint TEXT NOT NULL,
  source_channel JSONB,
  request_depth INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  result_summary TEXT,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  handoff_request_id TEXT NOT NULL REFERENCES handoff_requests(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  approver_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_runs (
  id TEXT PRIMARY KEY,
  handoff_request_id TEXT NOT NULL REFERENCES handoff_requests(id) ON DELETE CASCADE,
  agent TEXT NOT NULL REFERENCES agents(agent_id),
  status TEXT NOT NULL,
  command JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  result_summary TEXT,
  exit_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  handoff_request_id TEXT NOT NULL REFERENCES handoff_requests(id) ON DELETE CASCADE,
  task_run_id TEXT REFERENCES task_runs(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  handoff_request_id TEXT NOT NULL REFERENCES handoff_requests(id) ON DELETE CASCADE,
  task_run_id TEXT REFERENCES task_runs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handoff_requests_status_created_at
  ON handoff_requests(status, created_at DESC);

CREATE INDEX idx_task_runs_handoff_request_id
  ON task_runs(handoff_request_id);

CREATE INDEX idx_artifacts_handoff_request_id
  ON artifacts(handoff_request_id);

CREATE INDEX idx_audit_events_handoff_request_id
  ON audit_events(handoff_request_id, created_at DESC);

INSERT INTO agents (agent_id, max_runtime_sec, max_cost_usd, requires_write_scope)
VALUES
  ('supervisor', 900, 1.50, FALSE),
  ('researcher', 600, 0.50, FALSE),
  ('builder', 900, 1.50, TRUE)
ON CONFLICT (agent_id) DO UPDATE SET
  max_runtime_sec = EXCLUDED.max_runtime_sec,
  max_cost_usd = EXCLUDED.max_cost_usd,
  requires_write_scope = EXCLUDED.requires_write_scope,
  updated_at = NOW();
