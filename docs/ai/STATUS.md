# STATUS

Current goal: `D:\lhr\Projects\202603\claw` 建成 OpenClaw/QMD 的长期维护工作区

## Done

1. 本地 `qmd` 已完Memory Recall V1.6 相关改动，并推送到 `fork/feature/memory-recall-v1.6`2. 本地 `openclaw` 已完`memory_expand` / anchor-first recall / runtime 注册链改动，并推送到 `fork/feature/memory-recall-v1.6`3. 现有源码主位置已明确   - `D:\lhr\Projects\202603\qmd`
  - `D:\lhr\app\openclaw`
2. 云服务器记忆系统已做过一次对齐；已知还需要继续完成一次云rebuild/restart 验证5. `2026-03-25` 本地分支核查完成   - `openclaw`: `feature/memory-recall-v1.6` @ `4ed6a2c95c`，跟`fork/feature/memory-recall-v1.6`，`ahead/behind = 0/0`
  - `qmd`: `feature/memory-recall-v1.6` @ `3f7b276`，跟`fork/feature/memory-recall-v1.6`，`ahead/behind = 0/0`
  - 两边 `main` 都与 `fork/main` 同步（`ahead/behind = 0/0`   - 本地存在未跟踪文件（OpenClaw 以旧 `node_modules/dist` 备份目录为主，qmd `else/openclaw2.json` 与评估脚本）
3. 已完成“多机协同”运维方案设计并落地runbook   - 新增 `docs/ai/RUNBOOK.md` Multi-Host 章节（推荐拓扑：台式机主 Gateway + 树莓Node + Windows remote client + 云端仅穿控制面）
  - 明确 GitOps + Ansible 的统一发布路径与健康检查命7. 新增 `ops/` 最小模板：
  - `ops/versions.lock.example`（OpenClaw/QMD 提交锁定   - `ops/README.md`（后Ansible 落地路径8. `2026-03-25` 架构偏好已明确：
  - Windows 本机作为Gateway（OpenClaw + qmd）用于快速开发验   - 树莓派与台式机优先作Node 执行   - Ubuntu 云服务器仅承`frp` 穿透与运维控制面，不再部署 OpenClaw 业务
4. 飞书接入约束已确认：Gateway 需保持长期运行（官Feishu 文档为长连接模式，故障排查也要求先检`openclaw gateway status`）10. 架构评估更新：`树莓派主 Gateway + Windows/台式Remote(+Node)` 可行，且能显著减少“多Gateway”同步复杂度；但 Node 端仍需做最小版配置同步与配对管理11. 操作面决策补充：采用 `Windows OpenSSH -> 树莓ssh/tmux` 作为日常远程操控方案；tmux 仅需部署在树莓派侧12. 已确认用户所`tmux` 为官方仓`github.com/tmux/tmux`；其定位是终端复用器，适合在树莓派侧常驻会话，Windows 通过 SSH 连接使用13. 已在树莓`192.168.0.142` 完成 Clash 部署（`mihomo + metacubexd + systemd`）：
  - 服务：`clash.service`（`enabled + active`   - 端口：`7890` / `9090` / `1053`
  - UI：`http://192.168.0.142:9090/ui/`
  - 配置：`/home/luo/.config/clash/config.yaml`
5. 已排障并修复 Clash `TUN operation not permitted`   - 原因：配置中 `tun.enable: true`，以普通用户运行服务时无权限创TUN
  - 处理：将 `tun.enable` 改为 `false` 并重`clash.service`
  - 验证：TUN 报错消失，`curl -x http://127.0.0.1:7890 https://www.google.com` 可通并有命中日15. 已在树莓派完tmux 源码编译安装（优先方案）   - 源码来源：`github.com/tmux/tmux`，tag `3.6a`
  - 安装结果：`/usr/local/bin/tmux`，版`tmux 3.6a`
  - 自检：可创建/列出/销毁测试会话（`tmux -L codex-check ...`16. Clash TUN 模式已成功开启并验证   - `luo` 本就具备管理员权限（`sudo` + 免密 sudo），无需额外提权
  - `clash.service` 增加 `AmbientCapabilities/CapabilityBoundingSet = CAP_NET_ADMIN CAP_NET_RAW`
  - `tun.enable` 改回 `true` 并重启后，日志出`Tun adapter listening at: Meta(...)`
  - `ip -br link` 可见 `Meta` 接口，`ip rule` 出现 TUN 路由规则
  - 无代理参`curl https://www.google.com` 也能命中日志：`198.18.0.1 -> ... using PROXY`

## Open Problems / Risks

1. 云服务器 SSH 曾出`banner exchange timeout`，需要先保证远端稳定再继续收尾2. 云端 `memory.qmd.scope` 是否保持DM，还需要结合实际渠道策略再定3. 远端如果只同步插件入口、不同步 runtime/tool 工厂，会再次出现 `createMemoryExpandTool is not a function`4. 若把源码目录整体打包/同步到云端，OpenClaw 本地未跟踪的大目录可能导致传输慢、磁盘占用和重建耗时上升5. 若继续维持“多Gateway（每机都跑完OpenClaw）”，运维复杂度会明显高于“单Gateway + Node”6. Windows Gateway 方案在“本机断离线”时会影响全部会话入口，需要后续设计热备切换流程7. 若飞书机器人要求稳定 24x7 可用，不宜只依赖 Windows 主机单点在线8. 若把二开主战场迁到树莓派，构测试速度可能明显慢于 x86（尤qmd 索引与前端构建），需要权衡开发效率9. 若只靠家庭局域网地址管理树莓派，IP 漂移和网络抖动会影响远程运维稳定性（需 DHCP 保留 + SSH key + systemd 常驻）10. Clash 当前仍是占位代理参数与临`secret`，未替换为真实凭据前仅算基础安装完成11. Clash 配置曾被 Web UI 改动（出`tun` 段），后续需明确哪些项允UI 改写、哪些项必须由文件模板管理12. 开TUN 后，若未来替systemd 文件或重装系统，需同步恢复 `clash.service.d/capabilities.conf`，否则会再次`operation not permitted`

## Next Actions

