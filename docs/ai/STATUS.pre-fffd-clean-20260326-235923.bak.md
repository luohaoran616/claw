# STATUS

Current goal: �?`D:\lhr\Projects\202603\claw` 建成 OpenClaw/QMD 的长期维护工作区�?
## Done

1. 本地 `qmd` 已完�?Memory Recall V1.6 相关改动，并推送到 `fork/feature/memory-recall-v1.6`�?2. 本地 `openclaw` 已完�?`memory_expand` / anchor-first recall / runtime 注册链改动，并推送到 `fork/feature/memory-recall-v1.6`�?3. 现有源码主位置已明确�?   - `D:\lhr\Projects\202603\qmd`
   - `D:\lhr\app\openclaw`
4. 云服务器记忆系统已做过一次对齐；已知还需要继续完成一次云�?rebuild/restart 验证�?5. `2026-03-25` 本地分支核查完成�?   - `openclaw`: `feature/memory-recall-v1.6` @ `4ed6a2c95c`，跟�?`fork/feature/memory-recall-v1.6`，`ahead/behind = 0/0`
   - `qmd`: `feature/memory-recall-v1.6` @ `3f7b276`，跟�?`fork/feature/memory-recall-v1.6`，`ahead/behind = 0/0`
   - 两边 `main` 都与 `fork/main` 同步（`ahead/behind = 0/0`�?   - 本地存在未跟踪文件（OpenClaw 以旧 `node_modules/dist` 备份目录为主，qmd �?`else/openclaw2.json` 与评估脚本）
6. 已完成“多机协同”运维方案设计并落地�?runbook�?   - 新增 `docs/ai/RUNBOOK.md` �?Multi-Host 章节（推荐拓扑：台式机主 Gateway + 树莓�?Node + Windows remote client + 云端仅穿�?控制面）
   - 明确 GitOps + Ansible 的统一发布路径与健康检查命�?7. 新增 `ops/` 最小模板：
   - `ops/versions.lock.example`（OpenClaw/QMD 提交锁定�?   - `ops/README.md`（后�?Ansible 落地路径�?8. `2026-03-25` 架构偏好已明确：
   - Windows 本机作为�?Gateway（OpenClaw + qmd）用于快速开发验�?   - 树莓派与台式机优先作�?Node 执行�?   - Ubuntu 云服务器仅承�?`frp` 穿透与运维控制面，不再部署 OpenClaw 业务
9. 飞书接入约束已确认：Gateway 需保持长期运行（官�?Feishu 文档为长连接模式，故障排查也要求先检�?`openclaw gateway status`）�?10. 架构评估更新：`树莓派主 Gateway + Windows/台式�?Remote(+Node)` 可行，且能显著减少“多�?Gateway”同步复杂度；但 Node 端仍需做最小版�?配置同步与配对管理�?11. 操作面决策补充：采用 `Windows OpenSSH -> 树莓�?ssh/tmux` 作为日常远程操控方案；tmux 仅需部署在树莓派侧�?12. 已确认用户所�?`tmux` 为官方仓�?`github.com/tmux/tmux`；其定位是终端复用器，适合在树莓派侧常驻会话，Windows 通过 SSH 连接使用�?13. 已在树莓�?`192.168.0.142` 完成 Clash 部署（`mihomo + metacubexd + systemd`）：
   - 服务：`clash.service`（`enabled + active`�?   - 端口：`7890` / `9090` / `1053`
   - UI：`http://192.168.0.142:9090/ui/`
   - 配置：`/home/luo/.config/clash/config.yaml`
14. 已排障并修复 Clash `TUN operation not permitted`�?   - 原因：配置中 `tun.enable: true`，以普通用户运行服务时无权限创�?TUN
   - 处理：将 `tun.enable` 改为 `false` 并重�?`clash.service`
   - 验证：TUN 报错消失，`curl -x http://127.0.0.1:7890 https://www.google.com` 可通并有命中日�?15. 已在树莓派完�?tmux 源码编译安装（优先方案）�?   - 源码来源：`github.com/tmux/tmux`，tag `3.6a`
   - 安装结果：`/usr/local/bin/tmux`，版�?`tmux 3.6a`
   - 自检：可创建/列出/销毁测试会话（`tmux -L codex-check ...`�?16. Clash TUN 模式已成功开启并验证�?   - `luo` 本就具备管理员权限（`sudo` �?+ 免密 sudo），无需额外提权
   - �?`clash.service` 增加 `AmbientCapabilities/CapabilityBoundingSet = CAP_NET_ADMIN CAP_NET_RAW`
   - �?`tun.enable` 改回 `true` 并重启后，日志出�?`Tun adapter listening at: Meta(...)`
   - `ip -br link` 可见 `Meta` 接口，`ip rule` 出现 TUN 路由规则
   - 无代理参�?`curl https://www.google.com` 也能命中日志：`198.18.0.1 -> ... using PROXY`

