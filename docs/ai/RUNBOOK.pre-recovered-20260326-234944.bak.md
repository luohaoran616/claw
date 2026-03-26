# RUNBOOK

## Multi-Host 鍗忓悓鐩爣锛圵indows + Ubuntu浜?+ 鏍戣帗娲?+ 鍙板紡鏈猴級

鎺ㄨ崘鎶娾€滀簯鏈嶅姟鍣ㄢ€濆彧浣滀负缃戠粶涓户/杩愮淮鎺у埗闈紝涓嶆壙杞?OpenClaw 涓氬姟缃戝叧銆?
### 褰撳墠棣栭€夋嫇鎵戯紙鎸変綘鐨勬柊鍋忓ソ锛?
1. Windows 鏈満锛氫富 Gateway锛圤penClaw + qmd锛屽紑鍙?淇鍚庣涓€鏃堕棿鏈湴楠岃瘉锛夈€?2. 鏍戣帗娲撅細Node锛堣繙绋嬪懡浠ゃ€佽交閲忎换鍔°€佸悗缁彲鎷撳睍鏇村浜戠鏈嶅姟锛夈€?3. 鍙板紡鏈猴細Node锛堣繙绋嬪懡浠ゃ€佹枃浠剁郴缁熺鐞嗐€侀儴缃蹭换鍔℃墽琛岋級銆?4. Ubuntu 浜戞湇鍔″櫒锛氫粎 `frps`锛堝叕缃戝叆鍙ｏ級+ 杩愮淮鎺у埗鍏ュ彛锛圫SH/Ansible锛夛紝涓嶉儴缃?OpenClaw 涓氬姟銆?
鍛戒护娴侊細

1. 鎵€鏈変細璇濄€佹笭閬撱€佺姸鎬佷粛鍦?Windows 涓?Gateway銆?2. 鏅鸿兘浣撻渶瑕佽繙绋嬫墽琛屾椂锛岄€氳繃 `node.*` RPC 璋冪敤鏍戣帗娲?鍙板紡鏈?Node銆?3. 浜戞湇鍔″櫒鍙礋璐ｆ墦閫氬叕缃戝埌瀹跺涵缃戠粶鐨勮繛鎺ワ紝涓嶆壙杞?Gateway 鐘舵€併€?
### Windows 鎿嶆帶鏍戣帗娲撅紙鎺ㄨ崘鎿嶄綔闈級

鍏抽敭鐐癸細`tmux` 杩愯鍦ㄦ爲鑾撴淳锛圠inux锛変笂锛屼笉闇€瑕?Windows 鍘熺敓鏀寔 tmux銆俉indows 鍙渶瑕?SSH 瀹㈡埛绔€?
鎺ㄨ崘缁勫悎锛?
1. Windows锛氬唴缃?OpenSSH 瀹㈡埛绔紙PowerShell/Windows Terminal锛夈€?2. 鏍戣帗娲撅細`sshd + tmux + openclaw(systemd)`銆?3. 浜戞湇鍔″櫒锛歚frps` + 鍙€?Ansible 鎺у埗鍏ュ彛銆?
鏈€灏忓懡浠わ紙浠?Windows 鍙戣捣锛夛細

```powershell
# 鐩磋繛 shell
ssh pi@raspberrypi.local

# 涓€鏉″懡浠よ繘鍏?鍒涘缓杩滅 tmux 浼氳瘽锛堟帹鑽愶級
ssh -t pi@raspberrypi.local "tmux new -As openclaw"