1. 以这`claw` 目录为入口，维护 OpenClaw/QMD 的长期分支、云端对齐、发布和回滚记录2. 确认网络层选型：`Tailscale`（优先）`frp`（云做穿透中继），并在云端完成最小可用链路3. runbook 先落地单Gateway + 树莓Node 形态，再决定是否保留第Gateway 作为备份4. `ops/versions.lock.example` 复制`ops/versions.lock`，填入实际发布提交并开Ansible 化5. 发布脚本或同步策略排除本地未跟踪缓存/备份目录，避免把无关大文件传到远端6. 评估是否把两feature 分支合并回各`main`，并按稳定节奏推PR fork 主线7. 设计 Windows Gateway 的备切换方案（台式机二级 Gateway 或冷备）8. 明确飞书生产入口部署位（Windows 常驻 / 台式机常/ 树莓派常驻）并完成演练9. 明确“开发位”与“生产位”是否同机：若生产在树莓派，建议保留 Windows 开发并通过 GitOps 发布到树莓派，而非全部开发迁移到树莓派10. 在树莓派重装后，先完SSH/tmux/systemd 基础设施，再开OpenClaw 安装，避免后续手工运维成本反复增加11. Clash 配置中的 `server/port/username/password/secret` 替换为真实值并重启，随后再开OpenClaw 安装流程12. 基于当前网络tmux 基础设施，继续推进树莓派 OpenClaw Gateway 安装13. 在继OpenClaw 安装前，Clash 当前有效配置service drop-in 备份到版本化目录

## Key Pointers

- Local qmd repo: `D:\lhr\Projects\202603\qmd`
- Local openclaw repo: `D:\lhr\app\openclaw`
- Skill file: `C:\Users\lhr\.codex\skills\openclaw-ops-windows\SKILL.md`
- Remote backups:
  - `/root/backups/openclaw-memory-align-20260324T181825Z`
  - `/root/backups/openclaw-memory-runtime-fix-20260324T185920Z`

## 2026-03-25 Raspberry Pi Source Deployment Baseline (OpenClaw + QMD)

- Target host: `192.168.0.142` (`luo`, Debian 13, aarch64).
- OpenClaw repo: `/home/luo/apps/openclaw`
  - Branch: `feature/memory-recall-v1.6`
  - Locked commit: `4ed6a2c95cbe9961b77255537f66c0ecb4c03855`
- QMD repo: `/home/luo/apps/qmd`
  - Branch: `feature/memory-recall-v1.6`
  - Locked commit: `3f7b276f26529b579ba5174923fcbe2e581e471c`
- Remote mapping (both repos): `fork` = personal repo, `origin` = upstream official.
- Runtime service:
  - Unit: `/etc/systemd/system/openclaw-gateway.service`
  - Status: `enabled` + `active`
  - ExecStart: `/usr/bin/node /home/luo/apps/openclaw/openclaw.mjs gateway --port 18789 --bind lan`
  - Config path: `/home/luo/.openclaw/openclaw.json`
- LAN probe from Windows: `curl -I http://192.168.0.142:18789/` => `HTTP/1.1 200 OK`.
- Regression check: no `createMemoryExpandTool is not a function` in service logs.

### Notes / Deviations

- To make QMD command execution stable under gateway spawn semantics, memory command uses:
  - `/home/luo/.local/bin/qmd-openclaw-runner`
  - runner content: `exec /usr/bin/node /home/luo/apps/qmd/qmd-openclaw.mjs "$@"`
- QMD native addon (`better-sqlite3`) required explicit build-approval/rebuild during install recovery.
- `qmd update` works; `qmd embed` and default `qmd query` currently fail with remote provider `401 Invalid token` until real secrets are injected.

### Verified Commands

- `systemctl is-active openclaw-gateway` => `active`
- `node /home/luo/apps/openclaw/openclaw.mjs plugins inspect memory-core` => loaded, tools include `memory_search/memory_get/memory_expand`
- `node /home/luo/apps/qmd/qmd-openclaw.mjs status` => OK
- `qmd query --no-rerank --json $'lex: memory'` => JSON output OK (without remote rerank)

## 2026-03-25 Key Injection + Acceptance (SiliconFlow)

- Secret injection completed on Raspberry Pi:
  - secret file: `/home/luo/.openclaw/secrets.env` (mode `600`, owner `luo`)
  - variable injected: `SILICONFLOW_API_KEY` (value not recorded in repo/docs)
- Gateway service now loads secret env:
  - `/etc/systemd/system/openclaw-gateway.service`
  - added: `EnvironmentFile=-/home/luo/.openclaw/secrets.env`
- Service restarted and remains healthy: `openclaw-gateway` = `active`.

### Acceptance Results (after key injection)

- `qmd status` => `0`
- `qmd update` => `0`
- `qmd embed` => `0` (remote embedding call succeeded)
- `qmd query "memory"` (default hybrid with expansion+rerank) => `0`
- `qmd query --no-rerank --json $'lex: memory'` => `0`
- `openclaw plugins inspect memory-core` => `0`
- `openclaw gateway status --deep` => `0`
- Since latest service restart, no qmd startup/runtime failure logs and no regression string `createMemoryExpandTool is not a function`.

## 2026-03-25 Control UI LAN Login Fix (Origin + Device Identity)

- Symptom reported from Windows `192.168.0.152`:
  - `origin not allowed (...)`
  - then `control ui requires device identity (use HTTPS or localhost secure context)`
- Applied config updates on Raspberry Pi (`/home/luo/.openclaw/openclaw.base.json` + `openclaw.json`):
  - `gateway.controlUi.allowedOrigins` includes:
    - `http://192.168.0.142:18789`
    - `http://192.168.0.152:18789`
    - `http://192.168.0.152`
    - `https://192.168.0.152`
    - plus localhost defaults
  - `gateway.controlUi.allowInsecureAuth = true`
  - `gateway.controlUi.dangerouslyDisableDeviceAuth = true`
- Restarted service: `openclaw-gateway` active.
- Result: startup healthy; security warning expected for dangerous flags.

Note: this is a break-glass LAN HTTP setup. For hardened production, migrate to HTTPS/Tailscale and remove dangerous flags.

## 2026-03-26 XRDP Troubleshooting (Raspberry Pi 192.168.0.142)

- Symptom: Windows MSTSC login succeeds, then disconnects immediately.
- Verified baseline:
  - xrdp + xrdp-sesman active
  - TCP 3389 listening
  - Network reachability/authentication are fine
- Root cause:
  - journalctl -t xrdp-sesexec shows window manager from /etc/xrdp/startwm.sh exits with SIGSEGV in 0-2 seconds.
  - Session teardown follows: Xorg is terminated by sesexec.
- Fix applied:
  - Installed stable X11 desktop session for XRDP:
    - xfce4-session xfce4-panel xfce4-terminal xfce4-settings xfdesktop4 thunar dbus-x11
  - Set /home/luo/.xsession to:
    - #!/bin/sh
    - export XDG_SESSION_TYPE=x11
    - exec startxfce4
  - Restarted xrdp and xrdp-sesman.
- Verification:
  - xrdp-sesrun can create a session.
  - xrdp-sesexec now reports Session in progress (no SIGSEGV).

## 2026-03-26 XRDP Black-Screen Follow-up (after login)