## Open Problems / Risks

1. 云服务器 SSH 曾出�?`banner exchange timeout`，需要先保证远端稳定再继续收尾�?2. 云端 `memory.qmd.scope` 是否保持�?DM，还需要结合实际渠道策略再定�?3. 远端如果只同步插件入口、不同步 runtime/tool 工厂，会再次出现 `createMemoryExpandTool is not a function`�?4. 若把源码目录整体打包/同步到云端，OpenClaw 本地未跟踪的大目录可能导致传输慢、磁盘占用和重建耗时上升�?5. 若继续维持“多�?Gateway（每机都跑完�?OpenClaw）”，运维复杂度会明显高于“单�?Gateway + Node”�?6. Windows �?Gateway 方案在“本机断�?离线”时会影响全部会话入口，需要后续设计热备切换流程�?7. 若飞书机器人要求稳定 24x7 可用，不宜只依赖 Windows 主机单点在线�?8. 若把二开主战场迁到树莓派，构�?测试速度可能明显慢于 x86（尤�?qmd 索引与前端构建），需要权衡开发效率�?9. 若只靠家庭局域网地址管理树莓派，IP 漂移和网络抖动会影响远程运维稳定性（需 DHCP 保留 + SSH key + systemd 常驻）�?10. Clash 当前仍是占位代理参数与临�?`secret`，未替换为真实凭据前仅算基础安装完成�?11. Clash 配置曾被 Web UI 改动（出�?`tun` 段），后续需明确哪些项允�?UI 改写、哪些项必须由文件模板管理�?12. 开�?TUN 后，若未来替�?systemd 文件或重装系统，需同步恢复 `clash.service.d/capabilities.conf`，否则会再次�?`operation not permitted`�?
## Next Actions

1. 以这�?`claw` 目录为入口，维护 OpenClaw/QMD 的长期分支、云端对齐、发布和回滚记录�?2. 确认网络层选型：`Tailscale`（优先）�?`frp`（云做穿透中继），并在云端完成最小可用链路�?3. �?runbook 先落地单�?Gateway + 树莓�?Node 形态，再决定是否保留第�?Gateway 作为备份�?4. �?`ops/versions.lock.example` 复制�?`ops/versions.lock`，填入实际发布提交并开�?Ansible 化�?5. 发布脚本或同步策略排除本地未跟踪缓存/备份目录，避免把无关大文件传到远端�?6. 评估是否把两�?feature 分支合并回各�?`main`，并按稳定节奏推�?PR �?fork 主线�?7. 设计 Windows �?Gateway 的备�?切换方案（台式机二级 Gateway 或冷备）�?8. 明确飞书生产入口部署位（Windows 常驻 / 台式机常�?/ 树莓派常驻）并完成演练�?9. 明确“开发位”与“生产位”是否同机：若生产在树莓派，建议保留 Windows 开发并通过 GitOps 发布到树莓派，而非全部开发迁移到树莓派�?10. 在树莓派重装后，先完�?SSH/tmux/systemd 基础设施，再开�?OpenClaw 安装，避免后续手工运维成本反复增加�?11. �?Clash 配置中的 `server/port/username/password/secret` 替换为真实值并重启，随后再开�?OpenClaw 安装流程�?12. 基于当前网络�?tmux 基础设施，继续推进树莓派 OpenClaw �?Gateway 安装�?13. 在继�?OpenClaw 安装前，�?Clash 当前有效配置�?service drop-in 备份到版本化目录�?
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
- Switched to SSH password-based ops and verified direct login: `luo@192.168.0.142:22`.
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
  - Turn 2 (`�������`) incorrectly re-runs `memory_search` instead of expanding anchors.
- Root cause identified:
  - Runtime bundles still contained legacy Memory Recall prompt text (search/get only).
  - Source tree had newer guidance, but deployed `dist`/`dist-runtime` copies were mixed.
- Fixes applied on `192.168.0.142` (`luo`):
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
    1) `����ǰ������ô�޸� openclaw ���õģ�`
    2) `�������`
    Then verify latest session jsonl contains `toolCall.name = "memory_expand"` on turn 2.

## 2026-03-26 Clean Rebuild (delete old runtime bundles)

- User decision: prefer clean delete + full rebuild over piecemeal runtime string patching.
- Executed on Raspberry Pi (`luo@192.168.0.142`):
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
