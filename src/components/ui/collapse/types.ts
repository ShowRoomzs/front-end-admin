import { type ReactNode } from "react";

export interface CollapseAPI {
  toggleItem: (id: number | string) => void;
  openItem: (id: number | string) => void;
  closeItem: (id: number | string) => void;
}

export interface CollapseItem<T = unknown> {
  id: number | string;
  parentId: number | string | null;
  order: number;
  data?: T;
  label?: ReactNode;
}

export interface RenderItemProps<T = unknown> {
  item: CollapseItem<T>;
  depth: number;
  isOpen: boolean;
  hasChildren: boolean;
}

export interface InternalCollapseSharedProps<T = unknown> {
  items: Array<CollapseItem<T>>;
  maxDepth?: number;
  openKeys: Set<number | string>;
  draggable: boolean;
  onToggle: (id: number | string) => void;
  api: CollapseAPI;
  onItemClick?: (item: CollapseItem<T>, depth: number) => void;
  renderItem?: (props: RenderItemProps<T>, api: CollapseAPI) => ReactNode;
  renderLeafItem?: (
    props: {
      item: CollapseItem<T>;
      depth: number;
    },
    api: CollapseAPI
  ) => ReactNode;
}