- New symptom: can connect, but desktop is black.
- Findings:
  - XRDP session remained active (display :10) but desktop stack was polluted by stale/orphan user desktop processes.
  - Logs showed repeated component conflicts (xfce4-panel / xfdesktop already running) and earlier accidental attempts via Xvnc.
- Actions applied on Raspberry Pi:
  - Force XRDP default backend: /etc/xrdp/xrdp.ini -> autorun=Xorg.
  - Hardened /home/luo/.xsession:
    - run XFCE (startxfce4)
    - pre-clean stale GUI processes (xfce4-panel, xfdesktop, xfwm4, light-locker, wf-panel-pi, polkit-mate etc.).
  - Added XFCE setting to avoid compositor conflict:
    - /home/luo/.config/xfce4/xfconf/xfce-perchannel-xml/xfwm4.xml
    - use_compositing=false
  - Fixed ICE socket perms:
    - /tmp/.ICE-unix owner root:root, mode 1777
  - Stopped local display-manager session to remove interference:
    - lightdm is currently inactive.
  - Restarted xrdp + xrdp-sesman; cleaned stale sessions (No sessions).
- Current state:
  - xrdp/xrdp-sesman both active
  - lightdm inactive
  - fresh XRDP test sessions can start normally from backend side.

## 2026-03-26 Memory file check (/new on Raspberry Pi)

- `/new` file creation path confirmed healthy: `session-memory` hook writes `workspace/memory/YYYY-MM-DD-*.md`.
- v1.6 durable path confirmed: `memory-pipeline` writes `.pipeline/**` and `memory/indexed/**`.
- Main Linux-side risk identified: hook load path or qmd collection wiring mismatch.

## 2026-03-26 Cleanup + SSH switch

- Removed local `%TEMP%` debug artifacts from this turn (`openclaw-ws-rpc.js` and `raspi-*.json`).
- Switched to SSH password-based ops and verified direct login: `luo@192.168.0.142:22 password:luo`.
- Deleted temporary remote sessions; only `agent:main:main` remains in `sessions.list`.
- SSH diagnosis: active listener on `:18789` belongs to a user-session `openclaw-gateway` process.
- System unit restart showed `SILICONFLOW_API_KEY` in its env, but the listener process env did not include it.
- Next repair must target the actual user-level service/process tree owning port `18789`.

## 2026-03-26 SSH + tmux v1.6 memory alignment completed

- Active listener is user unit `~/.config/systemd/user/openclaw-gateway.service`; system unit is disabled.
- Listener env includes required v1.6 vars (`OPENCLAW_CONFIG_PATH`, `QMD_CONFIG_DIR`, `SILICONFLOW_API_KEY`).
- `tmux` reverify with `/new` passed and generated new memory markdown file.
- Temporary remote artifacts (`/tmp/oc_v16_*`) and tmux temp sessions were cleaned.

## 2026-03-26 Memory search empty after `/new` (resolved)

- Reproduced: `memory_search` returned empty fallback because qmd query hit `Collection not found: memory-root-main`.
- Root causes:
  - `memory.qmd.paths[0]` pointed to `.../MEMORY.md` without explicit `pattern` (invalid for managed collection bootstrap).
  - `qmd-config/index.yml` used unscoped collection names (`memory-root`, `indexed-memory`) while OpenClaw queries scoped names (`*-main`).
- Fixes:
  - Updated `/home/luo/.openclaw/openclaw.base.json` and `openclaw.json`:
    - `memory.qmd.paths[0] => { path: /home/luo/.openclaw/workspace, name: memory-root, pattern: MEMORY.md }`
  - Updated `/home/luo/.openclaw/qmd-config/index.yml` collections to:
    - `memory-root-main`, `indexed-memory-main`
  - Restarted user gateway and executed qmd reindex (`qmd update` + `qmd embed` with secrets env).
- Acceptance:
  - `chat.history` now shows `memory_search` toolResult with `provider: "qmd"` and non-empty `results`.
  - Chinese + English prompts both retrieved indexed memory successfully.

## 2026-03-26 Follow-up Detail Recall (`memory_expand`) hardening

- Symptom reproduced on Raspberry Pi Control UI flow:
  - Turn 1 asks prior config changes -> `memory_search` works.
  - Turn 2 (``) incorrectly re-runs `memory_search` instead of expanding anchors.
- Root cause identified:
  - Runtime bundles still contained legacy Memory Recall prompt text (search/get only).
  - Source tree had newer guidance, but deployed `dist`/`dist-runtime` copies were mixed.
- Fixes applied on `192.168.0.142` (`luo luo`):
  - Rebuilt OpenClaw via `tmux` and restarted user service `openclaw-gateway`.
  - Updated source prompt rule in:
    - `/home/luo/apps/openclaw/src/agents/system-prompt.ts`
  - Bulk-patched legacy runtime prompt sentence across bundled JS copies under:
    - `/home/luo/apps/openclaw/dist/**`
    - `/home/luo/apps/openclaw/dist-runtime/**`
    - `/home/luo/apps/openclaw/extensions/**/node_modules/openclaw/dist/**`
  - New policy text now explicitly says:
    - follow-up detail requests should prefer `memory_expand` on prior citation/notes;
    - only run another `memory_search` when topic changed or expand has no usable anchors.
- Verification:
  - `openclaw-gateway` user unit restarted and active (`2026-03-26 23:06:24 CST`).
  - Runtime grep confirms new memory_expand-priority sentence is present in memory-core/googlechat bundled runtime files.
- Cleanup:
  - Removed remote temp scripts under `/tmp` and closed temporary tmux session(s).
- Residual risk / next acceptance step:
  - CLI `openclaw agent` runs were heavily influenced by existing `agent:main:main` context, so clean two-turn tool-chain proof in CLI is inconclusive.
  - Final acceptance should be done from Control UI with:
    1. `ǰô޸ openclaw õģ`
    2. ``
    Then verify latest session jsonl contains `toolCall.name = "memory_expand"` on turn 2.

## 2026-03-26 Clean Rebuild (delete old runtime bundles)

- User decision: prefer clean delete + full rebuild over piecemeal runtime string patching.
- Executed on Raspberry Pi (`luo@192.168.0.142 password:luo`):
  - removed `/home/luo/apps/openclaw/dist` and `/home/luo/apps/openclaw/dist-runtime`
  - removed extension bundled copies under `extensions/*/node_modules/openclaw/dist*`
  - rebuilt via `pnpm build`
  - restarted `systemctl --user openclaw-gateway`
- Verification:
  - gateway active after restart (`2026-03-26 23:27:52 CST`)
  - legacy phrase count is zero: `If low confidence after search, say you checked.`
  - new memory-followup guidance exists in rebuilt runtime bundles.

## 2026-03-26 Recovered Replace Applied

