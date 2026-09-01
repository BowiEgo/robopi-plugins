/// <reference path="../plugin-env.d.ts" />

/**
 * worktable —— 工作台容器插件。
 *
 * 结构：文件浏览器风格的可折叠列表（sidebar）+ 四向可停靠 DockPanel。
 * 工作台项由各插件经 window.robopi.registerWorktableItem() 注册，
 * 同名 id 覆盖内置项。内置"控制室"展示欢迎页 + 工作台网格（mock 卡片）。
 */

import type { DockSide, PluginApi, WorktableItem } from "../plugin-env";
import type * as React from "react";
import { DockPanel } from "./dock-panel";

// 运行时 React 从宿主取（esbuild 移除 import type；JSX factory 见 tsconfig）
const { useEffect, useState } = window.React as typeof import("react");

const robopi = window.robopi;
if (!robopi) {
  throw new Error("[worktable] 宿主未注入 robopi API");
}

// ---------------------------------------------------------------------------
// Worktable registry (owned by this plugin, not the host)
// ---------------------------------------------------------------------------

/**
 * Plugins register worktables via window.robopiWorktable. If worktable has
 * not loaded yet (plugin load order is not guaranteed), registrations are
 * buffered in a pending queue and consumed on startup.
 */
const registry = new Map<string, WorktableItem>();
const listeners = new Set<() => void>();
const PENDING_KEY = "__robopiWorktablePending";

// Breadcrumb state: per-worktable panel path + navigation subscribers
const paths = new Map<string, string[]>();
const pathListeners = new Set<() => void>();
const navListeners = new Set<(id: string, targetIndex: number) => void>();

type RegistryApi = {
  registerItem(item: WorktableItem): void;
  getItems(): WorktableItem[];
  subscribe(listener: () => void): () => void;
  /** Breadcrumb: the panel path of a worktable (e.g. ["文档管理"]) */
  setPath(id: string, path: string[]): void;
  getPath(id: string): string[];
  /** Fired when a breadcrumb item is clicked (id + target path index) */
  onPathNavigate(cb: (id: string, targetIndex: number) => void): () => void;
};

function registerItem(item: WorktableItem): void {
  registry.set(item.id, item);
  listeners.forEach((listener) => listener());
}

function getItems(): WorktableItem[] {
  return [...registry.values()];
}

function setPath(id: string, path: string[]): void {
  paths.set(id, path);
  pathListeners.forEach((listener) => listener());
}

function getPath(id: string): string[] {
  return paths.get(id) ?? [];
}

function publishRegistryApi(): void {
  const api: RegistryApi = {
    registerItem,
    getItems,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setPath,
    getPath,
    onPathNavigate: (cb) => {
      navListeners.add(cb);
      return () => { navListeners.delete(cb); };
    },
  };
  (window as unknown as { robopiWorktable?: RegistryApi }).robopiWorktable = api;
  // Consume registrations that arrived before this plugin loaded
  const pending = (window as unknown as Record<string, unknown>)[PENDING_KEY] as WorktableItem[] | undefined;
  if (pending) {
    for (const item of pending) registerItem(item);
    delete (window as unknown as Record<string, unknown>)[PENDING_KEY];
  }
}

publishRegistryApi();

// ---------------------------------------------------------------------------
// 共享选中状态：sidebar 工作台列表与 dock 内容区需要联动
// ---------------------------------------------------------------------------

let selectedWorktableId = "control-room";
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

// ---------------------------------------------------------------------------
// pi-web style icons (stroke-based SVG, 1.8px stroke)
// ---------------------------------------------------------------------------

const iconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Control room: dashboard grid. */
function ControlRoomIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  );
}

/** Placeholder icons for mock worktable cards. */
function WikiIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 内置默认工作台项
// ---------------------------------------------------------------------------

