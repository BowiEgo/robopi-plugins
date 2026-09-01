/// <reference path="../plugin-env.d.ts" />

/**
 * worktable —— 工作台容器插件。
 *
 * 结构与文件浏览器类似：可折叠头部 + 工作台列表。
 * 工作台项由各插件经 window.robopi.registerWorktableItem() 注册
 * （wiki / 办公助手等），worktable 负责渲染与选中展开；
 * 同名 id 的插件注册会覆盖内置占位项。
 */

import type { PluginApi, WorktableItem } from "../plugin-env";
import type * as React from "react";

// 运行时 React 从宿主取（esbuild 移除 import type；JSX factory 见 tsconfig）
const { useEffect, useState } = window.React as typeof import("react");

// window.robopi 由宿主注入
const robopi = window.robopi;
if (!robopi) {
  throw new Error("[worktable] 宿主未注入 robopi API");
}

// ============ 内置默认工作台项（占位，可被插件同名覆盖） ============

/** 概览：会话统计（原 workspace 功能迁移） */
function OverviewPanel({ api }: { api: PluginApi }) {
  const [stats, setStats] = useState<{ sessions: number; greetingCalls: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listSessions(), api.getStatus()])
      .then(([sessions, status]) => {
        if (cancelled) return;
        const hello = (status as { services?: { hello?: { calls?: number } } })?.services?.hello;
        setStats({
          sessions: (sessions as { sessions?: unknown[] })?.sessions?.length ?? 0,
          greetingCalls: hello?.calls ?? 0,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [api]);

  return (
    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>📊 概览</div>
      <div>会话数：{stats ? stats.sessions : "…"}</div>
      <div>插件探针调用：{stats ? stats.greetingCalls : "…"}</div>
      <div style={{ marginTop: 8, color: "var(--text-dim)", fontSize: 11 }}>
        工作台项由插件注册（wiki、办公助手…），同名 id 可覆盖内置占位。
      </div>
    </div>
  );
}

/** 占位工作台（等待对应插件注册实现） */
function PlaceholderPanel({ item }: { item: WorktableItem }) {
  return (
    <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
        {item.icon ?? "🧩"} {item.label}
      </div>
      {item.description && <div style={{ marginBottom: 6 }}>{item.description}</div>}
      <div>该工作台尚未安装对应插件（{item.id}），安装后自动启用。</div>
    </div>
  );
}

const BUILTIN_ITEMS: WorktableItem[] = [
  {
    id: "overview",
    label: "概览",
    icon: "📊",
    description: "会话统计与插件状态",
    component: OverviewPanel,
  },
  {
    id: "wiki",
    label: "Wiki 知识库",
    icon: "📚",
    description: "企业知识库（文档/Wiki/知识图谱，见 robopi-plugins/wiki 设计）",
  },
  {
    id: "office",
    label: "办公助手",
    icon: "🧑‍💼",
    description: "日程/邮件/审批等办公工具",
  },
];

// ============ 工作台面板（sidebar-bottom，文件浏览器风格） ============

function WorktablePanel({ api }: { api: PluginApi }) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<WorktableItem[]>(BUILTIN_ITEMS);
  const [selected, setSelected] = useState<string>("overview");

  // 轮询工作台注册表（与插件热更节奏一致，新插件注册 5s 内出现）
  useEffect(() => {
    const refresh = () => {
      const registered = api.getWorktableItems();
      if (registered.length === 0) return;
      // 合并：插件注册项优先（同名覆盖内置占位），保留内置未覆盖项
      const merged = new Map<string, WorktableItem>();
      for (const item of BUILTIN_ITEMS) merged.set(item.id, item);
      for (const item of registered) merged.set(item.id, item);
      setItems([...merged.values()]);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [api]);

  const selectedItem = items.find((i) => i.id === selected) ?? items[0];

  return (
    <div
      style={{
        margin: "8px 10px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--tool-bg)",
        overflow: "hidden",
      }}
    >
      {/* 可折叠头部（文件浏览器风格箭头） */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          padding: "8px 10px", background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, color: "var(--text)",
        }}
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.1s" }}
        >
          <polyline points="3 2 7 5 3 8" />
        </svg>
        <span>🧩 工作台</span>
        <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>
          {items.length}
        </span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 4 }}>
          {/* 工作台列表 */}
          {items.map((item) => {
            const active = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "6px 8px", borderRadius: 6, cursor: "pointer",
                  background: active ? "var(--bg-selected)" : "transparent",
                  border: "none", fontSize: 12, color: "var(--text)", textAlign: "left",
                }}
              >
                <span aria-hidden>{item.icon ?? "•"}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 选中工作台的内容 */}
          {selectedItem && (
            <div
              style={{
                marginTop: 4, padding: "10px 8px", borderTop: "1px solid var(--border)",
                fontSize: 12,
              }}
            >
              {selectedItem.component ? (
                <selectedItem.component api={api} />
              ) : (
                <PlaceholderPanel item={selectedItem} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ 注册 ============

robopi.registerSlot("sidebar-bottom", (api) => <WorktablePanel api={api} />);

console.log("[worktable] loaded ✅ (工作台容器)");