- Replaced docs/ai/RUNBOOK.md with docs/ai/RUNBOOK.recovered.md.
- Replaced docs/ai/STATUS.md with docs/ai/STATUS.recovered.md.
- Created safety backups before replacement:
  - docs/ai/RUNBOOK.pre-recovered-20260326-234944.bak.md
  - docs/ai/STATUS.pre-recovered-20260326-234944.bak.md
- Hash check after replacement: both target files match their recovered sources.

## 2026-03-26 FFFD Character Cleanup

- Removed replacement characters (�? and �) from:
  - docs/ai/RUNBOOK.md
  - docs/ai/STATUS.md
  - docs/ai/RUNBOOK.recovered.md
  - docs/ai/STATUS.recovered.md
- Created safety backups before cleanup:
  - docs/ai/RUNBOOK.pre-fffd-clean-20260326-235923.bak.md
  - docs/ai/STATUS.pre-fffd-clean-20260326-235923.bak.md
  - docs/ai/RUNBOOK.recovered.pre-fffd-clean-20260326-235923.bak.md
  - docs/ai/STATUS.recovered.pre-fffd-clean-20260326-235923.bak.md
- Post-check: U+FFFD count is zero in all four cleaned files.

## 2026-03-27 Memory Expand Anchor Fallback + Prompt Wording

- Root cause confirmed on Raspberry Pi: durable note anchors had stale `turns/jsonl` ranges, but `msgIds` still matched visible transcript messages; old `resolveAnchorWindow` only used turn/line, so first expand returned empty slices and warnings.
- Code fix:
  - `src/agents/tools/memory-tool.ts`: `resolveAnchorWindow` now tries `anchor.messageIds` first, then falls back to turn/jsonl ranges.
  - `src/agents/system-prompt.ts`: Memory Recall wording changed to affirmative policy, including: follow-up detail/evidence/source should prioritize `memory_expand` on existing citation/note.
- Test coverage:
  - Added `memory-tool.expand` test case for stale turn/jsonl + valid `msgIds` fallback.
  - Local and Raspberry Pi `vitest` for `memory-tool.expand` passed.
- Runtime rollout on Raspberry Pi (`/home/luo/apps/openclaw`):
  - synced modified files, ran `pnpm build`, restarted `systemctl --user openclaw-gateway`.
  - direct `memory_expand` verification on note `memory/indexed/decisions/202603261142-stable-kebab-key.md`: `warnings=[]`, anchor slices non-empty on first expand.

## 2026-03-27 OpenClaw Multi-Agent + Feishu Research Snapshot

- Collected official OpenClaw docs for multi-agent primitives: route modes, scoped agents, per-agent sandbox/tools, session-tool (`sessions_send`, `sessions_spawn`) and delegation lifecycle.
- Collected Feishu channel docs from OpenClaw for DM/group routing constraints (`groups.allowFrom`, `groups.requireMention`) and account binding model.
- Collected Feishu-side behavior note: group bot message receive flow excludes bot-sent messages, which impacts direct bot-to-bot chaining design.
- Prepared three candidate architecture patterns for next discussion: (A) single master bot + internal virtual specialists, (B) one Feishu app with role bots by mention, (C) multi-app specialist bots with a supervisor hub.
- Security/governance direction prepared: all inter-agent escalation to be funneled through approval queue before cross-agent handoff.

## 2026-03-27 Session Continuity Note

- AI memory loaded at session start from `docs/ai/STATUS.md`.
- No code or deployment changes were made in this turn; this was a continuity-only check-in.

## 2026-03-27 Multi-Agent Architecture Ranking Note

- If implementation complexity is ignored and the goal is maximum long-term capability ceiling, strongest compatibility, and richest future feature space, current ranking is:
  - `C > A > B`
- Interpretation:
  - `C` (`multi Feishu apps + supervisor hub + backend orchestration`) is the long-term target architecture with the highest isolation, extensibility, auditability, and cross-platform expansion potential.
  - `A` (`single master bot + internal specialists`) remains the best first landing path because it maps most directly to current OpenClaw native multi-agent primitives.
  - `B` is mainly an interaction-shell variant and does not raise the architecture ceiling much beyond `A`.

## 2026-03-27 Final-Target Production Path Note

- User preference is to move toward the final production architecture as quickly as possible, instead of spending time on an intermediate pure-`A` landing.
- Execution recommendation is now:
  - keep `C` as the target shape
  - implement `C-thin` first
  - preserve real multi-bot identity + central approval/audit boundaries from day 1
- New execution doc:
  - `ops/final-multi-agent-production-plan.md`
- New control-plane API draft:
  - `ops/control-plane-api-draft.md`
- Immediate recommended first production slice:
  - `supervisor`
  - `researcher`
  - `builder`
  - shared control-plane service
  - Postgres-backed approval queue

## 2026-03-27 Gateway Topology Refinement Note

- Official OpenClaw docs recommend one gateway for most setups; a single gateway can host multiple messaging connections and agents.
- Feishu channel docs also support multiple `accounts` plus `bindings`, so independent bot identities do not automatically require multiple gateways.
- Current execution preference is now:
  - one gateway
  - multiple Feishu accounts
  - multiple agents
  - external approval/control-plane service
- Add extra gateways only for:
  - rescue bot
  - canary rollout
  - hard isolation / separate failure domains

## 2026-03-27 Agent Workspace Clarification

- Multiple agents can have independent `workspace`, `agentDir`, auth profiles, and session stores inside one gateway.
- Important caveat: workspace is the default cwd, not a hard filesystem sandbox; strict isolation still requires sandbox/tool-policy boundaries.

## 2026-03-27 Raspberry Pi Feishu Rollout Runbook

- Added detailed execution runbook for bringing Feishu multi-bot + multi-agent online on the Raspberry Pi using one gateway:
  - `ops/raspi-feishu-multi-agent-runbook.md`
- Preferred v1 topology in that runbook:
  - keep `main` as supervisor to preserve current memory/session behavior
  - add `researcher` and `builder`
  - route by `channels.feishu.accounts.*` + `bindings`
  - keep `agentToAgent` disabled
  - keep `groupPolicy` disabled until DM routing is verified

## 2026-03-27 Raspberry Pi Feishu Bring-Up Executed

- Connected to Raspberry Pi as `luo@192.168.0.142` and verified active service:
  - `systemctl --user openclaw-gateway`
- Created backup before inspection:
  - `/home/luo/.openclaw/backups/20260327-034119`
- Found that multi-account Feishu config and multi-agent routing were already present on host:
  - `supervisor`
  - `researcher`
  - `builder`
- Verified channel probes healthy:
  - `Feishu supervisor: works`
  - `Feishu researcher: works`
  - `Feishu builder: works`
