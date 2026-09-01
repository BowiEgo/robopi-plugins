# 001 整体架构：方案评估与基础设施

> 状态：设计（未实施）| 2026-08-31

## 1. 目标

企业知识库插件（knowledge-base），功能模块：

- **工作台**：最近文档、统计、快捷入口
- **文档管理**：文档树/列表 + Markdown 编辑器
- **Wiki 知识库**：双链、目录、全文检索
- **知识图谱**：实体/关系可视化
- **评估与优化**：检索覆盖率、过期检测、质量报告

## 2. 呈现方案评估

| 维度 | A. 导航栏 + 新页面（整页切换） | B. 会话区旁分栏工作区 |
|---|---|---|
| 呈现 | 导航点击 → 主区切换为插件整页（chat 被替换） | 会话区保留，右侧分栏插件工作区 |
| 知识库契合度 | 中 | **高**（边问 AI 边看文档/图谱） |
| 实现成本 | 中 | 中-高（分栏，可复用 useResizablePanel） |

**结论：不互斥，统一为"视图系统"的两种摆放模式**：

```ts
registerView({ id, label, icon, render, mode: "full" | "side" })
// full → 导航栏点击整页切换（方案 A）
// side → 右侧分栏，会话区 + 插件工作区（方案 B，知识库采用）
```

知识库 5 个模块 = 插件视图内的**二级导航**（一个插件多页，数据共享简单），不拆多个插件。

## 3. 前置基础设施（宿主侧）

| # | 设施 | 内容 | 工作量 |
|---|---|---|---|
| 1 | 视图系统 | registerView + ViewHost（full/side）+ AppShell 主区改造 + 导航切换器 | 1-2 天 |
| 2 | 数据目录 API | `api.getDataDir()` → `~/.pi/agent/robopi/data/<plugin>/` + 读写路由（权限限定在数据目录） | 0.5 天 |
| 3 | 插件间依赖 | manifest `dependencies` + 拓扑加载 + `registerPluginApi`/`getPluginApi` | 1 天 |
| 4 | npm 依赖规范化 | 插件 package.json 仅声明依赖（无 scripts），构建时从插件目录 resolve node_modules，bundle 进 dist | 0.5 天 |

## 4. 插件依赖三层解法

### 第 1 层：依赖 npm 包
esbuild bundle 全打进 dist（除 `window.React`/`window.robopi` 两个 external），**发布后目标机器无需安装**。知识库用到的 Markdown 编辑器、图谱渲染库（cytoscape 等）直接 bundle。

### 第 2 层：插件依赖插件（备用）
```json
// manifest.json
{ "dependencies": ["kb-core"] }
```
- PluginHost 拓扑排序加载，循环依赖报错
- `window.robopi.registerPluginApi("kb-core", api)` 导出能力；`api.getPluginApi("kb-core")` 消费

**一期建议单插件内聚**，依赖机制做好备用（等图谱引擎等确需独立复用再拆）。

### 第 3 层：依赖宿主能力（api 桥按需扩展）
```ts
api.readPluginFile(relPath) / api.writePluginFile(relPath, content)
api.listPluginFiles(relPath)
// 服务端：/api/robopi/plugins/data?name=&path=，权限限定在插件数据目录
```

## 5. 知识库插件内部架构

```
plugins-dev/robopi-knowledge/          # 独立插件仓库（monorepo）
  plugins/knowledge-base/
    manifest.json
    src/
      index.tsx        # registerView(mode: "side") + 导航入口 + registerMessageRenderer
      App.tsx          # 工作区壳：二级导航（5 模块）+ 内容区
      modules/
        dashboard.tsx  # 工作台
        documents.tsx  # 文档管理
        wiki.tsx       # Wiki 知识库
        graph.tsx      # 知识图谱
        evaluate.tsx   # 评估与优化
      data.ts          # 数据层（经 api.getDataDir()）
```

数据模型：文档树 + Wiki 双链 + 图谱实体/关系，统一存 `~/.pi/agent/robopi/data/knowledge-base/`（JSON/JSONL，数据格式带版本字段）。

## 6. 实施路线

| 阶段 | 内容 | 工期 |
|---|---|---|
| P0 | 视图系统 + 导航入口 + 数据目录 API | 1.5-2.5 天 |
| P1 | 依赖机制（manifest dependencies + 拓扑加载 + npm 规范化） | 1-1.5 天 |
| P2 | 知识库骨架（脚手架 + 工作台 + 数据层） | 2-3 天 |
| P3 | 文档管理 → Wiki → 知识图谱 → 评估与优化 | 2-3 周 |
| 合计 | | 约 3-4 周（单人） |

## 7. 风险

1. AppShell 改造是宿主 B 类改造点（同步时挂载点重放，有先例）；
2. side 分栏移动端需退化为整页；
3. 图谱大图（>1000 节点）需 canvas/webgl 方案；
4. 数据格式早期定版本字段。
