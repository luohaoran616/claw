# CONTEXT

## Purpose

`claw` 目录是 OpenClaw / qmd 的运维与长期分支管理工作区，不存放源码副本，只维护：

- AI 记忆
- 分支关系
- 云端对齐记录
- 发布 / 回滚 / 验证 runbook

## Source Repositories

- OpenClaw:
  - local checkout: `D:\lhr\app\openclaw`
  - upstream remote: `https://github.com/openclaw/openclaw.git`
  - fork remote: `https://github.com/luohaoran616/openclaw.git`
- qmd:
  - local checkout: `D:\lhr\Projects\202603\qmd`
  - upstream remote: `https://github.com/tobi/qmd.git`
  - fork remote: `https://github.com/luohaoran616/qmd.git`

## Current Branch Model

- OpenClaw:
  - stable: `main`
  - current feature: `feature/memory-recall-v1.6`
- qmd:
  - stable: `main`
  - current feature: `feature/memory-recall-v1.6`

## Recent Architecture Notes

1. Memory Recall V1.6 把记忆检索拆成：
   - `memory_search`
   - `memory_get`
   - `memory_expand`
   - optional `sessionQuery`
2. `memory/archive/extracts/**` 继续保持非主索引层。
3. `memory_expand` 不只是插件入口改动，还依赖 runtime/tool factory 暴露链。
4. QMD 侧需要 richer distill、merge/enrich、heavy-overflow sidecar、promoter hydrate。

## Cloud Alignment Notes

- 云端 OpenClaw 路径：`/root/apps/openclaw`
- 云端 qmd 路径：`/root/apps/qmd`
- 云端运行配置：`/root/.openclaw/openclaw.json`
- 云端 gateway 环境文件：`/root/.config/openclaw/gateway.env`
