# STATUS

Current goal: 鎶?`D:\lhr\Projects\202603\claw` 寤烘垚 OpenClaw/QMD 鐨勯暱鏈熺淮鎶ゅ伐浣滃尯銆?
## Done

1. 鏈湴 `qmd` 宸插畬鎴?Memory Recall V1.6 鐩稿叧鏀瑰姩锛屽苟鎺ㄩ€佸埌 `fork/feature/memory-recall-v1.6`銆?2. 鏈湴 `openclaw` 宸插畬鎴?`memory_expand` / anchor-first recall / runtime 娉ㄥ唽閾炬敼鍔紝骞舵帹閫佸埌 `fork/feature/memory-recall-v1.6`銆?3. 鐜版湁婧愮爜涓讳綅缃凡鏄庣‘锛?   - `D:\lhr\Projects\202603\qmd`
   - `D:\lhr\app\openclaw`
4. 浜戞湇鍔″櫒璁板繂绯荤粺宸插仛杩囦竴娆″榻愶紱宸茬煡杩橀渶瑕佺户缁畬鎴愪竴娆′簯绔?rebuild/restart 楠岃瘉銆?5. `2026-03-25` 鏈湴鍒嗘敮鏍告煡瀹屾垚锛?   - `openclaw`: `feature/memory-recall-v1.6` @ `4ed6a2c95c`锛岃窡韪?`fork/feature/memory-recall-v1.6`锛宍ahead/behind = 0/0`
   - `qmd`: `feature/memory-recall-v1.6` @ `3f7b276`锛岃窡韪?`fork/feature/memory-recall-v1.6`锛宍ahead/behind = 0/0`
   - 涓よ竟 `main` 閮戒笌 `fork/main` 鍚屾锛坄ahead/behind = 0/0`锛?   - 鏈湴瀛樺湪鏈窡韪枃浠讹紙OpenClaw 浠ユ棫 `node_modules/dist` 澶囦唤鐩綍涓轰富锛宷md 鏈?`else/openclaw2.json` 涓庤瘎浼拌剼鏈級
6. 宸插畬鎴愨€滃鏈哄崗鍚屸€濊繍缁存柟妗堣璁″苟钀藉湴鍒?runbook锛?   - 鏂板 `docs/ai/RUNBOOK.md` 鐨?Multi-Host 绔犺妭锛堟帹鑽愭嫇鎵戯細鍙板紡鏈轰富 Gateway + 鏍戣帗娲?Node + Windows remote client + 浜戠浠呯┛閫?鎺у埗闈級
   - 鏄庣‘ GitOps + Ansible 鐨勭粺涓€鍙戝竷璺緞涓庡仴搴锋鏌ュ懡浠?7. 鏂板 `ops/` 鏈€灏忔ā鏉匡細
   - `ops/versions.lock.example`锛圤penClaw/QMD 鎻愪氦閿佸畾锛?   - `ops/README.md`锛堝悗缁?Ansible 钀藉湴璺緞锛?8. `2026-03-25` 鏋舵瀯鍋忓ソ宸叉槑纭細
   - Windows 鏈満浣滀负涓?Gateway锛圤penClaw + qmd锛夌敤浜庡揩閫熷紑鍙戦獙璇?   - 鏍戣帗娲句笌鍙板紡鏈轰紭鍏堜綔涓?Node 鎵ц绔?   - Ubuntu 浜戞湇鍔″櫒浠呮壙鎷?`frp` 绌块€忎笌杩愮淮鎺у埗闈紝涓嶅啀閮ㄧ讲 OpenClaw 涓氬姟
9. 椋炰功鎺ュ叆绾︽潫宸茬‘璁わ細Gateway 闇€淇濇寔闀挎湡杩愯锛堝畼鏂?Feishu 鏂囨。涓洪暱杩炴帴妯″紡锛屾晠闅滄帓鏌ヤ篃瑕佹眰鍏堟鏌?`openclaw gateway status`锛夈€?10. 鏋舵瀯璇勪及鏇存柊锛歚鏍戣帗娲句富 Gateway + Windows/鍙板紡鏈?Remote(+Node)` 鍙锛屼笖鑳芥樉钁楀噺灏戔€滃涓?Gateway鈥濆悓姝ュ鏉傚害锛涗絾 Node 绔粛闇€鍋氭渶灏忕増鏈?閰嶇疆鍚屾涓庨厤瀵圭鐞嗐€?11. 鎿嶄綔闈㈠喅绛栬ˉ鍏咃細閲囩敤 `Windows OpenSSH -> 鏍戣帗娲?ssh/tmux` 浣滀负鏃ュ父杩滅▼鎿嶆帶鏂规锛泃mux 浠呴渶閮ㄧ讲鍦ㄦ爲鑾撴淳渚с€?12. 宸茬‘璁ょ敤鎴锋墍鎸?`tmux` 涓哄畼鏂逛粨搴?`github.com/tmux/tmux`锛涘叾瀹氫綅鏄粓绔鐢ㄥ櫒锛岄€傚悎鍦ㄦ爲鑾撴淳渚у父椹讳細璇濓紝Windows 閫氳繃 SSH 杩炴帴浣跨敤銆?13. 宸插湪鏍戣帗娲?`192.168.0.142` 瀹屾垚 Clash 閮ㄧ讲锛坄mihomo + metacubexd + systemd`锛夛細
   - 鏈嶅姟锛歚clash.service`锛坄enabled + active`锛?   - 绔彛锛歚7890` / `9090` / `1053`
   - UI锛歚http://192.168.0.142:9090/ui/`
   - 閰嶇疆锛歚/home/luo/.config/clash/config.yaml`
14. 宸叉帓闅滃苟淇 Clash `TUN operation not permitted`锛?   - 鍘熷洜锛氶厤缃腑 `tun.enable: true`锛屼互鏅€氱敤鎴疯繍琛屾湇鍔℃椂鏃犳潈闄愬垱寤?TUN
   - 澶勭悊锛氬皢 `tun.enable` 鏀逛负 `false` 骞堕噸鍚?`clash.service`
   - 楠岃瘉锛歍UN 鎶ラ敊娑堝け锛宍curl -x http://127.0.0.1:7890 https://www.google.com` 鍙€氬苟鏈夊懡涓棩蹇?15. 宸插湪鏍戣帗娲惧畬鎴?tmux 婧愮爜缂栬瘧瀹夎锛堜紭鍏堟柟妗堬級锛?   - 婧愮爜鏉ユ簮锛歚github.com/tmux/tmux`锛宼ag `3.6a`
   - 瀹夎缁撴灉锛歚/usr/local/bin/tmux`锛岀増鏈?`tmux 3.6a`
   - 鑷锛氬彲鍒涘缓/鍒楀嚭/閿€姣佹祴璇曚細璇濓紙`tmux -L codex-check ...`锛?16. Clash TUN 妯″紡宸叉垚鍔熷紑鍚苟楠岃瘉锛?   - `luo` 鏈氨鍏峰绠＄悊鍛樻潈闄愶紙`sudo` 缁?+ 鍏嶅瘑 sudo锛夛紝鏃犻渶棰濆鎻愭潈
   - 鍦?`clash.service` 澧炲姞 `AmbientCapabilities/CapabilityBoundingSet = CAP_NET_ADMIN CAP_NET_RAW`
   - 灏?`tun.enable` 鏀瑰洖 `true` 骞堕噸鍚悗锛屾棩蹇楀嚭鐜?`Tun adapter listening at: Meta(...)`
   - `ip -br link` 鍙 `Meta` 鎺ュ彛锛宍ip rule` 鍑虹幇 TUN 璺敱瑙勫垯
   - 鏃犱唬鐞嗗弬鏁?`curl https://www.google.com` 涔熻兘鍛戒腑鏃ュ織锛歚198.18.0.1 -> ... using PROXY`

