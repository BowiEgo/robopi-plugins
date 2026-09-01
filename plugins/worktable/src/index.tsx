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
const { useEffect, useRef, useState } = window.React as typeof import("react");

// window.robopi 由宿主注入
const robopi = window.robopi;
if (!robopi) {
  throw new Error("[worktable] 宿主未注入 robopi API");
}

// ---------------------------------------------------------------------------
// 共享选中状态：sidebar 工作台列表与 dock 内容区需要联动
// ---------------------------------------------------------------------------

let selectedWorktableId = "overview";
const selectedListeners = new Set<() => void>();

function getSelectedWorktableId(): string {
  return selectedWorktableId;
}

function setSelectedWorktableId(id: string): void {
  selectedWorktableId = id;
  selectedListeners.forEach((listener) => listener());
}

/** React hook: subscribe to the selected worktable id (plugin-local store). */
function useSelectedWorktableId(): string {
  const [, forceRender] = useState(0);
  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    selectedListeners.add(listener);
    return () => { selectedListeners.delete(listener); };
  }, []);
  return getSelectedWorktableId();
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
  const selected = useSelectedWorktableId();

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* 可折叠头部（文件浏览器风格箭头） */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          padding: "6px 8px", background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
          textTransform: "uppercase", letterSpacing: 0.4,
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
                onClick={() => {
                  setSelectedWorktableId(item.id);
                  api.openDock();
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%",
                  height: 24, padding: "0 8px", borderRadius: 4, cursor: "pointer",
                  background: active ? "var(--bg-selected)" : "transparent",
                  border: "none", fontSize: 12, color: "var(--text)", textAlign: "left",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span aria-hidden>{item.icon ?? "•"}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </button>
            );
          })}


        </div>
      )}
    </div>
  );
}

// ============ 注册 ============

// Sidebar entry: collapsible worktable list (opens the dock on selection)
robopi.registerSlot("sidebar-bottom", (api) => <WorktablePanel api={api} />);

// Dock content: renders the selected worktable below the file browser
robopi.registerDockPanel(() => <WorktableDockPanel />);

const DOCK_WIDTH_KEY = "robopi-worktable-width";
const DOCK_WIDTH_MIN = 240;
const DOCK_WIDTH_MAX = 560;

/**
 * Dock panel UI (implemented entirely inside the plugin): a window rendered
 * by the host beside the chat column. Owns its width (edge drag, persisted),
 * title bar with close button, and the selected worktable content.
 */
function WorktableDockPanel() {
  const [width, setWidth] = useState<number>(() => {
    const stored = Number(window.localStorage.getItem(DOCK_WIDTH_KEY));
    return Number.isFinite(stored) ? Math.min(DOCK_WIDTH_MAX, Math.max(DOCK_WIDTH_MIN, stored)) : 320;
  });
  const [items, setItems] = useState<WorktableItem[]>(BUILTIN_ITEMS);
  const selected = useSelectedWorktableId();
  const [resizing, setResizing] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  useEffect(() => {
    try {
      window.localStorage.setItem(DOCK_WIDTH_KEY, String(width));
    } catch { /* ignore */ }
  }, [width]);

  // Worktable registry refresh (new plugins appear within 5s)
  useEffect(() => {
    const refresh = () => {
      const registered = (window.robopi as unknown as { getWorktableItems?: () => WorktableItem[] })
        .getWorktableItems?.() ?? [];
      if (registered.length === 0) return;
      const merged = new Map<string, WorktableItem>();
      for (const item of BUILTIN_ITEMS) merged.set(item.id, item);
      for (const item of registered) merged.set(item.id, item);
      setItems([...merged.values()]);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  // Edge drag to resize the panel width
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startWidth = widthRef.current;
    const move = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setWidth(Math.min(DOCK_WIDTH_MAX, Math.max(DOCK_WIDTH_MIN, startWidth + delta)));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      setResizing(false);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const item = items.find((i) => i.id === selected) ?? items[0];

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        position: "relative",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 32,
          padding: "0 10px", flexShrink: 0, borderBottom: "1px solid var(--border)",
          fontSize: 12, fontWeight: 700, color: "var(--text)", userSelect: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          🧩 工作台
        </span>
        <button
          type="button"
          onClick={() => (window.robopi as unknown as { setDockOpen?: (v: boolean) => void })?.setDockOpen?.(false)}
          aria-label="关闭工作台"
          title="关闭工作台"
          style={{
            border: "none", background: "none", cursor: "pointer", color: "var(--text-dim)",
            fontSize: 14, padding: "2px 6px", borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>

      {/* Worktable content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {!item && <div style={{ padding: 12, fontSize: 12, color: "var(--text-dim)" }}>无工作台</div>}
        {item && item.component ? (
          <item.component api={pluginApiShim} />
        ) : item ? (
          <div style={{ padding: 12 }}><PlaceholderPanel item={item} /></div>
        ) : null}
      </div>

      {/* Edge resize handle (inside the panel, covering the right edge) */}
      <div
        onMouseDown={startResize}
        role="separator"
        aria-orientation="vertical"
        title="拖拽调整宽度"
        style={{
          position: "absolute", top: 0, bottom: 0, right: 0, width: 6,
          cursor: "col-resize", background: resizing ? "var(--accent)" : "transparent",
          transition: "background 0.1s ease",
        }}
      />
    </div>
  );
}

// Dock 内容组件无法接收 api 参数，使用全局 shim（宿主注入的 pluginApi 等价物）
const pluginApiShim: PluginApi = {
  getStatus: () => fetch("/api/robopi/status", { cache: "no-store" }).then((r) => r.json()),
  listSessions: () => fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()),
  openSession: (sessionId: string) => {
    window.location.assign(`/?session=${encodeURIComponent(sessionId)}`);
  },
  getWorktableItems: () => (window.robopi as unknown as { getWorktableItems?: () => WorktableItem[] }).getWorktableItems?.() ?? [],
  openDock: () => (window.robopi as unknown as { openDock?: () => void }).openDock?.(),
};

console.log("[worktable] loaded ✅ (工作台容器)");