/** 控制室：欢迎页 + 工作台网格（卡片风格，未来展示所有注册工作台）。 */
function ControlRoomPanel({ api }: { api: PluginApi }) {
  // 合并注册的工作台项 + mock 卡片（占位，展示网格效果）
  const [items, setItems] = useState<WorktableItem[]>(BUILTIN_ITEMS);

  useEffect(() => {
    const refresh = () => {
      const registered = getItems();
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

  // Mock cards: future registered worktables (grid preview);
  // entries already registered by plugins are filtered out
  const registeredIds = new Set(items.map((i) => i.id));
  const mockCards: Array<{ id: string; label: string; icon: React.ReactNode; description: string }> = [
    { id: "office", label: "办公助手", icon: <OfficeIcon />, description: "日程 · 邮件 · 审批" },
  ].filter((card) => !registeredIds.has(card.id));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "28px 24px", gap: 24, overflowY: "auto" }}>
      {/* Welcome header */}
      <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
        <div
          style={{
            width: 52, height: 52, margin: "0 auto 12px", borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "color-mix(in srgb, var(--accent) 12%, var(--bg))",
            color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 28%, var(--border))",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="8" height="10" rx="1.5" />
            <rect x="13" y="3" width="8" height="6" rx="1.5" />
            <rect x="13" y="11" width="8" height="10" rx="1.5" />
            <rect x="3" y="15" width="8" height="6" rx="1.5" />
          </svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>欢迎使用 RoboPi 工作台</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
          集中管理你的工作台 · 从下方选择进入，或点击左侧列表切换
        </div>
      </div>

      {/* Worktable grid (card style) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {items.filter((i) => i.id !== "control-room").map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedWorktableId(item.id)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
              padding: 14, borderRadius: 12, cursor: "pointer", textAlign: "left",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              transition: "border-color 0.12s ease, box-shadow 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 45%, var(--border))";
              e.currentTarget.style.boxShadow = "0 2px 10px color-mix(in srgb, var(--accent) 10%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ color: "var(--accent)", display: "flex" }}>{item.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.label}</span>
            {item.description && (
              <span style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{item.description}</span>
            )}
          </button>
        ))}

        {mockCards.map((card) => (
          <div
            key={`mock-${card.id}`}
            style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
              padding: 14, borderRadius: 12,
              background: "color-mix(in srgb, var(--bg-panel) 60%, var(--bg))",
              border: "1px dashed var(--border)",
              opacity: 0.75,
            }}
          >
            <span style={{ color: "var(--text-muted)", display: "flex" }}>{card.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {card.label}
              <span style={{ marginLeft: 6, fontSize: 10, color: "var(--text-dim)", fontWeight: 400 }}>
                即将推出
              </span>
            </span>
            <span style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>{card.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BUILTIN_ITEMS: WorktableItem[] = [
  {
    id: "control-room",
    label: "控制室",
    icon: <ControlRoomIcon />,
    description: "欢迎页与工作台总览",
    component: ControlRoomPanel,
  },
];

/** 占位工作台（等待对应插件注册实现） */
function PlaceholderPanel({ item }: { item: WorktableItem }) {
  return (
    <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, padding: 12 }}>
      <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
        {item.icon} {item.label}
      </div>
      {item.description && <div style={{ marginBottom: 6 }}>{item.description}</div>}
      <div>该工作台尚未安装对应插件（{item.id}），安装后自动启用。</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar entry: collapsible worktable list (opens the dock on selection)
// ---------------------------------------------------------------------------

function WorktablePanel({ api }: { api: PluginApi }) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<WorktableItem[]>(BUILTIN_ITEMS);
  const selected = useSelectedWorktableId();

  useEffect(() => {
    const refresh = () => {
      const registered = getItems();
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

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, borderTop: "1px solid var(--border)" }}>
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
        <span>工作台</span>
        <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontWeight: 400, fontSize: 11 }}>
          {items.length}
        </span>
      </button>

      {open && (
        <div style={{ padding: "2px 4px 4px" }}>
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
                <span style={{ color: active ? "var(--accent)" : "var(--text-muted)", display: "flex" }}>
                  {item.icon}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dock content: the selected worktable inside the abstract DockPanel
// ---------------------------------------------------------------------------

/** Breadcrumb trail: [控制室, worktable label, ...panel path].
 * Click mapping: 0 -> control room, 1 -> worktable root (-1),
 * >= 2 -> path[index - 2] inside the panel. */
function onBreadcrumbClick(worktableId: string, index: number): void {
  if (index === 0) {
    setSelectedWorktableId("control-room");
    return;
  }
  setSelectedWorktableId(worktableId);
  navListeners.forEach((cb) => cb(worktableId, index === 1 ? -1 : index - 2));
}

function WorktableDockPanel() {
  const [items, setItems] = useState<WorktableItem[]>(BUILTIN_ITEMS);
  const selected = useSelectedWorktableId();
  // Re-render when a panel updates its breadcrumb path
  const [, setPathVersion] = useState(0);
  useEffect(() => {
    const listener = () => setPathVersion((v) => v + 1);
    pathListeners.add(listener);
    return () => { pathListeners.delete(listener); };
  }, []);

  useEffect(() => {
    const refresh = () => {
      const registered = getItems();
      if (registered.length === 0) return;
      const merged = new Map<string, WorktableItem>();
      for (const item of BUILTIN_ITEMS) merged.set(item.id, item);
      for (const item of registered) merged.set(item.id, item);
      setItems([...merged.values()]);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [selected]); // refresh immediately when the selection changes

  const item = items.find((i) => i.id === selected) ?? items[0];
  // Trail: 控制室 › worktable label › panel path (control room as the root;
  // when the control room itself is selected the trail is just 控制室)
  const breadcrumb = item
    ? item.id === "control-room"
      ? ["控制室"]
      : ["控制室", item.label, ...getPath(selected)]
    : ["控制室"];

  return (
    <DockPanel
      title={item ? <>{item.icon} {item.label}</> : "工作台"}
      breadcrumb={breadcrumb}
      onBreadcrumbClick={(index) => onBreadcrumbClick(selected, index)}
      api={pluginApiShim}
    >
      {!item && <div style={{ padding: 12, fontSize: 12, color: "var(--text-dim)" }}>无工作台</div>}
      {item && item.component ? (
        <item.component api={pluginApiShim} />
      ) : item ? (
        <PlaceholderPanel item={item} />
      ) : null}
    </DockPanel>
  );
}

// ============ 注册 ============

// Sidebar entry: collapsible worktable list (opens the dock on selection)
robopi.registerSlot("sidebar-bottom", (api) => <WorktablePanel api={api} />);

// Dock content: renders the selected worktable inside the DockPanel
robopi.registerDockPanel(() => <WorktableDockPanel />);

// Dock 内容组件无法接收 api 参数，使用全局 shim（宿主注入的 pluginApi 等价物）
const pluginApiShim: PluginApi = {
  getStatus: () => fetch("/api/robopi/status", { cache: "no-store" }).then((r) => r.json()),
  listSessions: () => fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()),
  openSession: (sessionId: string) => {
    window.location.assign(`/?session=${encodeURIComponent(sessionId)}`);
  },
  openDock: () => (window.robopi as unknown as { openDock?: () => void }).openDock?.(),
  setDockSide: (side: DockSide) => (window.robopi as unknown as { setDockSide?: (s: DockSide) => void }).setDockSide?.(side),
  getDockSide: () => (window.robopi as unknown as { getDockSide?: () => DockSide }).getDockSide?.() ?? "left",
};

console.log("[worktable] loaded ✅ (工作台容器)");
