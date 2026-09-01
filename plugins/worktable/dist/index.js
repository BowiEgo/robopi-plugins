"use strict";
(() => {
  // plugins-dev/robopi-plugins/plugins/worktable/src/dock-panel.tsx
  var { useEffect, useRef, useState } = window.React;
  var MIN_SIZE = 200;
  var MAX_SIZE = 640;
  var WIDTH_KEY = "robopi-worktable-width";
  var HEIGHT_KEY = "robopi-worktable-height";
  function DropZone({ side, hint }) {
    const highlighted = hint === side;
    const base = {
      position: "absolute",
      pointerEvents: "none",
      background: highlighted ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
      transition: "background 0.1s ease"
    };
    const rect = side === "left" ? { top: 0, bottom: 0, left: 0, width: "28%", borderRight: highlighted ? "3px solid var(--accent)" : "none" } : side === "right" ? { top: 0, bottom: 0, right: 0, width: "28%", borderLeft: highlighted ? "3px solid var(--accent)" : "none" } : side === "top" ? { left: 0, right: 0, top: 0, height: "28%", borderBottom: highlighted ? "3px solid var(--accent)" : "none" } : { left: 0, right: 0, bottom: 0, height: "28%", borderTop: highlighted ? "3px solid var(--accent)" : "none" };
    return /* @__PURE__ */ window.React.createElement("div", { style: { ...base, ...rect } });
  }
  function readStoredSize(key, fallback) {
    const stored = Number(window.localStorage.getItem(key));
    return Number.isFinite(stored) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, stored)) : fallback;
  }
  function DockPanel({ title, api, children }) {
    const [width, setWidth] = useState(() => readStoredSize(WIDTH_KEY, 320));
    const [height, setHeight] = useState(() => readStoredSize(HEIGHT_KEY, 280));
    const [dragHint, setDragHint] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const widthRef = useRef(width);
    const heightRef = useRef(height);
    widthRef.current = width;
    heightRef.current = height;
    useEffect(() => {
      try {
        window.localStorage.setItem(WIDTH_KEY, String(width));
      } catch {
      }
    }, [width]);
    useEffect(() => {
      try {
        window.localStorage.setItem(HEIGHT_KEY, String(height));
      } catch {
      }
    }, [height]);
    const startHeaderDrag = (e) => {
      e.preventDefault();
      setDragging(true);
      const pick = (ev) => {
        const { innerWidth: w, innerHeight: h } = window;
        if (ev.clientX < w / 4) return "left";
        if (ev.clientX > 3 * w / 4) return "right";
        return ev.clientY < h / 2 ? "top" : "bottom";
      };
      const move = (ev) => setDragHint(pick(ev));
      const up = (ev) => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        setDragging(false);
        setDragHint(null);
        api.setDockSide(pick(ev));
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    const startResize = (e) => {
      e.preventDefault();
      setResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = widthRef.current;
      const startHeight = heightRef.current;
      const move = (ev) => {
        setWidth(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startWidth + (ev.clientX - startX))));
        setHeight(Math.min(MAX_SIZE, Math.max(MIN_SIZE, startHeight + (ev.clientY - startY))));
      };
      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        setResizing(false);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    return /* @__PURE__ */ window.React.createElement(window.React.Fragment, null, /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          width,
          height,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          position: "relative"
        }
      },
      /* @__PURE__ */ window.React.createElement(
        "div",
        {
          onMouseDown: startHeaderDrag,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 30,
            padding: "0 10px",
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text)",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
            background: "var(--bg-panel)"
          },
          title: "\u62D6\u62FD\u6807\u9898\u680F\u5207\u6362\u505C\u9760\u4F4D\u7F6E\uFF08\u4E0A/\u4E0B/\u5DE6/\u53F3\uFF09"
        },
        /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 } }, title),
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
      /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, minHeight: 0, overflowY: "auto" } }, children)
    ), /* @__PURE__ */ window.React.createElement(
      "div",
      {
        onMouseDown: startResize,
        role: "separator",
        "aria-orientation": "horizontal",
        title: "\u62D6\u62FD\u8C03\u6574\u5927\u5C0F",
        style: {
          width: 12,
          height: 12,
          flexShrink: 0,
          cursor: "nwse-resize",
          position: "relative",
          background: resizing ? "var(--accent)" : "transparent",
          marginTop: -12,
          marginRight: -12,
          alignSelf: "flex-end",
          zIndex: 10,
          transition: "background 0.1s ease"
        }
      }
    ), dragging && /* @__PURE__ */ window.React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" } }, /* @__PURE__ */ window.React.createElement(DropZone, { side: "top", hint: dragHint }), /* @__PURE__ */ window.React.createElement(DropZone, { side: "left", hint: dragHint }), /* @__PURE__ */ window.React.createElement(DropZone, { side: "right", hint: dragHint }), /* @__PURE__ */ window.React.createElement(DropZone, { side: "bottom", hint: dragHint })));
  }

  // plugins-dev/robopi-plugins/plugins/worktable/src/index.tsx
  var { useEffect: useEffect2, useRef: useRef2, useState: useState2 } = window.React;
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
    const [, forceRender] = useState2(0);
    useEffect2(() => {
      const listener = () => forceRender((n) => n + 1);
      selectedListeners.add(listener);
      return () => {
        selectedListeners.delete(listener);
      };
    }, []);
    return getSelectedWorktableId();
  }
  function OverviewPanel({ api }) {
    const [stats, setStats] = useState2(null);
    useEffect2(() => {
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
    const [open, setOpen] = useState2(true);
    const [items, setItems] = useState2(BUILTIN_ITEMS);
    const selected = useSelectedWorktableId();
    useEffect2(() => {
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
  function WorktableDockPanel() {
    const [items, setItems] = useState2(BUILTIN_ITEMS);
    const selected = useSelectedWorktableId();
    useEffect2(() => {
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
    const item = items.find((i) => i.id === selected) ?? items[0];
    return /* @__PURE__ */ window.React.createElement(DockPanel, { title: "\u{1F9E9} \u5DE5\u4F5C\u53F0", api: pluginApiShim }, !item && /* @__PURE__ */ window.React.createElement("div", { style: { padding: 12, fontSize: 12, color: "var(--text-dim)" } }, "\u65E0\u5DE5\u4F5C\u53F0"), item && item.component ? /* @__PURE__ */ window.React.createElement(item.component, { api: pluginApiShim }) : item ? /* @__PURE__ */ window.React.createElement("div", { style: { padding: 12 } }, /* @__PURE__ */ window.React.createElement(PlaceholderPanel, { item })) : null);
  }
  var pluginApiShim = {
    getStatus: () => fetch("/api/robopi/status", { cache: "no-store" }).then((r) => r.json()),
    listSessions: () => fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()),
    openSession: (sessionId) => {
      window.location.assign(`/?session=${encodeURIComponent(sessionId)}`);
    },
    getWorktableItems: () => window.robopi.getWorktableItems?.() ?? [],
    openDock: () => window.robopi.openDock?.(),
    setDockSide: (side) => window.robopi.setDockSide?.(side)
  };
  console.log("[worktable] loaded \u2705 (\u5DE5\u4F5C\u53F0\u5BB9\u5668)");
})();
