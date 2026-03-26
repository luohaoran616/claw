# RUNBOOK

## Multi-Host 协同目标（Windows + Ubuntu�?+ 树莓�?+ 台式机）

推荐把“云服务器”只作为网络中继/运维控制面，不承�?OpenClaw 业务网关�?
### 当前首选拓扑（按你的新偏好�?
1. Windows 本机：主 Gateway（OpenClaw + qmd，开�?修复后第一时间本地验证）�?2. 树莓派：Node（远程命令、轻量任务、后续可拓展更多云端服务）�?3. 台式机：Node（远程命令、文件系统管理、部署任务执行）�?4. Ubuntu 云服务器：仅 `frps`（公网入口）+ 运维控制入口（SSH/Ansible），不部�?OpenClaw 业务�?
命令流：

1. 所有会话、渠道、状态仍�?Windows �?Gateway�?2. 智能体需要远程执行时，通过 `node.*` RPC 调用树莓�?台式�?Node�?3. 云服务器只负责打通公网到家庭网络的连接，不承�?Gateway 状态�?
### Windows 操控树莓派（推荐操作面）

关键点：`tmux` 运行在树莓派（Linux）上，不需�?Windows 原生支持 tmux。Windows 只需�?SSH 客户端�?
推荐组合�?
1. Windows：内�?OpenSSH 客户端（PowerShell/Windows Terminal）�?2. 树莓派：`sshd + tmux + openclaw(systemd)`�?3. 云服务器：`frps` + 可�?Ansible 控制入口�?
最小命令（�?Windows 发起）：

```powershell
# 直连 shell
ssh pi@raspberrypi.local

# 一条命令进�?创建远端 tmux 会话（推荐）
ssh -t pi@raspberrypi.local "tmux new -As openclaw"

# 在本机执行远端命令（便于我后续自动化执行�?ssh pi@raspberrypi.local "openclaw gateway status --deep"
```

建议先做的硬化：

1. 给树莓派设置路由�?DHCP 保留 IP（避�?IP 漂移）�?2. 配置 SSH 密钥登录，逐步禁用密码登录�?3. `openclaw` �?`frpc` 都用 `systemd` 常驻�?4. 把长任务都放�?tmux，会话断开不影响执行�?
树莓�?tmux（源码编译）�?
```bash
sudo apt-get update -y
sudo apt-get install -y git build-essential autoconf automake pkg-config bison libevent-dev libncurses-dev libutempter-dev
TAG=$(python3 - <<'PY'
import json, urllib.request
u='https://api.github.com/repos/tmux/tmux/releases/latest'
with urllib.request.urlopen(u, timeout=30) as r:
    d=json.load(r)
print(d['tag_name'])
PY
)
cd /tmp
git clone --depth 1 --branch "$TAG" https://github.com/tmux/tmux.git tmux-src
cd tmux-src
./autogen.sh
./configure --prefix=/usr/local
make -j"$(nproc)"
sudo make install
tmux -V
```

备选拓扑（当你后续想把�?Gateway 迁到 Linux/x86 时）�?
1. 台式机（x86）跑�?Gateway（OpenClaw + qmd）�?2. 树莓派跑 Node（执行工�?任务，不单独承载�?Gateway）�?3. Windows 本机设为 remote client，连�?Gateway�?4. Ubuntu 云服务器只做内网穿透与集中运维入口（SSH/Ansible 控制面）�?
这样你的“一个端改动，多端快速同步”可分为两层�?
- 代码与规则同步：Git（openclaw/qmd/ops-config 三仓或单 monorepo�?- 部署与重启同步：Ansible（从云端控制面一次推送到树莓�?台式机）

## 官方能力对齐（OpenClaw�?
### 1) Remote 模式（客户端不自启本�?Gateway�?
```bash
openclaw config.set gateway.mode remote
openclaw config.set gateway.remote.url ws://<gateway-host>:<port>
openclaw config.set gateway.remote.auth "Bearer <token>"
```

### 2) Node 模式（把树莓派作为执行节点接入主 Gateway�?
```bash
openclaw node register --gateway ws://<gateway-host>:<port>
openclaw node list
```

### 3) 健康检查（脚本化友好）

```bash
openclaw gateway status --deep
openclaw gateway status --json
openclaw plugins inspect memory-core
```

