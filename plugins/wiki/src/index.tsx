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
import { CHART_COLORS, EChart, TOOLTIP } from "./charts";

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
  { id: "dashboard", label: "主页" },
  { id: "documents", label: "文档管理" },
  { id: "wiki", label: "Wiki" },
  { id: "graph", label: "知识图谱" },
  { id: "evaluate", label: "评估与优化" },
];

/** Sync the current page into the worktable breadcrumb (root page = no path). */
function syncBreadcrumb(page: WikiPage): void {
  const label = PAGES.find((p) => p.id === page)?.label ?? "";
  const api = (window as unknown as { robopiWorktable?: { setPath: (id: string, path: string[]) => void } }).robopiWorktable;
  api?.setPath("wiki", page === "dashboard" ? [] : [label]);
}

// Flat industrial palette (low saturation, cool tones)
const INDUSTRIAL = ["#3b82f6", "#64748b", "#0ea5e9", "#475569", "#94a3b8"];

/** Knowledge asset composition pie (flat industrial). */
function AssetPieChart() {
  const option = {
    tooltip: { trigger: "item", ...TOOLTIP },
    series: [{
      type: "pie" as const,
      radius: ["48%", "68%"],
      center: ["50%", "50%"],
      itemStyle: { borderWidth: 0 },
      label: { color: CHART_COLORS.textMuted, fontSize: 10, formatter: "{b} {d}%" },
      labelLine: { lineStyle: { color: CHART_COLORS.border } },
      data: [
        { name: "财务制度", value: 3, itemStyle: { color: INDUSTRIAL[0] } },
        { name: "人力资源", value: 1, itemStyle: { color: INDUSTRIAL[1] } },
        { name: "研发", value: 1, itemStyle: { color: INDUSTRIAL[2] } },
        { name: "通用", value: 1, itemStyle: { color: INDUSTRIAL[3] } },
      ],
    }],
  };
  return <EChart option={option} height={170} />;
}

/** Q&A quality as flat percentage bars. */
function QaQualityBars() {
  const metrics = [
    { name: "准确率", value: 92 },
    { name: "相关性", value: 86 },
    { name: "完整性", value: 78 },
    { name: "实效性", value: 95 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
      {metrics.map((m) => (
        <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 52, flexShrink: 0, fontSize: 11, color: "var(--text-muted)" }}>{m.name}</span>
          <div style={{ flex: 1, height: 8, borderRadius: 2, background: "var(--tool-bg)", border: `1px solid ${CHART_COLORS.border}`, overflow: "hidden" }}>
            <div style={{ width: `${m.value}%`, height: "100%", background: INDUSTRIAL[0] }} />
          </div>
          <span style={{ width: 40, flexShrink: 0, textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{m.value}%</span>
        </div>
      ))}
    </div>
  );
}

/** Services runtime status (real-time style). */
function ServicesStatus() {
  const services = [
    { name: "RAG 问答 API", status: "运行中", latency: "82ms", icon: "🔌" },
    { name: "向量检索服务", status: "运行中", latency: "45ms", icon: "🧭" },
    { name: "WebHook 推送", status: "运行中", latency: "120ms", icon: "📡" },
    { name: "文档导出", status: "运行中", latency: "—", icon: "📤" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {services.map((svc) => (
        <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12 }}>
          <span style={{ width: 18, textAlign: "center" }}>{svc.icon}</span>
          <span style={{ flex: 1, minWidth: 0, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc.name}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 10.5, width: 72, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: CHART_COLORS.green, display: "inline-block", flexShrink: 0 }} />
            {svc.status}
          </span>
          <span style={{ color: "var(--text-dim)", fontSize: 10.5, fontFamily: "var(--font-mono)", width: 52, textAlign: "right", flexShrink: 0 }}>{svc.latency}</span>
        </div>
      ))}
      <div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>最近检查：刚刚 · 自动刷新</div>
    </div>
  );
}