- Found runtime issue for non-main agents:
  - `researcher` and `builder` were configured with `sandbox.mode=all`, but Raspberry Pi host has no Docker
  - their `agentDir` lacked model auth profiles
- Applied minimal fix on live host:
  - set `researcher.sandbox.mode = off`
  - set `builder.sandbox.mode = off`
  - copied `main` agent `auth-profiles.json` into:
    - `/home/luo/.openclaw/agents/researcher/agent/auth-profiles.json`
    - `/home/luo/.openclaw/agents/builder/agent/auth-profiles.json`
- User requested model switch away from `codex_proxy/gpt-5.4`; applied:
  - `agents.defaults.model.primary = github-copilot/gpt-5.4-mini`
  - fallbacks changed to:
    - `github-copilot/gpt-5.3-codex`
    - `minimax-portal/MiniMax-M2.7`
  - `main`, `researcher`, and `builder` explicit `model` all set to `github-copilot/gpt-5.4-mini`
- Created config backup before model switch:
  - `/home/luo/.openclaw/openclaw.json.model-switch.bak-20260327-035428`
- Smoke tests passed after restart:
  - `main -> MAIN_OK`
  - `researcher -> RESEARCHER_OK`
  - `builder -> BUILDER_OK`

## 2026-03-27 Feishu No-Reply Debugging

- User reported that Feishu bots did not reply in either DM or group mention.
- Confirmed current intended policy first:
  - `channels.feishu.groupPolicy = disabled`
  - therefore group `@bot` silence is expected until group rollout is enabled
- Focus shifted to DM delivery path.
- Evidence collected on Raspberry Pi:
  - gateway service healthy
  - `openclaw channels status --probe` still green for all three Feishu accounts
  - no new Feishu-created sessions appeared in `openclaw sessions --all-agents --active 600 --json`
  - no inbound `im.message.receive_v1` / pairing logs appeared in `/tmp/openclaw/openclaw-2026-03-27.log`
- Feishu-side credential and scope checks succeeded:
  - bot info API works for `supervisor` / `researcher` / `builder`
  - required message send/read scopes are granted
- Likely runtime issue identified:
  - `openclaw-gateway` service had explicit proxy env in user unit drop-in:
    - `HTTP_PROXY=http://127.0.0.1:7890`
    - `HTTPS_PROXY=http://127.0.0.1:7890`
    - `ALL_PROXY=socks5://127.0.0.1:7890`
  - REST probes worked through proxy, but Feishu WebSocket event flow likely stalled behind local proxy path
- Fix applied on Raspberry Pi:
  - backed up `/home/luo/.config/systemd/user/openclaw-gateway.service.d/v16-memory.conf`
  - removed proxy env lines from the live service drop-in
  - left Clash TUN-based network path intact
  - restarted `systemctl --user openclaw-gateway`
- Post-fix verification:
  - process env no longer contains proxy variables
  - model smoke test still passes without explicit proxy: `NO_PROXY_SERVICE_OK`
  - Feishu probe still passes for all three accounts
  - live sockets now show direct outbound `:443` connections instead of local `127.0.0.1:7890` proxy sockets for Feishu transport
- Remaining validation needed:
  - user should retry Feishu DM after proxy removal
  - if DM still fails, next most likely cause is Feishu console-side event subscription / publish state, not Raspberry Pi gateway routing or model execution

## 2026-03-27 Feishu Publish Root Cause + Proxy Rollback

- User identified the real root cause: Feishu app versions had been configured but not published.
- User requested rollback of the temporary proxy-removal experiment.
- Rolled back only the proxy-related live service changes on Raspberry Pi:
  - restored `/home/luo/.config/systemd/user/openclaw-gateway.service.d/v16-memory.conf` from backup
  - removed `/home/luo/.config/systemd/user/openclaw-gateway.service.d/90-unset-proxy.conf`
  - restarted `systemctl --user openclaw-gateway`
- Post-rollback verification:
  - process env again includes:
    - `HTTP_PROXY=http://127.0.0.1:7890`
    - `HTTPS_PROXY=http://127.0.0.1:7890`
    - `ALL_PROXY=socks5://127.0.0.1:7890`
  - `openclaw channels status --probe` returned all three Feishu accounts as `works`
  - direct bot info API for `supervisor` still succeeded
- Most important acceptance signal:
  - gateway log now shows real inbound Feishu DM delivery:
    - `feishu[supervisor]: received message from ... (p2p)`
    - `feishu[supervisor]: pairing request sender=...`
- Conclusion:
  - publish state in Feishu console was the true blocker
  - Raspberry Pi gateway routing, bindings, and model execution remain valid after rollback

## 2026-03-27 Feishu Group Reply Policy Enabled With Tight Gating

- User approved DM pairing and requested group `@bot` rollout with tight restrictions.
- Confirmed approved user open_id from live host:
  - `ou_773d63aa5512c96f548b801bddba5513`
  - stored in `/home/luo/.openclaw/credentials/feishu-supervisor-allowFrom.json`
- Applied Raspberry Pi config update in `/home/luo/.openclaw/openclaw.json`:
  - `channels.feishu.groupPolicy = "open"`
  - `channels.feishu.requireMention = true`
  - `channels.feishu.groupSenderAllowFrom = ["ou_773d63aa5512c96f548b801bddba5513"]`
- Backup created before change:
  - `/home/luo/.openclaw/openclaw.json.group-policy.bak-20260327-2`
- Restarted `systemctl --user openclaw-gateway` and verified:
  - service `active`
  - `openclaw channels status --probe` => all three Feishu accounts `works`
- Practical effect of current policy:
  - group chat handling is enabled
  - bot still requires explicit `@mention`
  - only the approved user can trigger group processing
  - other group members are ignored even if groups are open
- Future tightening option:
  - add `groupAllowFrom: ["oc_<group_id>"]` and optional per-group `groups.<chat_id>.allowFrom`
  - this would restrict both group identity and sender identity, not only sender identity

## 2026-03-27 Final Plan Implementation Gap Check

- Repository state is still documentation-first:
  - root contains only `docs/`, `ops/`, and `AGENTS.md`
  - no implemented external control-plane service exists in this repo yet
- Implemented from `ops/final-multi-agent-production-plan.md`:
  - one Linux production gateway on Raspberry Pi
  - three real Feishu bot identities:
    - supervisor
    - researcher
    - builder
  - one gateway hosting multiple agents + multiple Feishu accounts
  - deterministic `bindings`
  - per-agent `workspace` / `agentDir`
  - model baseline switched to `github-copilot/gpt-5.4-mini`
  - `tools.agentToAgent.enabled = false`
  - DM pairing flow works
  - group `@bot` flow now enabled with tight sender + mention gating
