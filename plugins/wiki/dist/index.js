"use strict";
(() => {
  // plugins-dev/robopi-plugins/plugins/wiki/src/index.tsx
  var { useEffect, useState } = window.React;
  var robopi = window.robopi;
  if (!robopi) {
    throw new Error("[wiki] \u5BBF\u4E3B\u672A\u6CE8\u5165 robopi API");
  }
  var iconProps = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };
  function WikiIcon() {
    return /* @__PURE__ */ window.React.createElement("svg", { ...iconProps }, /* @__PURE__ */ window.React.createElement("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }), /* @__PURE__ */ window.React.createElement("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" }));
  }
  function SearchIcon() {
    return /* @__PURE__ */ window.React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" }, /* @__PURE__ */ window.React.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ window.React.createElement("path", { d: "m21 21-4.3-4.3" }));
  }
  function FileIcon() {
    return /* @__PURE__ */ window.React.createElement("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), /* @__PURE__ */ window.React.createElement("path", { d: "M14 2v6h6" }));
  }
  var PAGES = [
    { id: "dashboard", label: "\u5DE5\u4F5C\u53F0" },
    { id: "documents", label: "\u6587\u6863\u7BA1\u7406" },
    { id: "wiki", label: "Wiki \u77E5\u8BC6\u5E93" },
    { id: "graph", label: "\u77E5\u8BC6\u56FE\u8C31" },
    { id: "evaluate", label: "\u8BC4\u4F30\u4E0E\u4F18\u5316" }
  ];
  function syncBreadcrumb(page) {
    const label = PAGES.find((p) => p.id === page)?.label ?? "";
    const api = window.robopiWorktable;
    api?.setPath("wiki", page === "dashboard" ? [] : [label]);
  }
  function PagePlaceholder({ title, description }) {
    return /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 32, color: "var(--text-muted)", textAlign: "center" } }, /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--text)" } }, title), /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, maxWidth: 420, lineHeight: 1.6 } }, description), /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 11, color: "var(--text-dim)", marginTop: 4 } }, "\u5EFA\u8BBE\u4E2D \xB7 \u6309 robopi-plugins/wiki \u8BBE\u8BA1\u6587\u6863\u5B9E\u65BD"));
  }
  var MOCK_DOCS = [
    { id: "1", title: "\u62A5\u9500\u6D41\u7A0B\u6307\u5357", space: "\u8D22\u52A1\u5236\u5EA6", updated: "2026-08-28", tags: ["\u6D41\u7A0B", "\u8D22\u52A1"] },
    { id: "2", title: "\u65B0\u5458\u5DE5\u5165\u804C\u624B\u518C", space: "\u4EBA\u529B\u8D44\u6E90", updated: "2026-08-25", tags: ["\u5165\u804C"] },
    { id: "3", title: "\u4EA7\u54C1\u67B6\u6784\u603B\u89C8", space: "\u7814\u53D1", updated: "2026-08-22", tags: ["\u67B6\u6784"] },
    { id: "4", title: "\u5DEE\u65C5\u6807\u51C6\u4E0E\u62A5\u9500", space: "\u8D22\u52A1\u5236\u5EA6", updated: "2026-08-20", tags: ["\u5DEE\u65C5"] },
    { id: "5", title: "\u77E5\u8BC6\u5E93\u4F7F\u7528\u89C4\u8303", space: "\u901A\u7528", updated: "2026-08-18", tags: ["\u89C4\u8303"] }
  ];
  function WikiPanel({ api }) {
    const [page, setPage] = useState("dashboard");
    const [query, setQuery] = useState("");
    useEffect(() => {
      syncBreadcrumb(page);
    }, [page]);
    useEffect(() => {
      const worktable = window.robopiWorktable;
      if (!worktable?.onPathNavigate) return;
      return worktable.onPathNavigate((id, targetIndex) => {
        if (id !== "wiki") return;
        if (targetIndex === -1) {
          setPage("dashboard");
          return;
        }
        const path = window.robopiWorktable?.getPath("wiki") ?? [];
        const targetLabel = path[targetIndex];
        const target = PAGES.find((p) => p.label === targetLabel);
        if (target) setPage(target.id);
      });
    }, []);
    const docs = query.trim() ? MOCK_DOCS.filter(
      (d) => (d.title + d.space + d.tags.join("")).toLowerCase().includes(query.trim().toLowerCase())
    ) : MOCK_DOCS;
    return /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0 } }, /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "8px 10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          flexWrap: "wrap"
        }
      },
      PAGES.map((p) => {
        const active = p.id === page;
        return /* @__PURE__ */ window.React.createElement(
          "button",
          {
            key: p.id,
            type: "button",
            onClick: () => setPage(p.id),
            style: {
              border: "none",
              background: active ? "var(--bg-selected)" : "transparent",
              color: active ? "var(--text)" : "var(--text-muted)",
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer"
            },
            onMouseEnter: (e) => {
              if (!active) e.currentTarget.style.background = "var(--bg-hover)";
            },
            onMouseLeave: (e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }
          },
          p.label
        );
      })
    ), /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, minHeight: 0, overflowY: "auto", padding: 16 } }, page === "dashboard" && /* @__PURE__ */ window.React.createElement(
      PagePlaceholder,
      {
        title: "\u5DE5\u4F5C\u53F0",
        description: "Wiki \u77E5\u8BC6\u5E93\u5DE5\u4F5C\u53F0\u4EEA\u8868\u76D8\uFF08\u9884\u7559\uFF09\uFF1A\u6700\u8FD1\u6587\u6863\u3001\u77E5\u8BC6\u7EDF\u8BA1\u3001\u5FEB\u6377\u5165\u53E3\u5C06\u5728\u6B64\u5C55\u793A\u3002"
      }
    ), page === "documents" && /* @__PURE__ */ window.React.createElement(
      PagePlaceholder,
      {
        title: "\u6587\u6863\u7BA1\u7406",
        description: "\u6587\u6863\u6811\u3001Markdown \u7F16\u8F91\u5668\u3001\u7248\u672C\u5386\u53F2\u4E0E\u5168\u6587\u68C0\u7D22\u3002"
      }
    ), page === "graph" && /* @__PURE__ */ window.React.createElement(
      PagePlaceholder,
      {
        title: "\u77E5\u8BC6\u56FE\u8C31",
        description: "\u5B9E\u4F53\u4E0E\u5173\u7CFB\u53EF\u89C6\u5316\u3001\u56FE\u8C31\u6D4F\u89C8\u4E0E\u7F16\u8F91\u3002"
      }
    ), page === "evaluate" && /* @__PURE__ */ window.React.createElement(
      PagePlaceholder,
      {
        title: "\u8BC4\u4F30\u4E0E\u4F18\u5316",
        description: "\u68C0\u7D22\u8986\u76D6\u7387\u3001\u8FC7\u671F\u68C0\u6D4B\u3001\u8D28\u91CF\u62A5\u544A\u3002"
      }
    ), page === "wiki" && /* @__PURE__ */ window.React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ window.React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-dim)" } }, /* @__PURE__ */ window.React.createElement(SearchIcon, null), /* @__PURE__ */ window.React.createElement(
      "input",
      {
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: "\u641C\u7D22\u6587\u6863\u2026",
        style: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--text)" }
      }
    )), /* @__PURE__ */ window.React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, docs.length === 0 && /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, color: "var(--text-dim)", padding: "12px 4px" } }, "\u6CA1\u6709\u5339\u914D\u7684\u6587\u6863"), docs.map((doc) => /* @__PURE__ */ window.React.createElement(
      "div",
      {
        key: doc.id,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          borderRadius: 8,
          cursor: "pointer",
          border: "1px solid var(--border)",
          background: "var(--bg)"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, var(--border))";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.borderColor = "var(--border)";
        }
      },
      /* @__PURE__ */ window.React.createElement("span", { style: { color: "var(--text-muted)", display: "flex" } }, /* @__PURE__ */ window.React.createElement(FileIcon, null)),
      /* @__PURE__ */ window.React.createElement("span", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ window.React.createElement("span", { style: { display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, doc.title), /* @__PURE__ */ window.React.createElement("span", { style: { display: "block", fontSize: 10.5, color: "var(--text-dim)", marginTop: 2 } }, doc.space, " \xB7 \u66F4\u65B0\u4E8E ", doc.updated)),
      /* @__PURE__ */ window.React.createElement("span", { style: { display: "flex", gap: 4, flexShrink: 0 } }, doc.tags.map((tag) => /* @__PURE__ */ window.React.createElement("span", { key: tag, style: { fontSize: 10, color: "var(--text-muted)", background: "var(--tool-bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px" } }, tag)))
    ))))));
  }
  var pendingKey = "__robopiWorktablePending";
  var robopiWorktable = window.robopiWorktable;
  var wikiItem = {
    id: "wiki",
    label: "Wiki \u77E5\u8BC6\u5E93",
    icon: /* @__PURE__ */ window.React.createElement(WikiIcon, null),
    description: "\u4F01\u4E1A\u6587\u6863 \xB7 \u77E5\u8BC6\u5E93 \xB7 \u77E5\u8BC6\u56FE\u8C31",
    component: WikiPanel
  };
  if (robopiWorktable) {
    robopiWorktable.registerItem(wikiItem);
  } else {
    const pending = window[pendingKey];
    const queue = Array.isArray(pending) ? pending : [];
    queue.push(wikiItem);
    window[pendingKey] = queue;
  }
  console.log("[wiki] loaded \u2705 (Wiki \u77E5\u8BC6\u5E93\u5DE5\u4F5C\u53F0)");
})();
