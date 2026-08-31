# robopi-workspace —— RoboPi 插件 monorepo

一个仓库维护多个 RoboPi 插件（宿主构建，免 package.json）。

## 结构

```
plugins/
  workspace/        # 工作区统计插件（TSX）
    manifest.json
    src/index.tsx   # 源码（宿主 watch 构建）
    dist/index.js   # 产物（发布提交）
    tsconfig.json
    plugin-env.d.ts
```

## 插件开发

```bash
# 在 RoboPi 项目中（宿主构建）：
node scripts/plugin-build.mjs watch plugins-dev/workspace   # 或
npm run plugin:watch -- workspace

# 本地软链调试：
ln -s plugins/workspace ~/.pi/agent/robopi/plugins/workspace
```

## 发布

```bash
git add -A && git commit -m "feat: ..."
git push && git tag v0.2.0 && git push origin v0.2.0
```

市场收录（market.json）：

```json
{ "name": "workspace", "source": "git:git@github.com:BowiEgo/robopi-workspace.git", "ref": "v0.2.0", "dir": "plugins/workspace" }
```

## 新增插件

```bash
mkdir plugins/my-plugin
cp -r plugins/workspace/{manifest.json,tsconfig.json,plugin-env.d.ts} plugins/my-plugin/
# 写 src/index.tsx，改 manifest name
```