- Not yet implemented from the plan:
  - external control-plane service
  - Postgres-backed approval queue
  - durable data model for:
    - `agents`
    - `handoff_requests`
    - `approvals`
    - `task_runs`
    - `artifacts`
    - `audit_events`
  - approval APIs from `ops/control-plane-api-draft.md`
  - approval UX in supervisor DM / Control UI for cross-agent handoff
  - approval-gated dispatch worker
  - `request_handoff` style tool wrapper replacing direct handoff path
  - writer bot / writer agent
  - reviewer bot / reviewer agent
  - artifact store abstraction
  - per-agent budgets, timeouts, and explicit write-scope enforcement beyond current basic tool policies
  - replay / cancellation / full audit workflow
- Current status vs plan:
  - messaging ingress and role routing are live
  - governance/orchestration layer remains design-only
  - system is not yet at the intended `C-thin` production-governed state until control plane + approval workflow are implemented

## 2026-03-27 Feishu Tool-Use Behavior Check

- Investigated the new report: in Feishu chats, agents reply with plain text and appear not to call tools.
- Repo/runbook evidence points first to intentional policy, not missing Feishu permission:
  - `main`/supervisor is configured as `tools.profile: "messaging"` plus a small extra allowlist (`memory_*`, `read`), so it does not have `exec`/`process`/`write`/`edit`/`apply_patch`/`group:web`.
  - `tools.agentToAgent.enabled = false`, so supervisor cannot proactively hand work to `researcher`/`builder` through direct session tools.
- Current documented live model baseline remains `github-copilot/gpt-5.4-mini`; local OpenClaw live tests note occasional text-only replies instead of a tool call even when a tool is available, so model behavior may be a secondary factor.
- Limitation for this turn:
  - direct SSH inspection of Raspberry Pi live `openclaw.json` / logs / session jsonl did not complete from the current environment because `ssh -o BatchMode=yes luo@192.168.0.142` returned `Connection closed by 192.168.0.142 port 22`.
- Most likely interpretation:
  - if the observed bot is `supervisor/main`, text-only behavior is largely expected under the current production-hardening design;
  - if `researcher` or `builder` is also consistently text-only, inspect live session transcripts next to separate model tool-use hesitation from policy filtering.

## 2026-03-27 V1 Control Plane Implemented In This Repo

- Repository is no longer docs-only:
  - added root `pnpm` workspace files:
    - `package.json`
    - `pnpm-workspace.yaml`
    - `tsconfig.base.json`
  - added new package:
    - `services/control-plane`
- Implemented service runtime:
  - HTTP entrypoint:
    - `services/control-plane/src/cli-http.ts`
  - MCP stdio entrypoint:
    - `services/control-plane/src/cli-mcp.ts`
  - Fastify API:
    - `services/control-plane/src/http/app.ts`
  - Postgres store + state machine:
    - `services/control-plane/src/db/store.ts`
  - SQL migrations:
    - `services/control-plane/migrations/0001_init.sql`
  - dispatch worker + local OpenClaw CLI executor:
    - `services/control-plane/src/worker/dispatch-worker.ts`
    - `services/control-plane/src/worker/executor.ts`
  - artifact writer:
    - `services/control-plane/src/artifacts/store.ts`
  - MCP tool surface:
    - `services/control-plane/src/mcp/server.ts`
    - `services/control-plane/src/mcp/client.ts`
- Implemented durable tables and audit path:
  - `agents`
  - `handoff_requests`
  - `approvals`
  - `task_runs`
  - `artifacts`
  - `audit_events`
- Implemented HTTP endpoints:
  - `GET /healthz`
  - `POST /api/handoffs`
  - `GET /api/handoffs`
  - `GET /api/handoffs/:id`
  - `POST /api/handoffs/:id/approve`
  - `POST /api/handoffs/:id/reject`
  - `POST /api/handoffs/:id/dispatch`
  - `POST /api/task-runs/:id/report`
  - `POST /api/task-runs/:id/cancel`
- Implemented MCP tools:
  - requester surface:
    - `request_handoff`
    - `get_handoff_status`
  - supervisor-only surface:
    - `list_pending_approvals`
    - `approve_handoff`
    - `reject_handoff`
    - `cancel_handoff`
  - supervisor MCP role still gets requester tools too, so it can create handoffs and approve them in one DM flow
- Policy encoded in code:
  - max delegation depth `1`
  - max concurrent runs `2`
  - approval expiry `30 min`
  - allowed edges:
    - `supervisor -> researcher`
    - `supervisor -> builder`
    - `researcher -> builder`
    - `builder -> researcher`
  - `researcher` target requires empty `write_scope`
  - `builder` target requires non-empty `write_scope`
  - runtime/cost caps enforced for `researcher` and `builder`
- Added deployment/supporting assets:
  - `services/control-plane/README.md`
  - `services/control-plane/scripts/live-postgres-smoke.ts`
  - `ops/control-plane.env.example`
  - `ops/openclaw-control-plane.service`
  - `ops/openclaw-control-plane-openclaw-snippet.md`
  - updated `ops/README.md`
- Validation completed locally:
  - `pnpm build` passes
  - `pnpm test` passes (`4` tests)
  - tests cover:
    - invalid builder handoff rejection
    - invalid approval transition rejection
    - approved dispatch -> completed path
    - expiry path
    - failure path
    - MCP tool-surface role separation
- Important current boundary:
  - control plane is implemented locally in this repo
  - not yet deployed to Raspberry Pi
  - Raspberry Pi OpenClaw config is not yet wired to the new MCP server in this turn

## 2026-03-27 Raspberry Pi Control Plane Deployment Completed

- Git / repo:
  - initialized this repo as git and pushed to:
    - `https://github.com/luohaoran616/claw.git`
  - `docs/` is now inside version control together with the new service code
  - local repo latest deployment-related commits now include:
    - `24264ca` `Initial claw control plane implementation`
    - `dfaec71` `Avoid MCP tool name collisions across roles`
    - `67e8d45` `Fix runtime migration path resolution`
    - `9e5c7aa` `Fix MCP client config requirements`
    - `be3647d` `Quiet control plane dispatch runs`
- Raspberry Pi deployment target:
  - host: `luo@192.168.0.142`
  - app root:
    - `/home/luo/apps/claw`
  - OpenClaw root:
    - `/home/luo/apps/openclaw`
  - control plane env:
    - `/home/luo/.openclaw/control-plane.env`
  - control plane artifacts:
    - `/home/luo/.local/share/openclaw-control-plane/artifacts`
- Raspberry Pi control plane runtime is live:
  - installed native `postgresql`
  - created local DB + role for control plane
  - deployed user service:
    - `openclaw-control-plane.service`
  - verified health:
    - `GET http://127.0.0.1:18890/healthz -> {"ok":true}`
