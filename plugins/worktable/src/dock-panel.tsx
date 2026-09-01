/// <reference path="../plugin-env.d.ts" />

/**
 * DockPanel - a VSCode-style dockable panel rendered inside the chat area.
 *
 * Implemented entirely inside the plugin:
 * - Title bar drag re-docks the panel to any of four sides (top/left/right/
 *   bottom); drop hints are clipped to the chat area (the dock layout
 *   container), not the whole page
 * - Size adjust: corner handle, width for left/right, height for top/bottom
 * - Close button (host exposes setDockOpen)
 */

import type { DockSide, PluginApi } from "../plugin-env";
import type * as React from "react";

const { useEffect, useRef, useState } = window.React as typeof import("react");

const MIN_SIZE = 200;
const MAX_SIZE = 640;
const WIDTH_KEY = "robopi-worktable-width";
const HEIGHT_KEY = "robopi-worktable-height";

/** Drop indicator zone for a docking side (VSCode-style edge highlight). */
function DropZone({ side, hint }: { side: DockSide; hint: DockSide | null }) {
  const highlighted = hint === side;
  const base: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    background: highlighted ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "transparent",
    transition: "background 0.1s ease",
  };
  const rect: React.CSSProperties =
    side === "left"
      ? { top: 0, bottom: 0, left: 0, width: "28%", borderRight: highlighted ? "3px solid var(--accent)" : "none" }
      : side === "right"
        ? { top: 0, bottom: 0, right: 0, width: "28%", borderLeft: highlighted ? "3px solid var(--accent)" : "none" }
        : side === "top"
          ? { left: 0, right: 0, top: 0, height: "28%", borderBottom: highlighted ? "3px solid var(--accent)" : "none" }
          : { left: 0, right: 0, bottom: 0, height: "28%", borderTop: highlighted ? "3px solid var(--accent)" : "none" };
  return <div style={{ ...base, ...rect }} />;
}

/** Six-dot grip icon (industry-standard drag handle). */
function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      {[2, 6, 10].map((x) => [2, 6, 10].map((y) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} />
      )))}
    </svg>
  );
}

function readStoredSize(key: string, fallback: number): number {
  const stored = Number(window.localStorage.getItem(key));
  return Number.isFinite(stored) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, stored)) : fallback;
}

