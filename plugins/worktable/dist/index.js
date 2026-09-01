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
    const [handleHover, setHandleHover] = useState(false);
    const panelRef = useRef(null);
    const widthRef = useRef(width);
    const heightRef = useRef(height);
    widthRef.current = width;
    heightRef.current = height;
    const chatAreaRef = useRef(null);
    if (panelRef.current) {
      chatAreaRef.current = panelRef.current.parentElement?.parentElement?.getBoundingClientRect() ?? null;
    }
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
        const rect = chatAreaRef.current;
        if (!rect) {
          const { innerWidth: w, innerHeight: h } = window;
          if (ev.clientX < w / 4) return "left";
          if (ev.clientX > 3 * w / 4) return "right";
          return ev.clientY < h / 2 ? "top" : "bottom";
        }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        if (x < rect.width / 4) return "left";
        if (x > rect.width * 3 / 4) return "right";
        return y < rect.height / 2 ? "top" : "bottom";
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
      const side2 = api.getDockSide();
      const horizontal2 = side2 === "left" || side2 === "right";
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = widthRef.current;
      const startHeight = heightRef.current;
      const clamp = (v) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, v));
      const move = (ev) => {
        if (horizontal2) {
          const delta = side2 === "left" ? ev.clientX - startX : startX - ev.clientX;
          setWidth(clamp(startWidth + delta));
        } else {
          const delta = side2 === "top" ? ev.clientY - startY : startY - ev.clientY;
          setHeight(clamp(startHeight + delta));
        }
      };
      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        setResizing(false);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    const side = api.getDockSide();
    const horizontal = side === "left" || side === "right";
    const borderStyle = horizontal ? {
      borderRight: side === "left" ? "1px solid var(--border)" : "none",
      borderLeft: side === "right" ? "1px solid var(--border)" : "none"
    } : {
      borderBottom: side === "top" ? "1px solid var(--border)" : "none",
      borderTop: side === "bottom" ? "1px solid var(--border)" : "none"
    };
    const handleStyle = horizontal ? {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: side === "right" ? 0 : void 0,
      right: side === "left" ? 0 : void 0,
      width: 8,
      cursor: "col-resize",
      zIndex: 20
    } : {
      position: "absolute",
      left: 0,
      right: 0,
      top: side === "bottom" ? 0 : void 0,
      bottom: side === "top" ? 0 : void 0,
      height: 8,
      cursor: "row-resize",
      zIndex: 20
    };
    const chatAreaRect = dragging ? chatAreaRef.current : null;
    return /* @__PURE__ */ window.React.createElement(window.React.Fragment, null, /* @__PURE__ */ window.React.createElement(
      "div",
      {
        ref: panelRef,
        style: {
          width: "100%",
          height: "100%",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-panel)",
          ...borderStyle,
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
        /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", alignItems: "center", gap: 6 } }, title),
        /* @__PURE__ */ window.React.createElement(
          "button",
          {
            type: "button",
            onMouseDown: (e) => e.stopPropagation(),
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
      /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" } }, children)
    ), /* @__PURE__ */ window.React.createElement(
      "div",
      {
        onMouseDown: startResize,
        onMouseEnter: () => setHandleHover(true),
        onMouseLeave: () => setHandleHover(false),
        role: "separator",
        "aria-orientation": horizontal ? "vertical" : "horizontal",
        title: "\u62D6\u62FD\u8C03\u6574\u5927\u5C0F",
        style: {
          ...handleStyle,
          background: resizing ? "var(--accent)" : handleHover ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "transparent",
          transition: "background 0.1s ease"
        }
      }
    ), dragging && chatAreaRect && /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          left: chatAreaRect.left,
          top: chatAreaRect.top,
          width: chatAreaRect.width,
          height: chatAreaRect.height,
          zIndex: 9999,
          pointerEvents: "none"
        }
      },
      /* @__PURE__ */ window.React.createElement(DropZone, { side: "top", hint: dragHint }),
      /* @__PURE__ */ window.React.createElement(DropZone, { side: "left", hint: dragHint }),
      /* @__PURE__ */ window.React.createElement(DropZone, { side: "right", hint: dragHint }),
      /* @__PURE__ */ window.React.createElement(DropZone, { side: "bottom", hint: dragHint })
    ));
  }

  // plugins-dev/robopi-plugins/plugins/worktable/src/index.tsx
  var { useEffect: useEffect2, useState: useState2 } = window.React;
  var robopi = window.robopi;
  if (!robopi) {
    throw new Error("[worktable] \u5BBF\u4E3B\u672A\u6CE8\u5165 robopi API");
  }
  var selectedWorktableId = "control-room";
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
  function ControlRoomIcon() {
    return /* @__PURE__ */ window.React.createElement("svg", { ...iconProps }, /* @__PURE__ */ window.React.createElement("rect", { x: "3", y: "3", width: "8", height: "10", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "13", y: "3", width: "8", height: "6", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "13", y: "11", width: "8", height: "10", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "3", y: "15", width: "8", height: "6", rx: "1.5" }));
  }
  function OfficeIcon() {
    return /* @__PURE__ */ window.React.createElement("svg", { ...iconProps }, /* @__PURE__ */ window.React.createElement("path", { d: "M3 21h18" }), /* @__PURE__ */ window.React.createElement("path", { d: "M5 21V7l7-4 7 4v14" }), /* @__PURE__ */ window.React.createElement("path", { d: "M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" }));
  }
  function ControlRoomPanel({ api }) {
    const [items, setItems] = useState2(BUILTIN_ITEMS);
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
    }, []);
    const registeredIds = new Set(items.map((i) => i.id));
    const mockCards = [
      { id: "office", label: "\u529E\u516C\u52A9\u624B", icon: /* @__PURE__ */ window.React.createElement(OfficeIcon, null), description: "\u65E5\u7A0B \xB7 \u90AE\u4EF6 \xB7 \u5BA1\u6279" }
    ].filter((card) => !registeredIds.has(card.id));
    return /* @__PURE__ */ window.React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "28px 24px", gap: 24, overflowY: "auto" } }, /* @__PURE__ */ window.React.createElement("div", { style: { textAlign: "center", padding: "16px 0 4px" } }, /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          width: 52,
          height: 52,
          margin: "0 auto 12px",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "color-mix(in srgb, var(--accent) 12%, var(--bg))",
          color: "var(--accent)",
          border: "1px solid color-mix(in srgb, var(--accent) 28%, var(--border))"
        }
      },
      /* @__PURE__ */ window.React.createElement("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ window.React.createElement("rect", { x: "3", y: "3", width: "8", height: "10", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "13", y: "3", width: "8", height: "6", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "13", y: "11", width: "8", height: "10", rx: "1.5" }), /* @__PURE__ */ window.React.createElement("rect", { x: "3", y: "15", width: "8", height: "6", rx: "1.5" }))
    ), /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 17, fontWeight: 700, color: "var(--text)" } }, "\u6B22\u8FCE\u4F7F\u7528 RoboPi \u5DE5\u4F5C\u53F0"), /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 } }, "\u96C6\u4E2D\u7BA1\u7406\u4F60\u7684\u5DE5\u4F5C\u53F0 \xB7 \u4ECE\u4E0B\u65B9\u9009\u62E9\u8FDB\u5165\uFF0C\u6216\u70B9\u51FB\u5DE6\u4FA7\u5217\u8868\u5207\u6362")), /* @__PURE__ */ window.React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12
        }
      },
      items.map((item) => /* @__PURE__ */ window.React.createElement(
        "button",
        {
          key: item.id,
          type: "button",
          onClick: () => setSelectedWorktableId(item.id),
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 10,
            padding: 14,
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "left",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            transition: "border-color 0.12s ease, box-shadow 0.12s ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 45%, var(--border))";
            e.currentTarget.style.boxShadow = "0 2px 10px color-mix(in srgb, var(--accent) 10%, transparent)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }
        },
        /* @__PURE__ */ window.React.createElement("span", { style: { color: "var(--accent)", display: "flex" } }, item.icon),
        /* @__PURE__ */ window.React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text)" } }, item.label),
        item.description && /* @__PURE__ */ window.React.createElement("span", { style: { fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 } }, item.description)
      )),
      mockCards.map((card) => /* @__PURE__ */ window.React.createElement(
        "div",
        {
          key: `mock-${card.id}`,
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 10,
            padding: 14,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--bg-panel) 60%, var(--bg))",
            border: "1px dashed var(--border)",
            opacity: 0.75
          }
        },
        /* @__PURE__ */ window.React.createElement("span", { style: { color: "var(--text-muted)", display: "flex" } }, card.icon),
        /* @__PURE__ */ window.React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--text)" } }, card.label, /* @__PURE__ */ window.React.createElement("span", { style: { marginLeft: 6, fontSize: 10, color: "var(--text-dim)", fontWeight: 400 } }, "\u5373\u5C06\u63A8\u51FA")),
        /* @__PURE__ */ window.React.createElement("span", { style: { fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 } }, card.description)
      ))
    ));
  }
  var BUILTIN_ITEMS = [
    {
      id: "control-room",
      label: "\u63A7\u5236\u5BA4",
      icon: /* @__PURE__ */ window.React.createElement(ControlRoomIcon, null),
      description: "\u6B22\u8FCE\u9875\u4E0E\u5DE5\u4F5C\u53F0\u603B\u89C8",
      component: ControlRoomPanel
    }
  ];
  function PlaceholderPanel({ item }) {
    return /* @__PURE__ */ window.React.createElement("div", { style: { fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6, padding: 12 } }, /* @__PURE__ */ window.React.createElement("div", { style: { fontWeight: 700, color: "var(--text)", marginBottom: 6 } }, item.icon, " ", item.label), item.description && /* @__PURE__ */ window.React.createElement("div", { style: { marginBottom: 6 } }, item.description), /* @__PURE__ */ window.React.createElement("div", null, "\u8BE5\u5DE5\u4F5C\u53F0\u5C1A\u672A\u5B89\u88C5\u5BF9\u5E94\u63D2\u4EF6\uFF08", item.id, "\uFF09\uFF0C\u5B89\u88C5\u540E\u81EA\u52A8\u542F\u7528\u3002"));
  }
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
    }, []);
    return /* @__PURE__ */ window.React.createElement("div", { style: { display: "flex", flexDirection: "column", minHeight: 0, borderTop: "1px solid var(--border)" } }, /* @__PURE__ */ window.React.createElement(
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
      /* @__PURE__ */ window.React.createElement("span", null, "\u5DE5\u4F5C\u53F0"),
      /* @__PURE__ */ window.React.createElement("span", { style: { marginLeft: "auto", color: "var(--text-dim)", fontWeight: 400, fontSize: 11 } }, items.length)
    ), open && /* @__PURE__ */ window.React.createElement("div", { style: { padding: "2px 4px 4px" } }, items.map((item) => {
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
        /* @__PURE__ */ window.React.createElement("span", { style: { color: active ? "var(--accent)" : "var(--text-muted)", display: "flex" } }, item.icon),
        /* @__PURE__ */ window.React.createElement("span", { style: { overflow: "hidden", textOverflow: "ellipsis" } }, item.label)
      );
    })));
  }
  function WorktableDockPanel() {
    const [items, setItems] = useState2(BUILTIN_ITEMS);
    const selected = useSelectedWorktableId();
    useEffect2(() => {
      const refresh = () => {
        const registered = pluginApiShim.getWorktableItems();
        if (registered.length === 0) return;
        const merged = /* @__PURE__ */ new Map();
        for (const item2 of BUILTIN_ITEMS) merged.set(item2.id, item2);
        for (const item2 of registered) merged.set(item2.id, item2);
        setItems([...merged.values()]);
      };
      refresh();
      const timer = setInterval(refresh, 5e3);
      return () => clearInterval(timer);
    }, [selected]);
    const item = items.find((i) => i.id === selected) ?? items[0];
    return /* @__PURE__ */ window.React.createElement(
      DockPanel,
      {
        title: item ? /* @__PURE__ */ window.React.createElement(window.React.Fragment, null, item.icon, " ", item.label) : "\u5DE5\u4F5C\u53F0",
        api: pluginApiShim
      },
      !item && /* @__PURE__ */ window.React.createElement("div", { style: { padding: 12, fontSize: 12, color: "var(--text-dim)" } }, "\u65E0\u5DE5\u4F5C\u53F0"),
      item && item.component ? /* @__PURE__ */ window.React.createElement(item.component, { api: pluginApiShim }) : item ? /* @__PURE__ */ window.React.createElement(PlaceholderPanel, { item }) : null
    );
  }
  robopi.registerSlot("sidebar-bottom", (api) => /* @__PURE__ */ window.React.createElement(WorktablePanel, { api }));
  robopi.registerDockPanel(() => /* @__PURE__ */ window.React.createElement(WorktableDockPanel, null));
  var pluginApiShim = {
    getStatus: () => fetch("/api/robopi/status", { cache: "no-store" }).then((r) => r.json()),
    listSessions: () => fetch("/api/sessions", { cache: "no-store" }).then((r) => r.json()),
    openSession: (sessionId) => {
      window.location.assign(`/?session=${encodeURIComponent(sessionId)}`);
    },
    getWorktableItems: () => window.robopi.getWorktableItems?.() ?? [],
    openDock: () => window.robopi.openDock?.(),
    setDockSide: (side) => window.robopi.setDockSide?.(side),
    getDockSide: () => window.robopi.getDockSide?.() ?? "left"
  };
  console.log("[worktable] loaded \u2705 (\u5DE5\u4F5C\u53F0\u5BB9\u5668)");
})();
