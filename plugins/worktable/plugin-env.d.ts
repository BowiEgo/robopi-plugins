/**
 * 插件开发环境类型声明。
 *
 * 让 TSX 插件获得完整类型：window.robopi 注册 API + window.React + 宿主 CSS 变量。
 * 引用方式：src/index.tsx 顶部 `/// <reference path="../plugin-env.d.ts" />`
 * 或加入 tsconfig include。
 */

import type { ComponentType, ReactNode } from "react";

/** 位置级插槽 */
export type PluginSlotName =
  | "navrail"
  | "sidebar-bottom"
  | "tabbar-right"
  | "chat-toolbar"
  | "settings-section";

/** 可覆盖的宿主组件 */
export type OverridableComponentName =
  | "ChatInput"
  | "MessageView"
  | "MarkdownBody"
  | "SessionSidebar"
  | "FileExplorer"
  | "FileViewer"
  | "SettingsPanel"
  | "TabBar"
  | "ModelSelector"
  | "ExtensionStatusBar"
  | "BranchNavigator"
  | "AppShell";

/** 宿主 API 桥 */
export interface PluginApi {
  getStatus(): Promise<unknown>;
  listSessions(): Promise<{ sessions?: Array<{ id: string; cwd?: string }> }>;
  openSession(sessionId: string): void;
  /** 工作台项注册表（worktable 容器插件读取） */
  getWorktableItems(): WorktableItem[];
}

/** 工作台项（worktable 插件渲染的列表项） */
export interface WorktableItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  component?: ComponentType<{ api: PluginApi }>;
}

/** 插件渲染函数签名（与 window.robopi 一致） */
export type SlotRenderer = (api: PluginApi) => ReactNode;
export type ComponentFactory = () => ComponentType<never> | Promise<ComponentType<never>>;
export type MessageRenderer = (message: unknown, api: PluginApi) => ReactNode;

declare global {
  interface Window {
    robopi?: {
      registerSlot(slot: PluginSlotName, renderer: SlotRenderer): void;
      registerComponent(name: OverridableComponentName, factory: ComponentFactory): void;
      registerMessageRenderer(customType: string, renderer: MessageRenderer): void;
      registerWorktableItem(item: WorktableItem): void;
    };
    React?: typeof import("react");
  }

  // React 19 移除了全局 JSX 命名空间；从 React.JSX 重导出（classic 模式编译需要）
  namespace JSX {
    type Element = import("react").JSX.Element;
    type ElementType = import("react").JSX.ElementType;
    type IntrinsicElements = import("react").JSX.IntrinsicElements;
    type ElementAttributesProperty = import("react").JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = import("react").JSX.ElementChildrenAttribute;
    type LibraryManagedAttributes<C, P> = import("react").JSX.LibraryManagedAttributes<C, P>;
    type IntrinsicAttributes = import("react").JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = import("react").JSX.IntrinsicClassAttributes<T>;
  }
}