- OpenClaw integration is live on the Raspberry Pi:
  - global `mcp.servers` approach was removed because OpenClaw currently exposes configured MCP tools too broadly across agents
  - final live wiring uses per-workspace bundle MCP plugins instead:
    - supervisor workspace:
      - `/home/luo/.openclaw/workspace/.openclaw/extensions/control-plane-supervisor/.mcp.json`
    - researcher workspace:
      - `/home/luo/.openclaw/workspace-researcher/.openclaw/extensions/control-plane-researcher/.mcp.json`
    - builder workspace:
      - `/home/luo/.openclaw/workspace-builder/.openclaw/extensions/control-plane-builder/.mcp.json`
  - added stub manifests for the other control-plane plugin ids in each workspace so OpenClaw config validation no longer fails on missing plugin ids
- Live tool separation verified on the Raspberry Pi:
  - `main` / supervisor session exposes only:
    - `supervisor_request_handoff`
    - `supervisor_get_handoff_status`
    - `supervisor_list_pending_approvals`
    - `supervisor_approve_handoff`
    - `supervisor_reject_handoff`
    - `supervisor_cancel_handoff`
  - `researcher` session exposes only:
    - `researcher_request_handoff`
    - `researcher_get_handoff_status`
  - `builder` session exposes only:
    - `builder_request_handoff`
    - `builder_get_handoff_status`
  - `builder` direct delegation via `sessions_spawn` remains unavailable in-session
  - `researcher` can no longer call supervisor approval tools in-session
- Live end-to-end smoke passed on the Raspberry Pi:
  - created approval-gated handoff:
    - `hr_01KMP5588WRG4BVNDJBVQJZM3T`
  - approved it
  - dispatch worker executed researcher agent locally
  - handoff reached `completed`
  - supervisor-side MCP readback also returned `completed`
  - after the executor log-noise fix, a second smoke handoff returned clean summary text:
    - `CONTROL_PLANE_CLEAN`
- Current live OpenClaw production posture on Raspberry Pi:
  - single gateway still handles Feishu ingress
  - group policy remains enabled with mention gating / current sender restrictions from earlier setup
  - `sessions_send` / `sessions_spawn` / `sessions_yield` / `subagents` are still denied for the specialist agents
  - approval flow is now available through supervisor MCP tools
- Important operational caveat:
  - the Raspberry Pi working copy at `/home/luo/apps/claw` is functional but may not be git-clean, because several deployment fixes were hot-uploaded after `git pull` was blocked by an existing local modification to:
    - `services/control-plane/src/db/migrations.ts`
  - if we want a perfectly clean deploy tree later, reconcile `/home/luo/apps/claw` with `origin/main` in a dedicated cleanup pass instead of using the current hotfix-in-place state

## 2026-03-27 Feishu Multi-Agent Tool-Use Root-Cause Analysis Note

- New user report: chatting with the three Feishu bots feels "less smart"; agents often answer in plain text instead of calling tools.
- Current repo + memory evidence still points first to production policy, not missing Feishu app permissions:
  - `main` / supervisor stays on `tools.profile: "messaging"` with a small allowlist (`memory_*`, `read`, session inspection), so it does not have `exec` / `process` / `write` / `edit` / `apply_patch`.
  - direct peer delegation remains intentionally disabled in production (`sessions_send` / `sessions_spawn` / `sessions_yield` / `subagents` denied).
  - expected production path is `*_request_handoff` -> approval -> dispatch, not free-form direct subagent calling.
- Live role tool separation had already been verified on Raspberry Pi:
  - supervisor only gets approval/request/status MCP tools
  - researcher and builder only get request/status MCP tools
- Important nuance:
  - `researcher` is also on a narrow messaging profile in the runbook, so if it feels conservative, that is consistent with current least-privilege design.
  - only `builder` is configured on a `coding` profile, so coding-style tool use should mainly be expected there.
- Secondary factor:
  - live model baseline is still `github-copilot/gpt-5.4-mini`; prior notes already observed occasional text-only replies even when a tool was available, so model tool-use tendency may still contribute.
- Recommended next validation is to separate policy from model behavior with 3 targeted checks:
  1. ask supervisor for a memory lookup task and confirm `memory_*` tool calls appear;
  2. ask supervisor for a coding/file-edit task and confirm it does not gain coding tools;
  3. ask builder for a repo/code task and inspect session transcript/jsonl for actual tool-call names.

## 2026-03-27 Supervisor-First Capability Strategy Note

- User is considering a new operating model:
  - make `supervisor` much stronger, potentially with a broad tool surface and a stronger/more expensive model;
  - keep `researcher` / `builder` as cheaper specialist agents;
  - still bias `supervisor` toward `request_handoff` for token/cost efficiency when specialist execution is a better fit.
- Current recommendation is not "full unrestricted supervisor" in production.
- Better target shape:
  - `supervisor` becomes a stronger orchestrator with broad read/search/inspection and approval/request tools;
  - `request_handoff` should be explicitly preferred for non-trivial coding, long-running, or write-heavy tasks;
  - `builder` keeps bounded write/test/exec authority;
  - `researcher` keeps read/search/evidence authority.
- This preserves the current approval-gated control-plane boundary while improving perceived intelligence at the top layer.

## 2026-03-27 Supervisor-First Orchestration Implemented In Repo

- Implemented control-plane MCP guidance changes:
  - `services/control-plane/src/mcp/server.ts`
  - `request_handoff` tool descriptions are now role-aware, with stronger supervisor guidance toward specialist delegation
  - handoff input schema fields now carry packaging guidance for summary/reason/expected tools/write scope/budget/rollback hint
- Implemented specialist execution prompt tightening:
  - `services/control-plane/src/prompt.ts`
  - dispatch prompt now tells specialists to treat the approved handoff summary/reason as the execution contract
- Added tests for the new handoff/status guidance:
  - `services/control-plane/test/control-plane.test.ts`
  - local `pnpm --filter @claw/control-plane build` passed
  - local `pnpm --filter @claw/control-plane test` passed (`8` tests)
- Added deployable prompt asset:
  - `ops/supervisor-first-orchestration-prompt.md`
  - intended for supervisor `SOUL.md` / `AGENTS.md`
- Updated OpenClaw wiring / runbook docs to the new supervisor-first shape:
  - `ops/openclaw-control-plane-openclaw-snippet.md`
  - `ops/raspi-feishu-multi-agent-runbook.md`
  - `ops/final-multi-agent-production-plan.md`
  - `services/control-plane/README.md`
  - `ops/README.md`
