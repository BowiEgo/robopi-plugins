/// <reference path="../plugin-env.d.ts" />

/**
 * wiki —— Wiki 知识库工作台插件。
 *
 * 向 worktable 注册 "wiki" 工作台项（同名覆盖控制室网格中的 mock 卡片）：
 * - 工作台列表出现「Wiki 知识库」选项（pi-web 风格 SVG 图标）
 * - 选中后 dock 面板切换为 WikiPanel（本插件负责面板内容）
 *
 * 内容（骨架版）：欢迎区 + 搜索框（mock）+ 文档列表（mock 数据）。
 * 后续按 robopi-plugins/wiki/ 设计文档扩展：文档管理 / 知识图谱 / 检索问答。
 */

import type { PluginApi, WorktableItem } from "../plugin-env";
import type * as React from "react";

const { useEffect, useState } = window.React as typeof import("react");

const robopi = window.robopi;
if (!robopi) {
  throw new Error("[wiki] 宿主未注入 robopi API");
}

// ---------------------------------------------------------------------------
// pi-web style icon (stroke SVG, 1.8px)
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

/** Book / wiki icon. */
function WikiIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Wiki panel: internal navigation + breadcrumb sync with the dock title bar
// ---------------------------------------------------------------------------

type WikiPage = "dashboard" | "documents" | "wiki" | "graph" | "evaluate";

const PAGES: Array<{ id: WikiPage; label: string }> = [
  { id: "dashboard", label: "工作台" },
  { id: "documents", label: "文档管理" },
  { id: "wiki", label: "Wiki 知识库" },
  { id: "graph", label: "知识图谱" },
  { id: "evaluate", label: "评估与优化" },
];

/** Sync the current page into the worktable breadcrumb (root page = no path). */
function syncBreadcrumb(page: WikiPage): void {
  const label = PAGES.find((p) => p.id === page)?.label ?? "";
  const api = (window as unknown as { robopiWorktable?: { setPath: (id: string, path: string[]) => void } }).robopiWorktable;
  api?.setPath("wiki", page === "dashboard" ? [] : [label]);
}

/** Placeholder page content (skeleton states). */
function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32, color: "var(--text-muted)", textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      <div style={{ fontSize: 12, maxWidth: 420, lineHeight: 1.6 }}>{description}</div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>建设中 · 按 robopi-plugins/wiki 设计文档实施</div>
    </div>
  );
}

interface WikiDoc {
  id: string;
  title: string;
  space: string;
  updated: string;
  tags: string[];
}

const MOCK_DOCS: WikiDoc[] = [
  { id: "1", title: "报销流程指南", space: "财务制度", updated: "2026-08-28", tags: ["流程", "财务"] },
  { id: "2", title: "新员工入职手册", space: "人力资源", updated: "2026-08-25", tags: ["入职"] },
  { id: "3", title: "产品架构总览", space: "研发", updated: "2026-08-22", tags: ["架构"] },
  { id: "4", title: "差旅标准与报销", space: "财务制度", updated: "2026-08-20", tags: ["差旅"] },
  { id: "5", title: "知识库使用规范", space: "通用", updated: "2026-08-18", tags: ["规范"] },
];

function WikiPanel({ api }: { api: PluginApi }) {
  const [page, setPage] = useState<WikiPage>("dashboard");
  const [query, setQuery] = useState("");

  // Sync the current page into the dock breadcrumb whenever it changes
  useEffect(() => {
    syncBreadcrumb(page);
  }, [page]);

  // Breadcrumb click sync: jump to the requested page
  useEffect(() => {
    const worktable = (window as unknown as {
      robopiWorktable?: { onPathNavigate: (cb: (id: string, targetIndex: number) => void) => () => void };
    }).robopiWorktable;
    if (!worktable?.onPathNavigate) return;
    return worktable.onPathNavigate((id, targetIndex) => {
      if (id !== "wiki") return;
      // -1 = the worktable root page (dashboard)
      if (targetIndex === -1) {
        setPage("dashboard");
        return;
      }
      const path = (window as unknown as {
        robopiWorktable?: { getPath: (id: string) => string[] };
      }).robopiWorktable?.getPath("wiki") ?? [];
      const targetLabel = path[targetIndex];
      const target = PAGES.find((p) => p.label === targetLabel);
      if (target) setPage(target.id);
    });
  }, []);

  const docs = query.trim()
    ? MOCK_DOCS.filter((d) =>
        (d.title + d.space + d.tags.join("")).toLowerCase().includes(query.trim().toLowerCase()),
      )
    : MOCK_DOCS;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Internal navigation */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "8px 10px", borderBottom: "1px solid var(--border)",
          flexShrink: 0, flexWrap: "wrap",
        }}
      >
        {PAGES.map((p) => {
          const active = p.id === page;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPage(p.id)}
              style={{
                border: "none", background: active ? "var(--bg-selected)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                fontSize: 12, fontWeight: active ? 600 : 400,
                padding: "4px 10px", borderRadius: 6, cursor: "pointer",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>
        {page === "dashboard" && (
          <PagePlaceholder
            title="工作台"
            description="Wiki 知识库工作台仪表盘（预留）：最近文档、知识统计、快捷入口将在此展示。"
          />
        )}
        {page === "documents" && (
          <PagePlaceholder
            title="文档管理"
            description="文档树、Markdown 编辑器、版本历史与全文检索。"
          />
        )}
        {page === "graph" && (
          <PagePlaceholder
            title="知识图谱"
            description="实体与关系可视化、图谱浏览与编辑。"
          />
        )}
        {page === "evaluate" && (
          <PagePlaceholder
            title="评估与优化"
            description="检索覆盖率、过期检测、质量报告。"
          />
        )}
        {page === "wiki" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-dim)" }}>
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索文档…"
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--text)" }}
              />
            </div>
            {/* Document list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {docs.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-dim)", padding: "12px 4px" }}>没有匹配的文档</div>
              )}
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid var(--border)", background: "var(--bg)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, var(--border))"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <span style={{ color: "var(--text-muted)", display: "flex" }}><FileIcon /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.title}
                    </span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--text-dim)", marginTop: 2 }}>
                      {doc.space} · 更新于 {doc.updated}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {doc.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--tool-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" }}>
                        {tag}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Register the worktable item (overrides the control-room mock card)
// ---------------------------------------------------------------------------

// Register via the worktable plugin's registry (buffered if not loaded yet)
const pendingKey = "__robopiWorktablePending";
const robopiWorktable = (window as unknown as { robopiWorktable?: { registerItem: (item: unknown) => void } }).robopiWorktable;
const wikiItem = {
  id: "wiki",
  label: "Wiki 知识库",
  icon: <WikiIcon />,
  description: "企业文档 · 知识库 · 知识图谱",
  component: WikiPanel,
};

if (robopiWorktable) {
  robopiWorktable.registerItem(wikiItem);
} else {
  // worktable not loaded yet: buffer for startup consumption
  const pending = (window as unknown as Record<string, unknown>)[pendingKey];
  const queue = Array.isArray(pending) ? pending : [];
  queue.push(wikiItem);
  (window as unknown as Record<string, unknown>)[pendingKey] = queue;
}

console.log("[wiki] loaded ✅ (Wiki 知识库工作台)");