## Open Problems / Risks

1. 浜戞湇鍔″櫒 SSH 鏇惧嚭鐜?`banner exchange timeout`锛岄渶瑕佸厛淇濊瘉杩滅绋冲畾鍐嶇户缁敹灏俱€?2. 浜戠 `memory.qmd.scope` 鏄惁淇濇寔浠?DM锛岃繕闇€瑕佺粨鍚堝疄闄呮笭閬撶瓥鐣ュ啀瀹氥€?3. 杩滅濡傛灉鍙悓姝ユ彃浠跺叆鍙ｃ€佷笉鍚屾 runtime/tool 宸ュ巶锛屼細鍐嶆鍑虹幇 `createMemoryExpandTool is not a function`銆?4. 鑻ユ妸婧愮爜鐩綍鏁翠綋鎵撳寘/鍚屾鍒颁簯绔紝OpenClaw 鏈湴鏈窡韪殑澶х洰褰曞彲鑳藉鑷翠紶杈撴參銆佺鐩樺崰鐢ㄥ拰閲嶅缓鑰楁椂涓婂崌銆?5. 鑻ョ户缁淮鎸佲€滃涓?Gateway锛堟瘡鏈洪兘璺戝畬鏁?OpenClaw锛夆€濓紝杩愮淮澶嶆潅搴︿細鏄庢樉楂樹簬鈥滃崟涓?Gateway + Node鈥濄€?6. Windows 涓?Gateway 鏂规鍦ㄢ€滄湰鏈烘柇鐢?绂荤嚎鈥濇椂浼氬奖鍝嶅叏閮ㄤ細璇濆叆鍙ｏ紝闇€瑕佸悗缁璁＄儹澶囧垏鎹㈡祦绋嬨€?7. 鑻ラ涔︽満鍣ㄤ汉瑕佹眰绋冲畾 24x7 鍙敤锛屼笉瀹滃彧渚濊禆 Windows 涓绘満鍗曠偣鍦ㄧ嚎銆?8. 鑻ユ妸浜屽紑涓绘垬鍦鸿縼鍒版爲鑾撴淳锛屾瀯寤?娴嬭瘯閫熷害鍙兘鏄庢樉鎱簬 x86锛堝挨鍏?qmd 绱㈠紩涓庡墠绔瀯寤猴級锛岄渶瑕佹潈琛″紑鍙戞晥鐜囥€?9. 鑻ュ彧闈犲搴眬鍩熺綉鍦板潃绠＄悊鏍戣帗娲撅紝IP 婕傜Щ鍜岀綉缁滄姈鍔ㄤ細褰卞搷杩滅▼杩愮淮绋冲畾鎬э紙闇€ DHCP 淇濈暀 + SSH key + systemd 甯搁┗锛夈€?10. Clash 褰撳墠浠嶆槸鍗犱綅浠ｇ悊鍙傛暟涓庝复鏃?`secret`锛屾湭鏇挎崲涓虹湡瀹炲嚟鎹墠浠呯畻鍩虹瀹夎瀹屾垚銆?11. Clash 閰嶇疆鏇捐 Web UI 鏀瑰姩锛堝嚭鐜?`tun` 娈碉級锛屽悗缁渶鏄庣‘鍝簺椤瑰厑璁?UI 鏀瑰啓銆佸摢浜涢」蹇呴』鐢辨枃浠舵ā鏉跨鐞嗐€?12. 寮€鍚?TUN 鍚庯紝鑻ユ湭鏉ユ浛鎹?systemd 鏂囦欢鎴栭噸瑁呯郴缁燂紝闇€鍚屾鎭㈠ `clash.service.d/capabilities.conf`锛屽惁鍒欎細鍐嶆鎶?`operation not permitted`銆?
## Next Actions

