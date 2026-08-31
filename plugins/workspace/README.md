# workspace 插件

工作区统计插件 —— 展示 RoboPi 插件的三种能力（TSX 开发）。

## 功能

- **📊 工作区统计**（`sidebar-bottom`）：会话数 / 插件探针调用统计面板
- **🧩 组件覆盖**：可覆盖宿主组件（如 `ModelSelector`）
- **📋 消息卡片**（`session-summary`）：自定义消息渲染

## 安装

```bash
# 市场安装（git 源，monorepo 子目录）
node scripts/plugin.mjs install git@github.com:BowiEgo/robopi-workspace.git --ref v0.5.0 --dir plugins/workspace
# 或 Settings → RoboPi 插件 → 插件市场 → 安装
```

## 开发

```bash
# dev 模式自动挂载 plugins-dev，配合内建 watch 即改即热更
npm run dev
# 改 src/index.tsx → 保存 → 5 秒后页面生效
```

## 结构

```
src/index.tsx        # TSX 源码（宿主构建）
dist/index.js        # 构建产物（发布提交）
manifest.json        # 插件清单（name/version/entry）
tsconfig.json        # JSX factory 配置（window.React.createElement）
plugin-env.d.ts      # window.robopi / React / JSX 类型声明
```

## 发布

```bash
git add -A && git commit -m "feat: ..."
git push && git tag v0.x.0 && git push origin v0.x.0
```

## 依赖

- 宿主注入 `window.robopi`（注册 API）与 `window.React`（React 19）
- 样式使用宿主 CSS 变量（`var(--bg)`、`var(--accent)` 等）