### 4) 多实例隔离（如需同机�?Gateway�?
可用 `OPENCLAW_CONFIG_PATH`、`OPENCLAW_STATE_DIR`、`OPENCLAW_GATEWAY_PORT` 做实例隔离�?
## Local Repo Checks

```powershell
git -C D:\lhr\app\openclaw status --short --branch
git -C D:\lhr\Projects\202603\qmd status --short --branch
git -C D:\lhr\app\openclaw branch -vv --all
git -C D:\lhr\Projects\202603\qmd branch -vv --all
```

## Local Targeted Validation

```powershell
bunx vitest run test/memory-pipeline.test.ts
pnpm exec vitest run extensions/memory-core/index.test.ts src/agents/tools/memory-tool.expand.test.ts src/agents/tool-catalog.test.ts src/agents/pi-tools.policy.test.ts --maxWorkers=1
```

## Push Feature Branches

```powershell
git -C D:\lhr\Projects\202603\qmd push -u fork feature/memory-recall-v1.6
git -C D:\lhr\app\openclaw push -u fork feature/memory-recall-v1.6
```

## GitOps 发布锁定（推荐）

�?`claw` 工作区维护一个版本锁文件（例�?`ops/versions.lock`）：

- `openclaw_commit=<sha>`
- `qmd_commit=<sha>`
- `rules_version=<tag-or-sha>`

发布动作只改这个锁文件并推送；其他机器通过 Ansible 拉取并对齐到锁定提交�?
## 统一部署流程（云端控制面执行�?
1. 本地 Windows 开发并推�?`openclaw/qmd` 分支�?2. 云端控制面执行集成校验（�?`pnpm build` / `pnpm ui:build`）�?3. 更新 `ops/versions.lock` 到目�?commit�?4. `ansible-playbook` 一次部署树莓派 + 台式机�?5. 部署后统一跑健康检查与抽样回归�?
## Ansible 最小执行模型（示意�?
```bash
ansible -i inventory.ini openclaw_nodes -m ping
ansible-playbook -i inventory.ini site.yml --limit openclaw_nodes
```

`site.yml` 关键动作�?
1. 拉取/更新 `openclaw` �?`qmd` 到锁�?commit�?2. 运行 `pnpm install && pnpm build && pnpm ui:build`（按机型分层执行）�?3. 下发 `openclaw.json`、`AGENTS.md`、workspace 规则模板�?4. 重启服务（systemd）并执行 `openclaw gateway status --json` 验证�?
## 云服务器仅内网穿透的选型

### 方案 A（更省事�?
- Tailscale（可直接打�?Tailnet，不一定需要你自建云中继）
- OpenClaw 也支�?`gateway --tailscale` 模式

### 方案 B（你已有公网云）

- frp：云�?`frps`，内网节�?`frpc`
- 云只做转发，不跑 OpenClaw 业务进程

## 树莓派资源约束建�?
1. 树莓派优先承�?Node，不建议�?Gateway + 重度构建都放在树莓派�?2. 主构建尽量在台式机完成；树莓派走“拉取构建产物或轻构建”�?3. qmd 大索引任务可定时在台式机执行，树莓派仅承接轻量执行请求�?
## Remote OpenClaw / qmd Checks

```bash
openclaw gateway status --deep
openclaw plugins inspect memory-core
node /root/apps/qmd/qmd-openclaw.mjs status
journalctl --user -u openclaw-gateway -n 120 --no-pager
```

## Raspberry Pi Clash（已验证�?
树莓�?`192.168.0.142` 已按 `mihomo(clash-meta) + metacubexd + systemd` 形态部署完成�?
关键路径�?
1. 二进制：`/usr/local/bin/mihomo`（并软链 `/usr/local/bin/clash`�?2. 配置目录：`/home/luo/.config/clash`
3. Web UI：`/home/luo/.config/clash/ui`（metacubexd�?4. 服务：`clash.service`

常用命令�?
```bash
sudo systemctl status clash
sudo systemctl restart clash
journalctl -u clash -n 120 --no-pager
```

端口�?
1. 代理端口：`7890`（mixed-port�?2. 控制面：`9090`（external-controller�?3. DNS：`1053`

Web UI 访问�?
1. `http://192.168.0.142:9090/ui/`
2. 当前 `secret` �?`please-change-this-secret`（需尽快改）