1. 浠ヨ繖涓?`claw` 鐩綍涓哄叆鍙ｏ紝缁存姢 OpenClaw/QMD 鐨勯暱鏈熷垎鏀€佷簯绔榻愩€佸彂甯冨拰鍥炴粴璁板綍銆?2. 纭缃戠粶灞傞€夊瀷锛歚Tailscale`锛堜紭鍏堬級鎴?`frp`锛堜簯鍋氱┛閫忎腑缁э級锛屽苟鍦ㄤ簯绔畬鎴愭渶灏忓彲鐢ㄩ摼璺€?3. 鎸?runbook 鍏堣惤鍦板崟涓?Gateway + 鏍戣帗娲?Node 褰㈡€侊紝鍐嶅喅瀹氭槸鍚︿繚鐣欑浜?Gateway 浣滀负澶囦唤銆?4. 鎶?`ops/versions.lock.example` 澶嶅埗涓?`ops/versions.lock`锛屽～鍏ュ疄闄呭彂甯冩彁浜ゅ苟寮€濮?Ansible 鍖栥€?5. 鍙戝竷鑴氭湰鎴栧悓姝ョ瓥鐣ユ帓闄ゆ湰鍦版湭璺熻釜缂撳瓨/澶囦唤鐩綍锛岄伩鍏嶆妸鏃犲叧澶ф枃浠朵紶鍒拌繙绔€?6. 璇勪及鏄惁鎶婁袱涓?feature 鍒嗘敮鍚堝苟鍥炲悇鑷?`main`锛屽苟鎸夌ǔ瀹氳妭濂忔帹杩?PR 鎴?fork 涓荤嚎銆?7. 璁捐 Windows 涓?Gateway 鐨勫浠?鍒囨崲鏂规锛堝彴寮忔満浜岀骇 Gateway 鎴栧喎澶囷級銆?8. 鏄庣‘椋炰功鐢熶骇鍏ュ彛閮ㄧ讲浣嶏紙Windows 甯搁┗ / 鍙板紡鏈哄父椹?/ 鏍戣帗娲惧父椹伙級骞跺畬鎴愭紨缁冦€?9. 鏄庣‘鈥滃紑鍙戜綅鈥濅笌鈥滅敓浜т綅鈥濇槸鍚﹀悓鏈猴細鑻ョ敓浜у湪鏍戣帗娲撅紝寤鸿淇濈暀 Windows 寮€鍙戝苟閫氳繃 GitOps 鍙戝竷鍒版爲鑾撴淳锛岃€岄潪鍏ㄩ儴寮€鍙戣縼绉诲埌鏍戣帗娲俱€?10. 鍦ㄦ爲鑾撴淳閲嶈鍚庯紝鍏堝畬鎴?SSH/tmux/systemd 鍩虹璁炬柦锛屽啀寮€濮?OpenClaw 瀹夎锛岄伩鍏嶅悗缁墜宸ヨ繍缁存垚鏈弽澶嶅鍔犮€?11. 鎶?Clash 閰嶇疆涓殑 `server/port/username/password/secret` 鏇挎崲涓虹湡瀹炲€煎苟閲嶅惎锛岄殢鍚庡啀寮€濮?OpenClaw 瀹夎娴佺▼銆?12. 鍩轰簬褰撳墠缃戠粶涓?tmux 鍩虹璁炬柦锛岀户缁帹杩涙爲鑾撴淳 OpenClaw 涓?Gateway 瀹夎銆?13. 鍦ㄧ户缁?OpenClaw 瀹夎鍓嶏紝鎶?Clash 褰撳墠鏈夋晥閰嶇疆涓?service drop-in 澶囦唤鍒扮増鏈寲鐩綍銆?
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
  - Turn 2 (`具体点呢`) incorrectly re-runs `memory_search` instead of expanding anchors.
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
    1) `我们前面是怎么修改 openclaw 配置的？`
    2) `具体点呢`
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

## 2026-03-26 Encoding Incident Note

- Investigated mojibake in docs/ai/STATUS.md and docs/ai/RUNBOOK.md.
- Confirmed files contain persisted mojibake bytes (not viewer-only issue).
- Generated non-destructive recovery candidates:
  - docs/ai/STATUS.recovered.md
  - docs/ai/RUNBOOK.recovered.md
- Full lossless recovery requires a clean source (git/local history/backup) because some characters were already replaced during prior mis-decoding.
