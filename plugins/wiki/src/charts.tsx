/// <reference path="../plugin-env.d.ts" />

/**
 * charts.tsx - thin echarts wrapper for the wiki plugin.
 *
 * Uses echarts core with on-demand registration (bar/pie/line/graph +
 * tooltip/legend + canvas renderer). Colors are read from the host CSS
 * variables so charts stay consistent with the pi-web theme.
 */

import * as echarts from "echarts/core";
import { BarChart as EBarChart, GraphChart, LineChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type * as React from "react";

echarts.use([
  EBarChart,
  PieChart,
  LineChart,
  GraphChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
]);

const { useEffect, useRef } = window.React as typeof import("react");

/** Read a CSS variable value (e.g. --accent) from the host theme. */
export function cssVar(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export const CHART_COLORS = {
  accent: cssVar("--accent"),
  border: cssVar("--border"),
  text: cssVar("--text"),
  textMuted: cssVar("--text-muted"),
  textDim: cssVar("--text-dim"),
  bg: cssVar("--bg"),
  green: "#22c55e",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  red: "#ef4444",
  cyan: "#06b6d4",
};

/**
 * Generic echarts component: initializes once, disposes on unmount,
 * updates options on change, observes container resize.
 */
export function EChart({
  option,
  height = 180,
  style,
}: {
  option: echarts.EChartsCoreOption;
  height?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = echarts.init(el);
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(el);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height, ...style }} />;
}

/** Common tooltip style bound to host CSS variables. */
export const TOOLTIP = {
  backgroundColor: cssVar("--bg-panel"),
  borderColor: cssVar("--border"),
  textStyle: { color: cssVar("--text"), fontSize: 11 },
} as const;