/** Knowledge building pipeline: numbered circular nodes + connector line. */
function PipelineFlow() {
  const steps = [
    { label: "采集", desc: "文档 / 网页" },
    { label: "清洗", desc: "去重 / 格式化" },
    { label: "分块", desc: "语义切片" },
    { label: "向量化", desc: "Embedding" },
    { label: "索引", desc: "向量库" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: "6px 0 2px" }}>
      {steps.map((step, i) => (
        <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
          {/* Connector to the previous node */}
          <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: i === 0 ? "transparent" : CHART_COLORS.border }} />
            {i > 0 && (
              <svg width="8" height="8" viewBox="0 0 8 8" style={{ marginLeft: -8, flexShrink: 0 }}>
                <path d="M0 1 L7 4 L0 7 Z" fill={CHART_COLORS.textDim} />
              </svg>
            )}
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: CHART_COLORS.border }} />}
          </div>
          {/* Node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "color-mix(in srgb, var(--accent) 8%, var(--bg))",
              border: `1px solid ${INDUSTRIAL[0]}`,
              fontSize: 11, fontWeight: 600, color: INDUSTRIAL[0],
            }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{step.label}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", whiteSpace: "nowrap" }}>{step.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Recent documents with processing status tags. */
function RecentDocs() {
  const docs = [
    { id: "1", title: "报销流程指南", space: "财务制度", updated: "2 分钟前", status: "已索引" },
    { id: "2", title: "新员工入职手册", space: "人力资源", updated: "1 小时前", status: "已索引" },
    { id: "3", title: "产品架构总览", space: "研发", updated: "3 小时前", status: "处理中" },
    { id: "4", title: "差旅标准与报销", space: "财务制度", updated: "昨天", status: "已索引" },
  ];
  const statusColor = (status: string) => status === "已索引" ? CHART_COLORS.green : CHART_COLORS.amber;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {docs.map((doc) => (
        <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12 }}>
          <span style={{ width: 18, textAlign: "center", color: "var(--text-muted)" }}><FileIcon /></span>
          <span style={{ flex: 1, minWidth: 0, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
          <span style={{ fontSize: 10, color: "var(--text-dim)", width: 56, flexShrink: 0, textAlign: "right" }}>{doc.space}</span>
          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 3, color: "#fff", background: statusColor(doc.status), flexShrink: 0, textAlign: "center" }}>{doc.status}</span>
          <span style={{ fontSize: 10, color: "var(--text-dim)", width: 64, flexShrink: 0, textAlign: "right" }}>{doc.updated}</span>
        </div>
      ))}
    </div>
  );
}

/** Knowledge graph preview (echarts graph). */
function GraphPreview() {
  const nodes = [
    { name: "财务制度", category: 0, symbolSize: 34, itemStyle: { color: CHART_COLORS.accent } },
    { name: "报销流程指南", category: 1, symbolSize: 22, itemStyle: { color: CHART_COLORS.cyan } },
    { name: "差旅标准与报销", category: 1, symbolSize: 22, itemStyle: { color: CHART_COLORS.cyan } },
    { name: "人力资源", category: 0, symbolSize: 30, itemStyle: { color: CHART_COLORS.green } },
    { name: "新员工入职手册", category: 1, symbolSize: 22, itemStyle: { color: CHART_COLORS.cyan } },
    { name: "研发", category: 0, symbolSize: 26, itemStyle: { color: CHART_COLORS.amber } },
    { name: "产品架构总览", category: 1, symbolSize: 22, itemStyle: { color: CHART_COLORS.cyan } },
  ];
  const links = [
    { source: "财务制度", target: "报销流程指南" },
    { source: "财务制度", target: "差旅标准与报销" },
    { source: "人力资源", target: "新员工入职手册" },
    { source: "研发", target: "产品架构总览" },
    { source: "报销流程指南", target: "差旅标准与报销" },
  ];
  const option = {
    tooltip: { ...TOOLTIP },
    animationDurationUpdate: 800,
    series: [{
      type: "graph" as const,
      layout: "force" as const,
      roam: true,
      draggable: true,
      label: { show: true, fontSize: 9, color: CHART_COLORS.textMuted, position: "bottom" as const },
      lineStyle: { color: CHART_COLORS.border, width: 1, curveness: 0.1 },
      emphasis: { focus: "adjacency" as const, lineStyle: { width: 1.5, color: INDUSTRIAL[0] } },
      force: { repulsion: 100, edgeLength: 65 },
      data: nodes,
      links,
    }],
  };
  return <EChart option={option} height={210} />;
}

/** Section card wrapper. */
function SectionCard({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>{title}</span>
        {extra}
      </div>
      {children}
    </div>
  );
}

/** Dashboard: knowledge overview (echarts-powered). */
function DashboardPage() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
          <span style={{ verticalAlign: -2, marginRight: 6, color: "var(--accent)" }}><WikiIcon /></span>
          知识库主页
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          知识资产 · 问答质量 · 服务状态 · 构建流水线 · 知识图谱（mock 数据）
        </div>
      </div>

      {/* Row 1: asset pie + QA quality */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <SectionCard title="知识资产构成">
          <AssetPieChart />
        </SectionCard>
        <SectionCard title="问答质量评估">
          <QaQualityBars />
        </SectionCard>
      </div>

      {/* Row 2: services + pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <SectionCard title="输出与服务 · 服务运行状态" extra={<span style={{ fontSize: 10, color: CHART_COLORS.green }}>● 实时</span>}>
          <ServicesStatus />
        </SectionCard>
        <SectionCard title="知识构建流水线">
          <PipelineFlow />
        </SectionCard>
      </div>

      {/* Row 3: recent docs + graph */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <SectionCard title="最近文档">
          <RecentDocs />
        </SectionCard>
        <SectionCard title="知识图谱预览">
          <GraphPreview />
        </SectionCard>
      </div>
    </div>
  );
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
        {page === "dashboard" && <DashboardPage />}
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
  label: "知识库",
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
