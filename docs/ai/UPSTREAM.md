# UPSTREAM

## OpenClaw

- upstream: `origin = https://github.com/openclaw/openclaw.git`
- fork: `fork = https://github.com/luohaoran616/openclaw.git`
- stable branch: `main`
- feature branch in flight: `feature/memory-recall-v1.6`

Rule:

- upstream 同步先落到 probe / feature 分支，不直接把未验证改动落到 `main`
- 本地 `main` 保持可运行

## qmd

- upstream: `origin = https://github.com/tobi/qmd.git`
- fork: `fork = https://github.com/luohaoran616/qmd.git`
- stable branch: `main`
- feature branch in flight: `feature/memory-recall-v1.6`

Rule:

- OpenClaw 适配改动优先在 feature 分支验证
- 稳定后再决定是否合回 fork `main`
