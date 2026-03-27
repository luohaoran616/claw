# Ops Quickstart

This folder is the GitOps control plane for multi-host OpenClaw deployment.

## Files

- `versions.lock.example`: release lock template (commit pinning)
- `final-multi-agent-production-plan.md`: target production architecture for final multi-agent Feishu + OpenClaw rollout
- `control-plane-api-draft.md`: first draft of the approval-gated inter-agent coordination API
- `raspi-feishu-multi-agent-runbook.md`: Raspberry Pi execution runbook for one-gateway multi-agent Feishu rollout
- `control-plane.env.example`: environment template for the V1 control-plane service
- `openclaw-control-plane.service`: user-level systemd unit for Raspberry Pi deployment
- `openclaw-control-plane-openclaw-snippet.md`: OpenClaw MCP wiring guidance for `supervisor`, `researcher`, and `builder`
- `supervisor-first-orchestration-prompt.md`: prompt-pack snippet for a verification-capable `supervisor`

## Suggested next files (create when implementing Ansible)

- `inventory.ini`
- `site.yml`
- `group_vars/openclaw_nodes.yml`
- `roles/openclaw_sync/tasks/main.yml`

## Recommended flow

1. Develop in source repos on Windows.
2. Push commits to fork branches.
3. Update `versions.lock` (copied from template) with target commits.
4. Run `ansible-playbook` from cloud control plane to apply on desktop + raspberry pi.
5. Verify with `openclaw gateway status --json` / `openclaw node list`.
