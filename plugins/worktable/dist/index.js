"use strict";
(() => {
  // plugins-dev/robopi-plugins/plugins/worktable/src/index.tsx
  var { useEffect, useRef, useState } = window.React;
  var robopi = window.robopi;
  if (!robopi) {
    throw new Error("[worktable] \u5BBF\u4E3B\u672A\u6CE8\u5165 robopi API");
  }
  var selectedWorktableId = "overview";
  var selectedListeners = /* @__PURE__ */ new Set();
  function getSelectedWorktableId() {
    return selectedWorktableId;
  }
  function setSelectedWorktableId(id) {
    selectedWorktableId = id;
    selectedListeners.forEach((listener) => listener());
  }
  function useSelectedWorktableId() {
    const [, forceRender] = useState(0);
    useEffect(() => {
      const listener = () => forceRender((n) => n + 1);
      selectedListeners.add(listener);
      return () => {
        selectedListeners.delete(listener);
      };
    }, []);
    return getSelectedWorktableId();
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
    const selected = useSelectedWorktableId();
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
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          minHeight: 0
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
            padding: "6px 8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.4
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
            onClick: () => {
              setSelectedWorktableId(item.id);
              api.openDock();
            },
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              height: 24,
              padding: "0 8px",
              borderRadius: 4,
              cursor: "pointer",
              background: active ? "var(--bg-selected)" : "transparent",
              border: "none",
              fontSize: 12,
              color: "var(--text)",
              textAlign: "left",
              whiteSpace: "nowrap"
            },
            onMouseEnter: (e) => {
              if (!active) e.currentTarget.style.background = "var(--bg-hover)";
            },
            onMouseLeave: (e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }
          },
          /* @__PURE__ */ window.React.createElement("span", { "aria-hidden": true }, item.icon ?? "\u2022"),
          /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.label)
        );
      }))
    );
  }
  robopi.registerSlot("sidebar-bottom", (api) => /* @__PURE__ */ window.React.createElement(WorktablePanel, { api }));
  robopi.registerDockPanel(() => /* @__PURE__ */ window.React.createElement(WorktableDockPanel, null));
  var DOCK_WIDTH_KEY = "robopi-worktable-width";
  var DOCK_WIDTH_MIN = 240;
  var DOCK_WIDTH_MAX = 560;
  function WorktableDockPanel() {
    const [width, setWidth] = useState(() => {
      const stored = Number(window.localStorage.getItem(DOCK_WIDTH_KEY));
      return Number.isFinite(stored) ? Math.min(DOCK_WIDTH_MAX, Math.max(DOCK_WIDTH_MIN, stored)) : 320;
    });
    const [items, setItems] = useState(BUILTIN_ITEMS);
    const selected = useSelectedWorktableId();
    const [resizing, setResizing] = useState(false);
    const widthRef = useRef(width);
    widthRef.current = width;
    useEffect(() => {
      try {
        window.localStorage.setItem(DOCK_WIDTH_KEY, String(width));
      } catch {
      }
    }, [width]);
    useEffect(() => {
      const refresh = () => {
        const registered = window.robopi.getWorktableItems?.() ?? [];
        if (registered.length === 0) return;
        const merged = /* @__PURE__ */ new Map();
        for (const item2 of BUILTIN_ITEMS) merged.set(item2.id, item2);
        for (const item2 of registered) merged.set(item2.id, item2);
        setItems([...merged.values()]);
      };
      refresh();
      const timer = setInterval(refresh, 5e3);
      return () => clearInterval(timer);
    }, []);
    const startResize = (e) => {
      e.preventDefault();
      setResizing(true);
      const startX = e.clientX;
      const startWidth = widthRef.current;
      const move = (ev) => {
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
    return /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          width,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border)",
          position: "relative"
        }
      },
      /* @__PURE__ */ window.React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 32,
            padding: "0 10px",
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)",
            userSelect: "none"
          }
        },
        /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 } }, "\u{1F9E9} \u5DE5\u4F5C\u53F0"),
        /* @__PURE__ */ window.React.createElement(
          "button",
          {
            type: "button",
            onClick: () => window.robopi?.setDockOpen?.(false),
            "aria-label": "\u5173\u95ED\u5DE5\u4F5C\u53F0",
            title: "\u5173\u95ED\u5DE5\u4F5C\u53F0",
            style: {
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontSize: 14,
              padding: "2px 6px",
              borderRadius: 4
            }
          },
          "\xD7"
        )
      ),
      /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, minHeight: 0, overflowY: "auto" } }, !item && /* @__PURE__ */ window.React.createElement("div", { style: { padding: 12, fontSize: 12, color: "var(--text-dim)" } }, "\u65E0\u5DE5\u4F5C\u53F0"), item && item.component ? /* @__PURE__ */ window.React.createElement(item.component, { api: pluginApiShim }) : item ? /* @__PURE__ */ window.React.createElement("div", { style: { padding: 12 } }, /* @__PURE__ */ window.React.createElement(PlaceholderPanel, { item })) : null),
      /* @__PURE__ */ window.React.createElement(
        "div",
        {
          onMouseDown: startResize,
          role: "separator",
          "aria-orientation": "vertical",
          title: "\u62D6\u62FD\u8C03\u6574\u5BBD\u5EA6",
          style: {
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: 6,
            cursor: "col-resize",
            background: resizing ? "var(--accent)" : "transparent",
            transition: "background 0.1s ease"
          }
        }
      )
    );
  }
  var pluginApiShim = {
    getStatus: () => fetch("/api/robopi/status", { cache: "no-store" }).then((r) => r.json()),
    listSessions: () => fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()),
    openSession: (sessionId) => {
      window.location.assign(`/?session=${encodeURIComponent(sessionId)}`);
    },
    getWorktableItems: () => window.robopi.getWorktableItems?.() ?? [],
    openDock: () => window.robopi.openDock?.()
  };
  console.log("[worktable] loaded \u2705 (\u5DE5\u4F5C\u53F0\u5BB9\u5668)");
})();
