# worktable 插件

工作台容器插件 —— 结构与文件浏览器类似：**可折叠头部 + 工作台列表**。

## 功能

- **🧩 工作台面板**（`sidebar-bottom`）：可折叠头部（箭头 + 计数）+ 工作台列表
- 选中工作台项 → 面板内展开内容
- 内置默认项：概览（会话统计）、Wiki 知识库（占位）、办公助手（占位）
- **工作台由插件注册**：`window.robopi.registerWorktableItem({ id, label, icon, description, component })`，
  同名 id 覆盖内置占位项（如安装 wiki 插件后自动替换占位）

## 作为容器插件（其他插件如何注册工作台）

```js
// wiki 插件（任意其他插件）入口：
window.robopi.registerWorktableItem({
  id: "wiki",              // 覆盖 worktable 内置占位
  label: "Wiki 知识库",
  icon: "📚",
  description: "企业知识库",
  component: WikiPanel,    // React 组件（接收 { api }）
});
```

注册表在宿主（plugin-client 的通用注册模式），**加载顺序无关**——worktable 面板 5 秒轮询刷新，
新插件注册后自动出现。严格依赖（manifest `dependencies` + 拓扑加载）见
[wiki/001-overview.md](../wiki/001-overview.md) 第 4 节，作为后续增强。

## 安装

```bash
node scripts/plugin.mjs install git@github.com:BowiEgo/robopi-workspace.git --ref v0.6.0 --dir plugins/worktable
# 或 dev 模式：plugins-dev 自动挂载（🧪 标记）
```

## 开发

```bash
# 宿主构建（免 package.json）
node scripts/plugin-build.mjs watch plugins-dev/robopi-plugins/plugins/worktable
# 改 src/index.tsx → 保存 → 5 秒热更
```

## 结构

```
src/index.tsx        # 工作台面板（可折叠头 + 列表 + 选中展开）
manifest.json        # name: worktable, entry: dist/index.js
plugin-env.d.ts      # 类型（WorktableItem / registerWorktableItem）
```