配置文件说明�?
1. 当前配置文件：`/home/luo/.config/clash/config.yaml`
2. 你提供的私密代理参数已保留占位结构；为了保证 YAML 可启动，`port` 暂用 `1080`�?3. 上线前请�?`server/port/username/password/secret` 改成真实值并重启�?
```bash
sudo systemctl restart clash
```

TUN 报错处理（已验证）：

1. 若日志出�?`Start TUN listening error: ... operation not permitted`，通常�?`tun.enable: true` 但服务权限不足�?2. 快速回退方案：对当前 mixed 代理场景，把 `tun.enable` 改为 `false` 并重启即可：

```bash
sudo systemctl restart clash
journalctl -u clash -n 60 --no-pager
```

3. 正式开�?TUN 方案（保�?`User=luo`）：

```bash
sudo mkdir -p /etc/systemd/system/clash.service.d
sudo tee /etc/systemd/system/clash.service.d/capabilities.conf >/dev/null <<'EOF'
[Service]
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_RAW
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW
NoNewPrivileges=false
EOF

sudo systemctl daemon-reload
sudo systemctl restart clash
```

验证点：

1. 日志出现：`Tun adapter listening at: Meta(...)`
2. `ip -br link` 出现 `Meta` 接口
3. `ip rule` 出现 `198.18.0.0/30` 相关规则

## Remote Failure Hints

1. 如果日志出现 `createMemoryExpandTool is not a function`，先查是不是只同步了插件入口，漏�?runtime/tool factory 文件�?2. 如果 `qmd` 记忆写入后无法立刻召回，确认是否已经顺手执行 `qmd update` �?`qmd embed`�?3. 如果 agent �?memory 工具不在列表里，除了插件注册失败，还要检�?`memory.qmd.scope` 是否把当�?chatType 排除了�?
## 2026-03-25 Raspberry Pi Main-Gateway Run Notes

### Current Service Topology

- Main gateway host: Raspberry Pi `192.168.0.142`
- Service: `openclaw-gateway.service` (systemd, user `luo`)
- Port/bind: `18789`, `lan`
- QMD invoked through runner: `/home/luo/.local/bin/qmd-openclaw-runner`
- Effective config: `/home/luo/.openclaw/openclaw.json`

### Post-Deploy Validation Checklist (Executed)

1. Commit locks verified:
   - OpenClaw: `4ed6a2c95cbe9961b77255537f66c0ecb4c03855`
   - QMD: `3f7b276f26529b579ba5174923fcbe2e581e471c`
2. Build pipeline completed:
   - OpenClaw: `pnpm install`, `pnpm build`, `pnpm ui:build`
   - QMD: `pnpm install`, `pnpm build`
3. Service check:
   - `systemctl is-enabled openclaw-gateway` => enabled
   - `systemctl is-active openclaw-gateway` => active
4. LAN ingress check from Windows:
   - `curl -I http://192.168.0.142:18789/` => `200 OK`
5. Memory plugin check:
   - `openclaw plugins inspect memory-core` loaded with memory tools.
6. Regression grep:
   - no `createMemoryExpandTool is not a function` found.

### Known Constraints

- If model/provider secrets are placeholders, these commands will fail with `401 Invalid token`:
  - `qmd embed`
  - default `qmd query` (query expansion / rerank path)
- Temporary workaround for local validation:
  - `qmd query --no-rerank --json $'lex: ...'`
  - `qmd search '...'`

### Sync Procedure (Windows dev -> Raspberry Pi)

1. Push updates to `fork/feature/memory-recall-v1.6` from Windows.
2. On Pi:
   - `git -C /home/luo/apps/openclaw fetch --all --prune`
   - `git -C /home/luo/apps/openclaw reset --hard <new-sha>`
   - `git -C /home/luo/apps/qmd fetch --all --prune`
   - `git -C /home/luo/apps/qmd reset --hard <new-sha>`
3. Rebuild:
   - `cd /home/luo/apps/qmd && pnpm install && pnpm build`
   - `cd /home/luo/apps/openclaw && pnpm install && pnpm build && pnpm ui:build`
4. Restart and verify:
   - `sudo systemctl restart openclaw-gateway`
   - `systemctl is-active openclaw-gateway`
   - `openclaw plugins inspect memory-core`

