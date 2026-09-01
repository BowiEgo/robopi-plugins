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
// Wiki panel (skeleton: welcome + search + mock documents)
// ---------------------------------------------------------------------------

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
  const [query, setQuery] = useState("");
  const docs = query.trim()
    ? MOCK_DOCS.filter((d) =>
        (d.title + d.space + d.tags.join("")).toLowerCase().includes(query.trim().toLowerCase()),
      )
    : MOCK_DOCS;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, gap: 14, overflowY: "auto" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          <span style={{ verticalAlign: -2, marginRight: 6, color: "var(--accent)" }}><WikiIcon /></span>
          Wiki 知识库
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          企业文档 · 双链知识库 · 知识图谱（骨架版，mock 数据）
        </div>
      </div>

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
  );
}

// ---------------------------------------------------------------------------
// Register the worktable item (overrides the control-room mock card)
// ---------------------------------------------------------------------------

robopi.registerWorktableItem({
  id: "wiki",
  label: "Wiki 知识库",
  icon: <WikiIcon />,
  description: "企业文档 · 知识库 · 知识图谱",
  component: WikiPanel,
});

console.log("[wiki] loaded ✅ (Wiki 知识库工作台)");
