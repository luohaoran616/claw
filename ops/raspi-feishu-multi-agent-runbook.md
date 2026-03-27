# Raspberry Pi Feishu Multi-Agent Runbook

## Goal

Use the existing Raspberry Pi OpenClaw gateway as the single production gateway, then add:

- multiple Feishu bot accounts
- multiple isolated agents
- deterministic account-to-agent routing

This runbook is designed so you can hand it to the Raspberry Pi OpenClaw and let it execute the OpenClaw-side work while guiding you through the Feishu console steps.

## Target Topology

### Production v1

- one Raspberry Pi gateway
- one OpenClaw service: `openclaw-gateway`
- three Feishu apps:
  - `supervisor`
  - `researcher`
  - `builder`
- three OpenClaw agents:
  - `main` as the supervisor agent
  - `researcher`
  - `builder`

### Why keep `main` as supervisor in v1

Keep the existing `main` agent as the supervisor instead of renaming it immediately.

Benefits:

- preserves current workspace and memory behavior
- avoids session-id migration surprises
- reduces rollout risk on the live Raspberry Pi host

You can rename the visible bot persona later without changing the internal `agentId`.

## Current Host Assumptions

These match the current project memory and should be verified before changes:

- host: `192.168.0.142`
- user: `luo`
- OpenClaw repo: `/home/luo/apps/openclaw`
- QMD repo: `/home/luo/apps/qmd`
- OpenClaw config: `/home/luo/.openclaw/openclaw.json`
- current service: `systemctl --user openclaw-gateway`

If the live config uses a layered file pattern such as `openclaw.base.json` + `openclaw.json`, apply the same routing/account sections to the active source of truth and keep the overlay structure intact.

## Inputs You Must Prepare

Before asking the Raspberry Pi OpenClaw to execute, prepare:

1. Three Feishu apps on the Open Platform:
   - one for supervisor
   - one for researcher
   - one for builder
2. For each app:
   - `App ID`
   - `App Secret`
   - bot display name
3. Optional early rollout choices:
   - whether DMs use `pairing` or `allowlist`
   - whether group chats stay disabled initially
4. Optional group rollout data for phase 2:
   - group `chat_id` values (`oc_xxx`)
   - approved sender `open_id` values (`ou_xxx`)

## Feishu Console Steps You Must Do

The Raspberry Pi OpenClaw can guide you, but these are still platform-console actions.

For each of the three Feishu apps:

1. Open Feishu Open Platform and create an enterprise app.
2. Copy the `App ID` and `App Secret`.
3. Enable bot capability and set the bot name.
4. Import the required permission block from the OpenClaw Feishu docs.
5. In event subscription, choose long connection / WebSocket.
6. Add event `im.message.receive_v1`.
7. Publish the app.

Official references:

- Feishu quickstart and app creation: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L29)
- Permission import block: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L97)
- Long connection event subscription: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L140)

## OpenClaw-Side Rollout Phases

### Phase 0: Backup and Health Check

The Raspberry Pi OpenClaw should do this first:

1. Create a timestamped backup directory under `/home/luo/.openclaw/backups/`.
2. Back up:
   - `/home/luo/.openclaw/openclaw.json`
   - `/home/luo/.openclaw/openclaw.base.json` if present
   - `~/.config/systemd/user/openclaw-gateway.service` if present
3. Run:
   - `openclaw gateway status --deep`
   - `openclaw agents list --bindings`
   - `openclaw channels status --probe`
   - `journalctl --user -u openclaw-gateway -n 200 --no-pager`
4. Record the current state before making edits.

### Phase 1: Prepare Agent Workspaces

Keep the existing main workspace for supervisor behavior.

Create:

- `/home/luo/.openclaw/workspace-researcher`
- `/home/luo/.openclaw/workspace-builder`
- `/home/luo/.openclaw/agents/researcher/agent`
- `/home/luo/.openclaw/agents/builder/agent`

Bootstrap each new workspace with minimal files:

- `AGENTS.md`
- `SOUL.md`
- optional `USER.md`

Recommended role intent:

- `main`:
  - supervisor
  - intake, approvals, summaries
- `researcher`:
  - retrieval, reading, evidence collection
- `builder`:
  - code, shell, repair, packaging

Supervisor-first prompt note:

- seed the `main` agent's `SOUL.md` or `AGENTS.md` with the snippet from `ops/supervisor-first-orchestration-prompt.md`
- keep `researcher` and `builder` prompt packs specialist-specific and cheaper to run

Practical note for the current Raspberry Pi host:

- if Docker is not installed, do not enable per-agent Docker sandboxing in v1
- use `sandbox.mode: "off"` first
- keep isolation primarily through:
  - separate workspace
  - separate `agentDir`
  - tool allow/deny policy

### Phase 2: Patch OpenClaw Config

Update the active config to include:

- `channels.feishu.accounts`
- `channels.feishu.defaultAccount`
- `agents.list`
- `bindings`
- per-agent tool restrictions
- initial safe group policy