# 鍦ㄦ湰鏈烘墽琛岃繙绔懡浠わ紙渚夸簬鎴戝悗缁嚜鍔ㄥ寲鎵ц锛?ssh pi@raspberrypi.local "openclaw gateway status --deep"
```

寤鸿鍏堝仛鐨勭‖鍖栵細

1. 缁欐爲鑾撴淳璁剧疆璺敱鍣?DHCP 淇濈暀 IP锛堥伩鍏?IP 婕傜Щ锛夈€?2. 閰嶇疆 SSH 瀵嗛挜鐧诲綍锛岄€愭绂佺敤瀵嗙爜鐧诲綍銆?3. `openclaw` 涓?`frpc` 閮界敤 `systemd` 甯搁┗銆?4. 鎶婇暱浠诲姟閮芥斁杩?tmux锛屼細璇濇柇寮€涓嶅奖鍝嶆墽琛屻€?
鏍戣帗娲?tmux锛堟簮鐮佺紪璇戯級锛?
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

澶囬€夋嫇鎵戯紙褰撲綘鍚庣画鎯虫妸涓?Gateway 杩佸埌 Linux/x86 鏃讹級锛?
1. 鍙板紡鏈猴紙x86锛夎窇涓?Gateway锛圤penClaw + qmd锛夈€?2. 鏍戣帗娲捐窇 Node锛堟墽琛屽伐鍏?浠诲姟锛屼笉鍗曠嫭鎵胯浇涓?Gateway锛夈€?3. Windows 鏈満璁句负 remote client锛岃繛涓?Gateway銆?4. Ubuntu 浜戞湇鍔″櫒鍙仛鍐呯綉绌块€忎笌闆嗕腑杩愮淮鍏ュ彛锛圫SH/Ansible 鎺у埗闈級銆?
杩欐牱浣犵殑鈥滀竴涓鏀瑰姩锛屽绔揩閫熷悓姝モ€濆彲鍒嗕负涓ゅ眰锛?
- 浠ｇ爜涓庤鍒欏悓姝ワ細Git锛坥penclaw/qmd/ops-config 涓変粨鎴栧崟 monorepo锛?- 閮ㄧ讲涓庨噸鍚悓姝ワ細Ansible锛堜粠浜戠鎺у埗闈竴娆℃帹閫佸埌鏍戣帗娲?鍙板紡鏈猴級

## 瀹樻柟鑳藉姏瀵归綈锛圤penClaw锛?
### 1) Remote 妯″紡锛堝鎴风涓嶈嚜鍚湰鍦?Gateway锛?
```bash
openclaw config.set gateway.mode remote
openclaw config.set gateway.remote.url ws://<gateway-host>:<port>
openclaw config.set gateway.remote.auth "Bearer <token>"
```

### 2) Node 妯″紡锛堟妸鏍戣帗娲句綔涓烘墽琛岃妭鐐规帴鍏ヤ富 Gateway锛?
```bash
openclaw node register --gateway ws://<gateway-host>:<port>
openclaw node list
```

### 3) 鍋ュ悍妫€鏌ワ紙鑴氭湰鍖栧弸濂斤級

```bash
openclaw gateway status --deep
openclaw gateway status --json
openclaw plugins inspect memory-core
```

### 4) 澶氬疄渚嬮殧绂伙紙濡傞渶鍚屾満鍙?Gateway锛?
鍙敤 `OPENCLAW_CONFIG_PATH`銆乣OPENCLAW_STATE_DIR`銆乣OPENCLAW_GATEWAY_PORT` 鍋氬疄渚嬮殧绂汇€?
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

## GitOps 鍙戝竷閿佸畾锛堟帹鑽愶級

鍦?`claw` 宸ヤ綔鍖虹淮鎶や竴涓増鏈攣鏂囦欢锛堜緥濡?`ops/versions.lock`锛夛細

- `openclaw_commit=<sha>`
- `qmd_commit=<sha>`
- `rules_version=<tag-or-sha>`

鍙戝竷鍔ㄤ綔鍙敼杩欎釜閿佹枃浠跺苟鎺ㄩ€侊紱鍏朵粬鏈哄櫒閫氳繃 Ansible 鎷夊彇骞跺榻愬埌閿佸畾鎻愪氦銆?
## 缁熶竴閮ㄧ讲娴佺▼锛堜簯绔帶鍒堕潰鎵ц锛?
1. 鏈湴 Windows 寮€鍙戝苟鎺ㄩ€?`openclaw/qmd` 鍒嗘敮銆?2. 浜戠鎺у埗闈㈡墽琛岄泦鎴愭牎楠岋紙鍚?`pnpm build` / `pnpm ui:build`锛夈€?3. 鏇存柊 `ops/versions.lock` 鍒扮洰鏍?commit銆?4. `ansible-playbook` 涓€娆￠儴缃叉爲鑾撴淳 + 鍙板紡鏈恒€?5. 閮ㄧ讲鍚庣粺涓€璺戝仴搴锋鏌ヤ笌鎶芥牱鍥炲綊銆?
## Ansible 鏈€灏忔墽琛屾ā鍨嬶紙绀烘剰锛?
```bash
ansible -i inventory.ini openclaw_nodes -m ping
ansible-playbook -i inventory.ini site.yml --limit openclaw_nodes
```

`site.yml` 鍏抽敭鍔ㄤ綔锛?
1. 鎷夊彇/鏇存柊 `openclaw` 涓?`qmd` 鍒伴攣瀹?commit銆?2. 杩愯 `pnpm install && pnpm build && pnpm ui:build`锛堟寜鏈哄瀷鍒嗗眰鎵ц锛夈€?3. 涓嬪彂 `openclaw.json`銆乣AGENTS.md`銆亀orkspace 瑙勫垯妯℃澘銆?4. 閲嶅惎鏈嶅姟锛坰ystemd锛夊苟鎵ц `openclaw gateway status --json` 楠岃瘉銆?
## 浜戞湇鍔″櫒浠呭唴缃戠┛閫忕殑閫夊瀷

### 鏂规 A锛堟洿鐪佷簨锛?
- Tailscale锛堝彲鐩存帴鎵撻€?Tailnet锛屼笉涓€瀹氶渶瑕佷綘鑷缓浜戜腑缁э級
- OpenClaw 涔熸敮鎸?`gateway --tailscale` 妯″紡

### 鏂规 B锛堜綘宸叉湁鍏綉浜戯級

- frp锛氫簯涓?`frps`锛屽唴缃戣妭鐐?`frpc`
- 浜戝彧鍋氳浆鍙戯紝涓嶈窇 OpenClaw 涓氬姟杩涚▼

