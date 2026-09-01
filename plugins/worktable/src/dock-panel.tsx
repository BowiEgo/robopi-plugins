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
  const panelRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  widthRef.current = width;
  heightRef.current = height;

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
   * Title-bar drag: pick a docking side from the pointer position
   * (left/right thirds on x, otherwise top/bottom on y), show the drop
   * hint clipped to the chat area, commit on release.
   */
  const startHeaderDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const pick = (ev: MouseEvent): DockSide => {
      const { innerWidth: w, innerHeight: h } = window;
      if (ev.clientX < w / 4) return "left";
      if (ev.clientX > (3 * w) / 4) return "right";
      return ev.clientY < h / 2 ? "top" : "bottom";
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

  /** Corner handle drag: width for left/right docks, height for top/bottom. */
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = widthRef.current;
    const startHeight = heightRef.current;
    const move = (ev: MouseEvent) => {
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

  /** The dock layout container (chat area) - the drop hints are clipped to it. */
  const chatAreaRect = dragging && panelRef.current
    ? panelRef.current.parentElement?.parentElement?.getBoundingClientRect()
    : undefined;

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
          borderRight: "1px solid var(--border)",
          borderLeft: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          position: "relative",
        }}
      >
        {/* Title bar: drag to re-dock */}
        <div
          onMouseDown={startHeaderDrag}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 30,
            padding: "0 10px", flexShrink: 0, borderBottom: "1px solid var(--border)",
            fontSize: 12, fontWeight: 700, color: "var(--text)",
            cursor: dragging ? "grabbing" : "grab", userSelect: "none",
            background: "var(--bg-panel)",
          }}
          title="拖拽标题栏切换停靠位置（上/下/左/右）"
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            {title}
          </span>
          <button
            type="button"
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
      </div>

      {/* Size handle (bottom-right corner) */}
      <div
        onMouseDown={startResize}
        role="separator"
        aria-orientation="horizontal"
        title="拖拽调整大小"
        style={{
          width: 12, height: 12, flexShrink: 0, cursor: "nwse-resize",
          position: "relative", background: resizing ? "var(--accent)" : "transparent",
          marginTop: -12, marginRight: -12, alignSelf: "flex-end", zIndex: 10,
          transition: "background 0.1s ease",
        }}
      />

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
