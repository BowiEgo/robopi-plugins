"use strict";
(() => {
  // plugins-dev/robopi-workspace/plugins/workspace/src/index.tsx
  var { useEffect, useState } = window.React;
  var robopi = window.robopi;
  if (!robopi) {
    throw new Error("[workspace] \u5BBF\u4E3B\u672A\u6CE8\u5165 robopi API");
  }
  function StatsPanel({ api }) {
    const [stats, setStats] = useState(null);
    useEffect(() => {
      let cancelled = false;
      Promise.all([api.listSessions(), api.getStatus()]).then(([sessions, status]) => {
        if (cancelled) return;
        const hello = status?.services?.hello;
        setStats({
          sessions: sessions.sessions?.length ?? 0,
          greetingCalls: hello?.calls ?? 0
        });
      }).catch(() => {
      });
      return () => {
        cancelled = true;
      };
    }, [api]);
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          margin: "8px 10px",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--tool-bg)",
          fontSize: 12,
          color: "var(--text-muted)"
        }
      },
      /* @__PURE__ */ window.React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 6 } }, "\u26A1 workspace v0.4.0\uFF08npm run dev \u5185\u5EFA watch\uFF09"),
      /* @__PURE__ */ window.React.createElement("div", null, "\u4F1A\u8BDD\u6570\uFF1A", stats ? stats.sessions : "\u2026"),
      /* @__PURE__ */ window.React.createElement("div", null, "\u63A2\u9488\u8C03\u7528\uFF1A", stats ? stats.greetingCalls : "\u2026")
    );
  }
  function SummaryCard({ message }) {
    let text = "";
    try {
      const content = message?.message?.content;
      if (typeof content === "string") text = content;
      else if (Array.isArray(content)) {
        text = content.map((block) => block && typeof block.text === "string" ? block.text : "").join("");
      }
    } catch {
      text = String(message);
    }
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          margin: "8px 0",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--border))",
          background: "color-mix(in srgb, var(--accent) 6%, var(--bg))",
          fontSize: 13
        }
      },
      /* @__PURE__ */ window.React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } }, "\u{1F4CB} TSX \u4F1A\u8BDD\u6458\u8981"),
      /* @__PURE__ */ window.React.createElement("div", null, text || "\uFF08\u7A7A\u5185\u5BB9\uFF09")
    );
  }
  robopi.registerSlot("sidebar-bottom", (api) => /* @__PURE__ */ window.React.createElement(StatsPanel, { api }));
  robopi.registerMessageRenderer("session-summary", (message) => /* @__PURE__ */ window.React.createElement(SummaryCard, { message }));
  console.log("[workspace] loaded \u2705 (TSX)");
})();