## 2026-03-25 Secret Injection Procedure (QMD Remote Providers)

### Where secret is stored

- `/home/luo/.openclaw/secrets.env`
- file mode: `600`
- key name expected by QMD config: `SILICONFLOW_API_KEY`

### Service wiring

- `openclaw-gateway.service` includes:
  - `EnvironmentFile=-/home/luo/.openclaw/secrets.env`
- apply changes with:
  - `sudo systemctl daemon-reload`
  - `sudo systemctl restart openclaw-gateway`

### Fast verification commands

```bash
systemctl is-active openclaw-gateway

export QMD_CONFIG_DIR=/home/luo/.openclaw/qmd-config
export XDG_CONFIG_HOME=/home/luo/.openclaw/xdg/config
export XDG_CACHE_HOME=/home/luo/.openclaw/xdg/cache
set -a; . /home/luo/.openclaw/secrets.env; set +a

/home/luo/.local/bin/qmd-openclaw-runner status
/home/luo/.local/bin/qmd-openclaw-runner update
/home/luo/.local/bin/qmd-openclaw-runner embed
/home/luo/.local/bin/qmd-openclaw-runner query "memory"
```

### Rotation procedure

1. Edit `/home/luo/.openclaw/secrets.env` with new `SILICONFLOW_API_KEY`.
2. `chmod 600 /home/luo/.openclaw/secrets.env`
3. `sudo systemctl restart openclaw-gateway`
4. Re-run the verification commands above.

## 2026-03-25 Control UI Error Playbook (Origin / Secure Context)

When Web UI shows:
- `origin not allowed (...)`
- or `control ui requires device identity (use HTTPS or localhost secure context)`

### LAN quick fix (break-glass)

Set these in `/home/luo/.openclaw/openclaw.json`:
- `gateway.controlUi.allowedOrigins`: include the browser origin(s) you actually use
- `gateway.controlUi.allowInsecureAuth: true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth: true`

Then restart:
```bash
sudo systemctl restart openclaw-gateway
systemctl is-active openclaw-gateway
```

### Security note

- `dangerouslyDisableDeviceAuth=true` is intentionally risky and should be temporary.
- Preferred long-term setup: HTTPS/Tailscale secure context, then disable:
  - `gateway.controlUi.allowInsecureAuth`
  - `gateway.controlUi.dangerouslyDisableDeviceAuth`

## XRDP Quick Fix (Debian 13 Raspberry Pi)

If MSTSC logs in but disconnects immediately:

1. Confirm service and port:
   - systemctl is-active xrdp xrdp-sesman
   - ss -ltnp | grep 3389
2. Confirm crash signature:
   - journalctl -t xrdp-sesexec --since -1h --no-pager
   - If you see: Window manager ... exited with signal SIGSEGV
3. Switch XRDP to XFCE session:
   - sudo DEBIAN_FRONTEND=noninteractive apt-get install -y xfce4-session xfce4-panel xfce4-terminal xfce4-settings xfdesktop4 thunar dbus-x11
   - Write /home/<user>/.xsession:
     - #!/bin/sh
     - export XDG_SESSION_TYPE=x11
     - exec startxfce4
   - chmod 700 /home/<user>/.xsession
   - sudo systemctl restart xrdp xrdp-sesman
4. Re-test with MSTSC.

## XRDP Black Screen Recovery (Connected but only black desktop)

1. Confirm backend is alive:
   - systemctl is-active xrdp xrdp-sesman
   - xrdp-sesadmin -c=list
2. Force XRDP backend to Xorg:
   - add autorun=Xorg under [Globals] in /etc/xrdp/xrdp.ini
   - restart xrdp
3. Use a hardened ~/.xsession (for XRDP users):
   - clean stale desktop helper processes before startxfce4
   - keep XDG_SESSION_TYPE=x11
4. Disable XFCE compositor for XRDP stability:
   - set xfwm4/general/use_compositing=false
5. Ensure ICE socket permission:
   - /tmp/.ICE-unix => root:root, 1777
6. If local Wayland/LX session interferes, temporarily stop display manager:
   - sudo systemctl stop lightdm
7. Cleanup and retest:
   - kill stale xrdp-sesexec/xrdp-chansrv/Xorg processes
   - restart xrdp-sesman xrdp
   - reconnect from MSTSC.