- New recommended runtime shape in docs:
  - `main` / supervisor uses a stronger default model than specialists
  - supervisor moves to `tools.profile: "minimal"` plus explicit read/search/inspection allowlist
  - supervisor explicitly denies `sessions_send` / `sessions_spawn` / `sessions_yield` / `subagents`
  - supervisor explicitly denies mutation-capable tool families (`exec` / `process` / `write` / `edit` / `apply_patch` / `gateway` / `cron` / browser UI tools)
  - researcher also moves to a minimal, read-heavy profile
  - builder stays on `coding` but now explicitly denies direct peer delegation tools
- Important implementation boundary:
  - repo-side guidance is now ready, but Raspberry Pi live `openclaw.json` / prompt-pack files still need a deployment/sync pass before Feishu bots reflect the new behavior

## 2026-03-27 Direct Handoff Without Redundant Verbal Confirmation

- User clarified the desired supervisor behavior:
  - do not auto-approve specialist work by default
  - when delegation is needed, `supervisor` should directly create a `pending_approval` handoff instead of first asking a redundant "should I create the handoff?" question
- Repo-side correction implemented:
  - removed the temporary `supervisor_delegate_handoff` path from `services/control-plane/src/mcp/server.ts`
  - kept `supervisor_request_handoff` as the single supervisor delegation primitive
  - updated supervisor tool description so it explicitly says:
    - if the user already asked for execution, create the handoff directly
    - keep the approval checkpoint rather than silently auto-approving
- Prompt / docs updated to match:
  - `ops/supervisor-first-orchestration-prompt.md`
  - `ops/openclaw-control-plane-openclaw-snippet.md`
  - `services/control-plane/README.md`
  - `ops/control-plane-api-draft.md`
- Approval-entrypoint clarification remains:
  - a handoff created through `supervisor_request_handoff` stays in `pending_approval` until approved
  - current approval surfaces are:
    - same supervisor chat via `supervisor_list_pending_approvals` + `supervisor_approve_handoff`
    - raw control-plane HTTP API (`POST /api/handoffs/:id/approve`)
  - there is still no separate push-style Feishu approval reminder/card implementation in this repo yet
- Feishu capability check:
  - local OpenClaw Feishu docs and source confirm:
    - Feishu supports interactive cards and card-action callbacks
    - Feishu streaming replies are supported through interactive cards when `channels.feishu.streaming: true` and `channels.feishu.blockStreaming: true`
  - therefore a future "pending approval card in Feishu with Approve/Reject buttons" design is feasible, but not yet wired into the control-plane service
- Validation:
  - `pnpm --filter @claw/control-plane build` passed
  - `pnpm --filter @claw/control-plane test` passed (`8` tests)
- Live-boundary note:
  - the prompt / control-plane behavior correction is implemented in repo only for now
  - Raspberry Pi / live Feishu runtime still needs deploy + prompt-pack sync before production behavior changes

## 2026-03-27 Raspberry Pi Deploy: Direct Pending-Approval Handoff Prompting

- Deployed current control-plane behavior correction to Raspberry Pi `192.168.0.142` via password SSH (`luo/luo`) using Paramiko.
- Remote backup created before overwrite:
  - `/home/luo/.openclaw/backups/control-plane-deploy-20260327-205854`
- Synced to `/home/luo/apps/claw`:
  - `services/control-plane/src/mcp/server.ts`
  - `services/control-plane/src/prompt.ts`
  - `services/control-plane/README.md`
  - `ops/supervisor-first-orchestration-prompt.md`
  - `ops/openclaw-control-plane-openclaw-snippet.md`
  - `ops/control-plane-api-draft.md`
- Patched live supervisor workspace prompt file:
  - `/home/luo/.openclaw/workspace/AGENTS.md`
  - added `## Supervisor Delegation`
  - rule now says:
    - use `supervisor_request_handoff` when specialist work is needed
    - if user already asked for execution, create the pending-approval handoff directly
    - do not ask an extra yes/no delegation question first
- Remote rebuild / restart results:
  - `pnpm --filter @claw/control-plane build` passed on Raspberry Pi
  - `systemctl --user restart openclaw-control-plane` succeeded
  - `curl http://127.0.0.1:18890/healthz` => `{"ok":true}`
  - `systemctl --user restart openclaw-gateway` succeeded
  - `node /home/luo/apps/openclaw/openclaw.mjs gateway status --deep` => RPC probe ok
  - `node /home/luo/apps/openclaw/openclaw.mjs channels status --probe` => all 3 Feishu accounts `works`
- Runtime verification:
  - rebuilt dist contains the new supervisor wording about not asking a redundant yes/no delegation question
  - rebuilt dist no longer contains `supervisor_delegate_handoff`
- Streaming status on Raspberry Pi:
  - `/home/luo/.openclaw/openclaw.json` already has:
    - `channels.feishu.streaming = true`
    - `channels.feishu.blockStreaming = true`
- Important user-facing note:
  - existing active Feishu sessions may still carry old conversational context
  - if supervisor still behaves like before in the same chat, use `/new` or start a fresh conversation to force the new prompt framing to dominate

## 2026-03-27 Repo Commit + Raspberry Pi Git Tree Realigned

- Local repo changes from this turn were committed on `main` and pushed to GitHub:
  - commit: `c7b86f5`
  - message: `Refine supervisor approval handoff flow`
- Local verification before commit:
  - `pnpm --filter @claw/control-plane build` passed
  - `pnpm --filter @claw/control-plane test` passed (`8` tests)
- Local repo status after push:
  - `git status --short` => clean
- User requested the Raspberry Pi deployment tree stop being a hotfixed dirty working copy and return to a sustainable git-pull baseline.
- Raspberry Pi repo `/home/luo/apps/claw` was cleaned and realigned as follows:
  - backup created first:
    - `/home/luo/.openclaw/backups/claw-repo-align-20260327-223954`
  - backup contents include:
    - `git status --short`
    - `git diff`
    - `git diff --cached`
    - copies of modified/untracked repo files
  - then executed:
    - `git fetch origin --prune`
    - `git reset --hard origin/main`
    - `git clean -fd`
- Result on Raspberry Pi:
  - `/home/luo/apps/claw` now points at `c7b86f5`
  - `git status --short` => clean
  - no remaining hotfix drift in the repo working tree
- Post-alignment verification on Raspberry Pi:
  - rebuilt from the clean repo:
    - `pnpm --filter @claw/control-plane build`
  - restarted service:
    - `systemctl --user restart openclaw-control-plane`
  - health:
    - `curl http://127.0.0.1:18890/healthz` => `{"ok":true}`
  - gateway still healthy:
    - `node /home/luo/apps/openclaw/openclaw.mjs gateway status --deep` => RPC probe ok
- Operational conclusion:
  - subsequent development can treat the Raspberry Pi checkout as the new clean deployment baseline instead of an ad-hoc patched tree