Important v1 safety choices:

- keep `groupPolicy: "disabled"` until DM verification passes
- keep `tools.agentToAgent.enabled: false` until an external approval control plane exists
- use `dmPolicy: "pairing"` for the first bring-up unless you already have final `open_id` allowlists
- if non-main agents should reuse the same model auth as `main`, copy `main` agent `auth-profiles.json` into their `agentDir`

## Recommended v1 Config Shape

Use this as the configuration target and adapt it to the live file instead of blindly replacing the whole file.

```json5
{
  tools: {
    agentToAgent: {
      enabled: false
    }
  },

  agents: {
    list: [
      {
        id: "main",
        default: true,
        workspace: "/home/luo/.openclaw/workspace",
        agentDir: "/home/luo/.openclaw/agents/main/agent",
        model: "github-copilot/gpt-5.3-codex",
        tools: {
          profile: "minimal",
          allow: [
            "message",
            "session_status",
            "sessions_list",
            "sessions_history",
            "agents_list",
            "memory_search",
            "memory_get",
            "memory_expand",
            "read",
            "group:web"
          ],
          deny: [
            "sessions_send",
            "sessions_spawn",
            "sessions_yield",
            "subagents",
            "exec",
            "process",
            "write",
            "edit",
            "apply_patch",
            "gateway",
            "browser",
            "canvas",
            "cron"
          ]
        }
      },
      {
        id: "researcher",
        workspace: "/home/luo/.openclaw/workspace-researcher",
        agentDir: "/home/luo/.openclaw/agents/researcher/agent",
        sandbox: {
          mode: "off"
        },
        model: "github-copilot/gpt-5.4-mini",
        tools: {
          profile: "minimal",
          allow: [
            "message",
            "session_status",
            "group:web",
            "read",
            "sessions_list",
            "sessions_history",
            "memory_search",
            "memory_get",
            "memory_expand"
          ],
          deny: [
            "sessions_send",
            "sessions_spawn",
            "sessions_yield",
            "subagents",
            "exec",
            "process",
            "write",
            "edit",
            "apply_patch",
            "gateway",
            "browser",
            "canvas",
            "cron"
          ]
        }
      },
      {
        id: "builder",
        workspace: "/home/luo/.openclaw/workspace-builder",
        agentDir: "/home/luo/.openclaw/agents/builder/agent",
        sandbox: {
          mode: "off"
        },
        model: "github-copilot/gpt-5.4-mini",
        tools: {
          profile: "coding",
          deny: [
            "sessions_send",
            "sessions_spawn",
            "sessions_yield",
            "subagents",
            "browser",
            "canvas",
            "cron"
          ]
        }
      }
    ]
  },

  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        accountId: "supervisor"
      }
    },
    {
      agentId: "researcher",
      match: {
        channel: "feishu",
        accountId: "researcher"
      }
    },
    {
      agentId: "builder",
      match: {
        channel: "feishu",
        accountId: "builder"
      }
    }
  ],

  channels: {
    feishu: {
      enabled: true,
      defaultAccount: "supervisor",
      dmPolicy: "pairing",
      groupPolicy: "disabled",
      streaming: true,
      blockStreaming: true,
      accounts: {
        supervisor: {
          appId: "cli_replace_supervisor",
          appSecret: "replace_supervisor_secret",
          botName: "OpenClaw Supervisor"
        },
        researcher: {
          appId: "cli_replace_researcher",
          appSecret: "replace_researcher_secret",
          botName: "OpenClaw Researcher"
        },
        builder: {
          appId: "cli_replace_builder",
          appSecret: "replace_builder_secret",
          botName: "OpenClaw Builder"
        }
      }
    }
  }
}
```

Model note:

- this v1 implements the adaptive-supervisor idea as a stronger default model for `main` plus cheaper defaults for `researcher` and `builder`
- OpenClaw config does not currently give you policy-based automatic model escalation inside one agent, so treat this as the practical first step

Supervisor verification note:

- the safe v1 supervisor surface is intentionally read-heavy and mutation-light
- if host-level verification would require shell, restart, or config mutation, prefer a bounded `builder` handoff instead of widening supervisor into a full executor

References:

- Multi-agent in one gateway: [multi-agent.md](d:/lhr/app/openclaw/docs/concepts/multi-agent.md#L10)
- Feishu multiple accounts: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L486)
- Feishu bindings: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L606)
- Binding precedence: [configuration-reference.md](d:/lhr/app/openclaw/docs/gateway/configuration-reference.md#L1438)
- Per-agent access profiles: [configuration-reference.md](d:/lhr/app/openclaw/docs/gateway/configuration-reference.md#L1460)
- Tool profile groups: [configuration-reference.md](d:/lhr/app/openclaw/docs/gateway/configuration-reference.md#L1779)

## Phase 3: Restart and Verify

After config changes:

1. Restart the user service:
   - `systemctl --user restart openclaw-gateway`
2. Verify:
   - `openclaw gateway status --deep`
   - `openclaw agents list --bindings`
   - `openclaw channels status --probe`
   - `journalctl --user -u openclaw-gateway -n 200 --no-pager`

Expected outcomes:

- gateway is active
- all three Feishu accounts probe cleanly
- all three bindings are visible
- no auth or route registration error in logs

## Phase 4: DM Acceptance

Test in this order:

1. DM the supervisor bot.
2. DM the researcher bot.
3. DM the builder bot.

If using `pairing`:

- run `openclaw pairing list feishu`
- approve pending requests with `openclaw pairing approve feishu <CODE>`

If using `allowlist`:

- collect `open_id` values from logs or `pairing list`
- patch `channels.feishu.allowFrom`

References:

- DM policy and pairing: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L301)
- Get user IDs: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L411)

## Phase 5: Group Rollout

Do not enable groups before DM routing is stable.

Recommended rollout:

1. Switch `groupPolicy` from `disabled` to `allowlist`.
2. Add only one test group at first via `groupAllowFrom`.
3. Keep `requireMention: true`.
4. If needed, add sender allowlists under `groups.<chat_id>.allowFrom`.

Example:

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_test_group"],
      groups: {
        oc_test_group: {
          requireMention: true,
          allowFrom: ["ou_primary_user"]
        }
      }
    }
  }
}
```

References:

- Group policy: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L315)
- Group config examples: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L330)
- Get group IDs: [feishu.md](d:/lhr/app/openclaw/docs/channels/feishu.md#L396)

## What This Runbook Deliberately Does Not Do Yet

This runbook focuses on bringing Feishu multi-bot routing online safely.

It does not yet:

- deploy the external approval control plane
- enable automatic cross-agent delegation
- migrate secrets into a dedicated OpenClaw secret-ref workflow
- migrate the current `main` agent to a new internal id such as `supervisor`

Those should come after the bots are live and DM/group routing is stable.

## Acceptance Checklist

The rollout is acceptable when all of these are true:

1. `openclaw gateway status --deep` is healthy.
2. `openclaw channels status --probe` shows Feishu account probes healthy.
3. `openclaw agents list --bindings` shows three routed agents.
4. Each bot can receive and reply in DM.
5. `main` continues to preserve current memory/session behavior.
6. `researcher` and `builder` create their own sessions under their own agent stores.
7. Group chats remain disabled or allowlisted until explicitly verified.

## Rollback

If the rollout breaks the live bot:

1. Stop editing and restore the config backup.
2. Restart:
   - `systemctl --user restart openclaw-gateway`
3. Verify:
   - `openclaw gateway status --deep`
   - `journalctl --user -u openclaw-gateway -n 200 --no-pager`

Because v1 keeps `main` as the default agent, rollback should be straightforward if the backup was taken first.

## Copy-Paste Prompt For Raspberry Pi OpenClaw


```text
You are the Raspberry Pi OpenClaw operations agent. Execute carefully and give me a short progress update after each phase.

Goal:
- enable 3 Feishu bot accounts on the current single gateway
- keep the existing `main` agent as the supervisor
- add `researcher` and `builder`
- route with `accountId -> agentId` bindings
- do not enable automatic agent-to-agent collaboration
- keep `groupPolicy` disabled at first and verify DMs only

Host constraints:
- user: `luo`
- OpenClaw repo: `/home/luo/apps/openclaw`
- config file: `/home/luo/.openclaw/openclaw.json`
- service: `systemctl --user openclaw-gateway`

Execution rules:
1. Back up first, then run health checks, then edit config.
2. Do not replace the whole `openclaw.json`; make the smallest safe patch.
3. If the live setup uses `openclaw.base.json` or another layered config source, stop and tell me before continuing.
4. If you need missing information from me, ask only the minimum necessary question.
5. After each phase, verify and report the result.
6. Do not enable group chats unless I explicitly approve.
7. Do not enable `agentToAgent` unless I explicitly approve.

Required phases for this run:
- Phase 0: back up current config and service state
- Phase 1: create `researcher` / `builder` workspaces and agent dirs
- Phase 2: patch `agents.list`, `channels.feishu.accounts`, `bindings`, and per-agent tools according to the runbook
- Phase 3: restart `openclaw-gateway` and verify
- Phase 4: help me verify DM behavior for all 3 Feishu bots

Reference:
- if the runbook file exists locally, read it first
- if it does not exist locally, follow the requirements in this message directly

I will provide 3 credential pairs:
- supervisor: <APP_ID：cli_a94f3b5a02f89bd9> <APP_SECRET：xiYqXUnfsUTLRuOqolcjlgYCdsdGRpku>
- researcher: <APP_ID：cli_a94f35135178dbde> <APP_SECRET：uhsClDIlubzfXYBBGG64ChLWmQOSYooN>
- builder: <APP_ID：cli_a94f359b93f8dbcb> <APP_SECRET：VXBCuh4mUseRWOG9BA8LphosQugfCrtS>

Start with Phase 0.
```
