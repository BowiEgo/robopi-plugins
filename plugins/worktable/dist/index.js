"use strict";
(() => {
  // plugins-dev/robopi-plugins/plugins/worktable/src/index.tsx
  var { useEffect, useState } = window.React;
  var robopi = window.robopi;
  if (!robopi) {
    throw new Error("[worktable] \u5BBF\u4E3B\u672A\u6CE8\u5165 robopi API");
  }
  function OverviewPanel({ api }) {
    const [stats, setStats] = useState(null);
    useEffect(() => {
      let cancelled = false;
      Promise.all([api.listSessions(), api.getStatus()]).then(([sessions, status]) => {
        if (cancelled) return;
        const hello = status?.services?.hello;
        setStats({
          sessions: sessions?.sessions?.length ?? 0,
          greetingCalls: hello?.calls ?? 0
        });
      }).catch(() => {
      });
      return () => {
        cancelled = true;
      };
    }, [api]);
    return /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 } }, /* @__PURE__ */ window.React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 6 } }, "\u{1F4CA} \u6982\u89C8"), /* @__PURE__ */ window.React.createElement("div", null, "\u4F1A\u8BDD\u6570\uFF1A", stats ? stats.sessions : "\u2026"), /* @__PURE__ */ window.React.createElement("div", null, "\u63D2\u4EF6\u63A2\u9488\u8C03\u7528\uFF1A", stats ? stats.greetingCalls : "\u2026"), /* @__PURE__ */ window.React.createElement("div", { style: { marginTop: 8, color: "var(--text-dim)", fontSize: 11 } }, "\u5DE5\u4F5C\u53F0\u9879\u7531\u63D2\u4EF6\u6CE8\u518C\uFF08wiki\u3001\u529E\u516C\u52A9\u624B\u2026\uFF09\uFF0C\u540C\u540D id \u53EF\u8986\u76D6\u5185\u7F6E\u5360\u4F4D\u3002"));
  }
  function PlaceholderPanel({ item }) {
    return /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 } }, /* @__PURE__ */ window.React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 6 } }, item.icon ?? "\u{1F9E9}", " ", item.label), item.description && /* @__PURE__ */ window.React.createElement("div", { style: { marginBottom: 6 } }, item.description), /* @__PURE__ */ window.React.createElement("div", null, "\u8BE5\u5DE5\u4F5C\u53F0\u5C1A\u672A\u5B89\u88C5\u5BF9\u5E94\u63D2\u4EF6\uFF08", item.id, "\uFF09\uFF0C\u5B89\u88C5\u540E\u81EA\u52A8\u542F\u7528\u3002"));
  }
  var BUILTIN_ITEMS = [
    {
      id: "overview",
      label: "\u6982\u89C8",
      icon: "\u{1F4CA}",
      description: "\u4F1A\u8BDD\u7EDF\u8BA1\u4E0E\u63D2\u4EF6\u72B6\u6001",
      component: OverviewPanel
    },
    {
      id: "wiki",
      label: "Wiki \u77E5\u8BC6\u5E93",
      icon: "\u{1F4DA}",
      description: "\u4F01\u4E1A\u77E5\u8BC6\u5E93\uFF08\u6587\u6863/Wiki/\u77E5\u8BC6\u56FE\u8C31\uFF0C\u89C1 robopi-plugins/wiki \u8BBE\u8BA1\uFF09"
    },
    {
      id: "office",
      label: "\u529E\u516C\u52A9\u624B",
      icon: "\u{1F9D1}\u200D\u{1F4BC}",
      description: "\u65E5\u7A0B/\u90AE\u4EF6/\u5BA1\u6279\u7B49\u529E\u516C\u5DE5\u5177"
    }
  ];
  function WorktablePanel({ api }) {
    const [open, setOpen] = useState(true);
    const [items, setItems] = useState(BUILTIN_ITEMS);
    const [selected, setSelected] = useState("overview");
    useEffect(() => {
      const refresh = () => {
        const registered = api.getWorktableItems();
        if (registered.length === 0) return;
        const merged = /* @__PURE__ */ new Map();
        for (const item of BUILTIN_ITEMS) merged.set(item.id, item);
        for (const item of registered) merged.set(item.id, item);
        setItems([...merged.values()]);
      };
      refresh();
      const timer = setInterval(refresh, 5e3);
      return () => clearInterval(timer);
    }, [api]);
    const selectedItem = items.find((i) => i.id === selected) ?? items[0];
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          margin: "8px 10px",
          borderRadius: 10,
          border: "1px solid var(--border)",
          background: "var(--tool-bg)",
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ window.React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setOpen((v) => !v),
          "aria-expanded": open,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            width: "100%",
            padding: "8px 10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)"
          }
        },
        /* @__PURE__ */ window.React.createElement(
          "svg",
          {
            width: "10",
            height: "10",
            viewBox: "0 0 10 10",
            fill: "none",
            stroke: "var(--text-dim)",
            strokeWidth: "1.8",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            style: { flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.1s" }
          },
          /* @__PURE__ */ window.React.createElement("polyline", { points: "3 2 7 5 3 8" })
        ),
        /* @__PURE__ */ window.React.createElement("span", null, "\u{1F9E9} \u5DE5\u4F5C\u53F0"),
        /* @__PURE__ */ window.React.createElement("span", { style: { marginLeft: "auto", color: "var(--text-dim)", fontWeight: 400, fontSize: 11 } }, items.length)
      ),
      open && /* @__PURE__ */ window.React.createElement("div", { style: { borderTop: "1px solid var(--border)", padding: 4 } }, items.map((item) => {
        const active = selected === item.id;
        return /* @__PURE__ */ window.React.createElement(
          "button",
          {
            key: item.id,
            type: "button",
            onClick: () => setSelected(item.id),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
              background: active ? "var(--bg-selected)" : "transparent",
              border: "none",
              fontSize: 12,
              color: "var(--text)",
              textAlign: "left"
            }
          },
          /* @__PURE__ */ window.React.createElement("span", { "aria-hidden": true }, item.icon ?? "\u2022"),
          /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.label)
        );
      }), selectedItem && /* @__PURE__ */ window.React.createElement(
        "div",
        {
          style: {
            marginTop: 4,
            padding: "10px 8px",
            borderTop: "1px solid var(--border)",
            fontSize: 12
          }
        },
        selectedItem.component ? /* @__PURE__ */ window.React.createElement(selectedItem.component, { api }) : /* @__PURE__ */ window.React.createElement(PlaceholderPanel, { item: selectedItem })
      ))
    );
  }
  robopi.registerSlot("sidebar-bottom", (api) => /* @__PURE__ */ window.React.createElement(WorktablePanel, { api }));
  console.log("[worktable] loaded \u2705 (\u5DE5\u4F5C\u53F0\u5BB9\u5668)");
})();
