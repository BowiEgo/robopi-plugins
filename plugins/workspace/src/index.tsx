/// <reference path="../plugin-env.d.ts" />

/**
 * workspace —— TSX 插件（宿主构建示例，发布至 robopi-workspace 仓库）。
 *
 * 开发方式：
 *   cd plugins-dev/workspace
 *   npm install && npm run dev        # esbuild watch：改 src → 自动编译 dist
 *   ln -s "$PWD" ~/.pi/agent/robopi/plugins/workspace
 *
 * 热更链条：改 src/index.tsx → esbuild 编译 → dist/index.js mtime 变化
 *           → 浏览器 5 秒内重载插件
 */

import type { PluginApi } from "../plugin-env";
import type * as React from "react";

// 运行时 React 从宿主取（esbuild 移除 import type；JSX factory 见 tsconfig）
const { useEffect, useState } = window.React as typeof import("react");

// window.robopi 在插件加载时由宿主注入（类型见 plugin-env.d.ts）
const robopi = window.robopi;

if (!robopi) {
  throw new Error("[workspace] 宿主未注入 robopi API");
}

// ============ 位置级：sidebar-bottom 统计面板（JSX 写法） ============

interface Stats {
  sessions: number;
  greetingCalls: number;
}

function StatsPanel({ api }: { api: PluginApi }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listSessions(), api.getStatus()])
      .then(([sessions, status]) => {
        if (cancelled) return;
        const hello = (status as { services?: { hello?: { calls?: number } } })?.services?.hello;
        setStats({
          sessions: sessions.sessions?.length ?? 0,
          greetingCalls: hello?.calls ?? 0,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [api]);

  return (
    <div
      style={{
        margin: "8px 10px",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--tool-bg)",
        fontSize: 12,
        color: "var(--text-muted)",
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
        ⚡ workspace v0.1.0（npm run dev 内建 watch）
      </div>
      <div>会话数：{stats ? stats.sessions : "…"}</div>
      <div>探针调用：{stats ? stats.greetingCalls : "…"}</div>
      <div style={{ marginTop: 6, color: "var(--text-dim)", fontSize: 11 }}>
        宿主构建：TSX v0.2.0
      </div>
    </div>
  );
}

// ============ 内容级：消息卡片（TSX 渲染器） ============

function SummaryCard({ message }: { message: unknown }) {
  let text = "";
  try {
    const content = (message as { message?: { content?: unknown } })?.message?.content;
    if (typeof content === "string") text = content;
    else if (Array.isArray(content)) {
      text = content
        .map((block) => (block && typeof block.text === "string" ? block.text : ""))
        .join("");
    }
  } catch {
    text = String(message);
  }
  return (
    <div
      style={{
        margin: "8px 0",
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--border))",
        background: "color-mix(in srgb, var(--accent) 6%, var(--bg))",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 TSX 会话摘要</div>
      <div>{text || "（空内容）"}</div>
    </div>
  );
}

// ============ 注册 ============

robopi.registerSlot("sidebar-bottom", (api) => <StatsPanel api={api} />);

robopi.registerMessageRenderer("session-summary", (message) => <SummaryCard message={message} />);

console.log("[workspace] loaded ✅ (TSX)");
