# 企业知识库插件 —— 设计方案

> 状态：**设计阶段（未实施）**
> 日期：2026-08-31
> 目录：本 wiki 记录知识库插件（knowledge-base）的完整设计，实施前请先通读。

## 文档索引

| 文档 | 内容 |
|---|---|
| [001-overview.md](./001-overview.md) | 整体架构：方案评估（导航页 vs 工作区分栏）、视图系统基础设施、插件依赖三层解法、实施路线 |
| [002-retrieval-priority.md](./002-retrieval-priority.md) | 知识库优先检索：四层强制链（意图路由 / 强制 RAG 注入 / 工具 / 无结果门控） |
| [003-qa-area.md](./003-qa-area.md) | 问答区域设计：引用/命中/检索范围展示、零宿主侵入机制、模式切换策略 |

## 核心结论速览

- **呈现方式**：`registerView(mode: "side")` 分栏工作区（会话区 + 知识库面板），导航栏入口；
- **知识库 5 个模块**（工作台/文档管理/Wiki/知识图谱/评估与优化）为一个插件内的二级导航，不拆多插件；
- **零宿主侵入**：检索卡片用 custom 消息 + messageRenderer，模式徽标用 chat-toolbar slot，全部基于既有插件体系；
- **优先检索**：pi 扩展的 `input`/`context` 钩子做强制注入（模型无法跳过），配合工具、门控、路由；
- **模式切换**：显式会话级状态 + 常驻工具 + input 钩子注入（不切工具集 → 不重建 wrapper）；
- **依赖**：npm 包 bundle 进 dist / 插件间依赖用 manifest dependencies + 拓扑加载 / 宿主能力经 api 桥扩展。

## 前置基础设施（实施前需在宿主完成）

1. 视图系统：`window.robopi.registerView({id, label, icon, render, mode: "full"|"side"})` + ViewHost + AppShell 主区改造 + 导航切换器（预估 1-2 天）
2. 数据目录 API：`api.getDataDir()` → `~/.pi/agent/robopi/data/<plugin>/`（预估 0.5 天）
3. 插件间依赖：manifest `dependencies` + 拓扑加载 + `registerPluginApi`/`getPluginApi`（预估 1 天）
4. npm 依赖规范化：插件 package.json 仅声明依赖，esbuild bundle 进 dist（预估 0.5 天）
