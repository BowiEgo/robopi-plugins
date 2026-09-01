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
const DEFAULT_SIZE = 300;
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
  const [isResizing, setIsResizing] = useState(false);
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
   * Pointer-based resize (mirrors the host useResizablePanel approach):
   * pointer capture on the separator, body cursor/userSelect management,
   * keyboard support, cleanup on blur/visibility change.
   */
  const clampSize = (v: number) => Math.min(MAX_SIZE, Math.max(MIN_SIZE, v));
  const dragRef = useRef<{
    pointerId: number; startX: number; startY: number;
    startWidth: number; startHeight: number;
  } | null>(null);

  const finishResize = (pointerId: number) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointerId) return;
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setIsResizing(false);
    // width/height are persisted by the effects above
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: widthRef.current,
      startHeight: heightRef.current,
    };
    document.body.style.cursor = horizontal ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    setIsResizing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.pointerType === "mouse" && e.buttons === 0) {
      finishResize(e.pointerId);
      return;
    }
    e.preventDefault();
    if (horizontal) {
      // left: dragging right grows; right: dragging left grows
      const dir = side === "left" ? 1 : -1;
      setWidth(clampSize(drag.startWidth + (e.clientX - drag.startX) * dir));
    } else {
      // top: dragging down grows; bottom: dragging up grows
      const dir = side === "top" ? 1 : -1;
      setHeight(clampSize(drag.startHeight + (e.clientY - drag.startY) * dir));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => finishResize(e.pointerId);
  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => finishResize(e.pointerId);
  const onLostPointerCapture = (e: React.PointerEvent<HTMLDivElement>) => finishResize(e.pointerId);

  // Cancel on blur / tab hidden, like the host resizer
  useEffect(() => {
    if (!isResizing) return;
    const cancel = () => {
      const drag = dragRef.current;
      if (drag) finishResize(drag.pointerId);
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, [isResizing, finishResize]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (dragRef.current) {
        dragRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 12;
    const growKey = horizontal ? (side === "left" ? "ArrowRight" : "ArrowLeft") : (side === "top" ? "ArrowDown" : "ArrowUp");
    const shrinkKey = horizontal ? (side === "left" ? "ArrowLeft" : "ArrowRight") : (side === "top" ? "ArrowUp" : "ArrowDown");
    if (e.key === growKey) {
      e.preventDefault();
      horizontal ? setWidth(clampSize(widthRef.current + step)) : setHeight(clampSize(heightRef.current + step));
    } else if (e.key === shrinkKey) {
      e.preventDefault();
      horizontal ? setWidth(clampSize(widthRef.current - step)) : setHeight(clampSize(heightRef.current - step));
    } else if (e.key === "Home") {
      e.preventDefault();
      horizontal ? setWidth(MIN_SIZE) : setHeight(MIN_SIZE);
    } else if (e.key === "End") {
      e.preventDefault();
      horizontal ? setWidth(MAX_SIZE) : setHeight(MAX_SIZE);
    }
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

  // 12px hot zone on the edge facing the chat area (host sidebar style)
  const handleStyle: React.CSSProperties = horizontal
    ? {
        position: "absolute", top: 0, bottom: 0,
        left: side === "right" ? 0 : undefined,
        right: side === "left" ? 0 : undefined,
        width: 12, cursor: "col-resize", zIndex: 20,
      }
    : {
        position: "absolute", left: 0, right: 0,
        top: side === "bottom" ? 0 : undefined,
        bottom: side === "top" ? 0 : undefined,
        height: 12, cursor: "row-resize", zIndex: 20,
      };

  /** The chat-area rect used to clip the drop hints while dragging. */
  const chatAreaRect = dragging ? chatAreaRef.current : null;

  return (
    <>
      <div
        ref={panelRef}
        style={{
          ...(horizontal ? { width, height: "100%" } : { width: "100%", height }),
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

        {/* Size handle: 12px hot zone + 2px visual line (host sidebar style) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onLostPointerCapture}
          onKeyDown={onKeyDown}
          onDoubleClick={() => {
            horizontal ? setWidth(DEFAULT_SIZE) : setHeight(DEFAULT_SIZE);
          }}
          onMouseEnter={() => setHandleHover(true)}
          onMouseLeave={() => setHandleHover(false)}
          role="separator"
          aria-orientation={horizontal ? "vertical" : "horizontal"}
          aria-valuemin={MIN_SIZE}
          aria-valuemax={MAX_SIZE}
          aria-valuenow={horizontal ? width : height}
          tabIndex={0}
          title="拖拽调整大小（双击还原）"
          style={{
            ...handleStyle,
            outline: "none",
            touchAction: "none",
          }}
        >
          {/* 2px visual line aligned with the panel border (sidebar-resizer look:
              transparent by default, highlighted on hover/drag) */}
          <div
            style={{
              position: "absolute",
              ...(horizontal
                ? { top: 0, bottom: 0, width: 2, ...(side === "left" ? { right: 0 } : { left: 0 }) }
                : { left: 0, right: 0, height: 2, ...(side === "top" ? { bottom: 0 } : { top: 0 }) }),
              background: isResizing || handleHover
                ? "color-mix(in srgb, var(--text-muted) 70%, var(--border))"
                : "transparent",
              pointerEvents: "none",
              transition: "background 0.12s ease",
              borderRadius: 1,
            }}
          />
        </div>
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