export function DockPanel({ title, api, children }: { title: React.ReactNode; api: PluginApi; children: React.ReactNode }) {
  const [width, setWidth] = useState(() => readStoredSize(WIDTH_KEY, 320));
  const [height, setHeight] = useState(() => readStoredSize(HEIGHT_KEY, 280));
  const [dragHint, setDragHint] = useState<DockSide | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [handleHover, setHandleHover] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  widthRef.current = width;
  heightRef.current = height;

  // The chat-area container (dock layout holder) rect, refreshed on render.
  const chatAreaRef = useRef<DOMRect | null>(null);
  if (panelRef.current) {
    chatAreaRef.current = panelRef.current.parentElement?.parentElement?.getBoundingClientRect() ?? null;
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDTH_KEY, String(width));
    } catch { /* ignore */ }
  }, [width]);
  useEffect(() => {
    try {
      window.localStorage.setItem(HEIGHT_KEY, String(height));
    } catch { /* ignore */ }
  }, [height]);

  /**
   * Title-bar drag: pick a docking side from the pointer position relative
   * to the chat-area container (not the whole page): left/right within the
   * outer quarters, otherwise top/bottom on the vertical half.
   */
  const startHeaderDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const pick = (ev: MouseEvent): DockSide => {
      const rect = chatAreaRef.current;
      if (!rect) {
        // Fallback: page-based quarters when the container is unknown
        const { innerWidth: w, innerHeight: h } = window;
        if (ev.clientX < w / 4) return "left";
        if (ev.clientX > (3 * w) / 4) return "right";
        return ev.clientY < h / 2 ? "top" : "bottom";
      }
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      if (x < rect.width / 4) return "left";
      if (x > (rect.width * 3) / 4) return "right";
      return y < rect.height / 2 ? "top" : "bottom";
    };
    const move = (ev: MouseEvent) => setDragHint(pick(ev));
    const up = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      setDragging(false);
      setDragHint(null);
      api.setDockSide(pick(ev));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  /**
   * Edge handle drag adjusted to the docking side:
   * left -> right edge (width), right -> left edge (width),
   * top -> bottom edge (height), bottom -> top edge (height).
   */
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const side = api.getDockSide();
    const horizontal = side === "left" || side === "right";
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widthRef.current;
    const startHeight = heightRef.current;
    const clamp = (v: number) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, v));
    const move = (ev: MouseEvent) => {
      if (horizontal) {
        // left: dragging right grows; right: dragging left grows
        const delta = side === "left" ? ev.clientX - startX : startX - ev.clientX;
        setWidth(clamp(startWidth + delta));
      } else {
        // top: dragging down grows; bottom: dragging up grows
        const delta = side === "top" ? ev.clientY - startY : startY - ev.clientY;
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

  // Border only on the edge facing the chat area (the separator side)
  const borderStyle: React.CSSProperties = horizontal
    ? {
        borderRight: side === "left" ? "1px solid var(--border)" : "none",
        borderLeft: side === "right" ? "1px solid var(--border)" : "none",
      }
    : {
        borderBottom: side === "top" ? "1px solid var(--border)" : "none",
        borderTop: side === "bottom" ? "1px solid var(--border)" : "none",
      };

  // Sidebar-style resize bar on the edge facing the chat area (5px, hover-highlighted)
  const handleStyle: React.CSSProperties = horizontal
    ? {
        position: "absolute", top: 0, bottom: 0,
        left: side === "right" ? 0 : undefined,
        right: side === "left" ? 0 : undefined,
        width: 5, cursor: "col-resize", zIndex: 20,
      }
    : {
        position: "absolute", left: 0, right: 0,
        top: side === "bottom" ? 0 : undefined,
        bottom: side === "top" ? 0 : undefined,
        height: 5, cursor: "row-resize", zIndex: 20,
      };

  /** The chat-area rect used to clip the drop hints while dragging. */
  const chatAreaRect = dragging ? chatAreaRef.current : null;

  return (
    <>
      <div
        ref={panelRef}
        style={{
          width,
          height,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          background: "var(--bg-panel)",
          ...borderStyle,
          position: "relative",
        }}
      >
        {/* Title bar: the grip button on the left starts the docking drag */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 4, height: 30,
            padding: "0 8px", flexShrink: 0, borderBottom: "1px solid var(--border)",
            fontSize: 12, fontWeight: 700, color: "var(--text)",
            userSelect: "none", background: "var(--bg-panel)",
          }}
        >
          <button
            type="button"
            onMouseDown={startHeaderDrag}
            title="拖拽移动停靠位置（上/下/左/右）"
            aria-label="拖拽移动停靠位置"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 22, height: 22, padding: 0, border: "none", borderRadius: 5,
              background: "transparent", color: "var(--text-dim)",
              cursor: dragging ? "grabbing" : "grab", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-dim)"; }}
          >
            <GripIcon />
          </button>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            {title}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => (window.robopi as unknown as { setDockOpen?: (v: boolean) => void })?.setDockOpen?.(false)}
            aria-label="关闭工作台"
            title="关闭工作台"
            style={{
              border: "none", background: "none", cursor: "pointer", color: "var(--text-dim)",
              fontSize: 14, padding: "2px 6px", borderRadius: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {children}
        </div>

        {/* Size handle on the edge facing the chat area (side-dependent) */}
        <div
          onMouseDown={startResize}
          onMouseEnter={() => setHandleHover(true)}
          onMouseLeave={() => setHandleHover(false)}
          role="separator"
          aria-orientation={horizontal ? "vertical" : "horizontal"}
          title="拖拽调整大小"
          style={{
            ...handleStyle,
            background: resizing
              ? "var(--accent)"
              : handleHover
                ? "color-mix(in srgb, var(--accent) 22%, transparent)"
                : "transparent",
            transition: "background 0.1s ease",
          }}
        />
      </div>

      {/* Drop hints, clipped to the chat area while dragging the title bar */}
      {dragging && chatAreaRect && (
        <div
          style={{
            position: "fixed",
            left: chatAreaRect.left,
            top: chatAreaRect.top,
            width: chatAreaRect.width,
            height: chatAreaRect.height,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <DropZone side="top" hint={dragHint} />
          <DropZone side="left" hint={dragHint} />
          <DropZone side="right" hint={dragHint} />
          <DropZone side="bottom" hint={dragHint} />
        </div>
      )}
    </>
  );
}