## 鏍戣帗娲捐祫婧愮害鏉熷缓璁?
1. 鏍戣帗娲句紭鍏堟壙鎷?Node锛屼笉寤鸿涓?Gateway + 閲嶅害鏋勫缓閮芥斁鍦ㄦ爲鑾撴淳銆?2. 涓绘瀯寤哄敖閲忓湪鍙板紡鏈哄畬鎴愶紱鏍戣帗娲捐蛋鈥滄媺鍙栨瀯寤轰骇鐗╂垨杞绘瀯寤衡€濄€?3. qmd 澶х储寮曚换鍔″彲瀹氭椂鍦ㄥ彴寮忔満鎵ц锛屾爲鑾撴淳浠呮壙鎺ヨ交閲忔墽琛岃姹傘€?
## Remote OpenClaw / qmd Checks

```bash
openclaw gateway status --deep
openclaw plugins inspect memory-core
node /root/apps/qmd/qmd-openclaw.mjs status
journalctl --user -u openclaw-gateway -n 120 --no-pager
```

## Raspberry Pi Clash锛堝凡楠岃瘉锛?
鏍戣帗娲?`192.168.0.142` 宸叉寜 `mihomo(clash-meta) + metacubexd + systemd` 褰㈡€侀儴缃插畬鎴愩€?
鍏抽敭璺緞锛?
1. 浜岃繘鍒讹細`/usr/local/bin/mihomo`锛堝苟杞摼 `/usr/local/bin/clash`锛?2. 閰嶇疆鐩綍锛歚/home/luo/.config/clash`
3. Web UI锛歚/home/luo/.config/clash/ui`锛坢etacubexd锛?4. 鏈嶅姟锛歚clash.service`

甯哥敤鍛戒护锛?
```bash
sudo systemctl status clash
sudo systemctl restart clash
journalctl -u clash -n 120 --no-pager
```

绔彛锛?
1. 浠ｇ悊绔彛锛歚7890`锛坢ixed-port锛?2. 鎺у埗闈細`9090`锛坋xternal-controller锛?3. DNS锛歚1053`

Web UI 璁块棶锛?
1. `http://192.168.0.142:9090/ui/`
2. 褰撳墠 `secret` 涓?`please-change-this-secret`锛堥渶灏藉揩鏀癸級

閰嶇疆鏂囦欢璇存槑锛?
1. 褰撳墠閰嶇疆鏂囦欢锛歚/home/luo/.config/clash/config.yaml`
2. 浣犳彁渚涚殑绉佸瘑浠ｇ悊鍙傛暟宸蹭繚鐣欏崰浣嶇粨鏋勶紱涓轰簡淇濊瘉 YAML 鍙惎鍔紝`port` 鏆傜敤 `1080`銆?3. 涓婄嚎鍓嶈鎶?`server/port/username/password/secret` 鏀规垚鐪熷疄鍊煎苟閲嶅惎锛?
```bash
sudo systemctl restart clash
```

TUN 鎶ラ敊澶勭悊锛堝凡楠岃瘉锛夛細

1. 鑻ユ棩蹇楀嚭鐜?`Start TUN listening error: ... operation not permitted`锛岄€氬父鏄?`tun.enable: true` 浣嗘湇鍔℃潈闄愪笉瓒炽€?2. 蹇€熷洖閫€鏂规锛氬褰撳墠 mixed 浠ｇ悊鍦烘櫙锛屾妸 `tun.enable` 鏀逛负 `false` 骞堕噸鍚嵆鍙細

```bash
sudo systemctl restart clash
journalctl -u clash -n 60 --no-pager
```

3. 姝ｅ紡寮€鍚?TUN 鏂规锛堜繚鐣?`User=luo`锛夛細

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

楠岃瘉鐐癸細

1. 鏃ュ織鍑虹幇锛歚Tun adapter listening at: Meta(...)`
2. `ip -br link` 鍑虹幇 `Meta` 鎺ュ彛
3. `ip rule` 鍑虹幇 `198.18.0.0/30` 鐩稿叧瑙勫垯

## Remote Failure Hints

1. 濡傛灉鏃ュ織鍑虹幇 `createMemoryExpandTool is not a function`锛屽厛鏌ユ槸涓嶆槸鍙悓姝ヤ簡鎻掍欢鍏ュ彛锛屾紡浜?runtime/tool factory 鏂囦欢銆?2. 濡傛灉 `qmd` 璁板繂鍐欏叆鍚庢棤娉曠珛鍒诲彫鍥烇紝纭鏄惁宸茬粡椤烘墜鎵ц `qmd update` 鍜?`qmd embed`銆?3. 濡傛灉 agent 璇?memory 宸ュ叿涓嶅湪鍒楄〃閲岋紝闄や簡鎻掍欢娉ㄥ唽澶辫触锛岃繕瑕佹鏌?`memory.qmd.scope` 鏄惁鎶婂綋鍓?chatType 鎺掗櫎浜嗐€?
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

