import { cn } from "@/lib/utils";
import { DragDropContext, type DragDropContextProps } from "@hello-pangea/dnd";
import { useCallback, useMemo, useState } from "react";
import { InternalCollapseList } from "./InternalCollapseList";
import { type CollapseAPI, type CollapseItem } from "./types";
export interface CollapseProps<T = unknown>
  extends Omit<DragDropContextProps, "onDragEnd" | "children"> {
  items: Array<CollapseItem<T>>;
  draggable?: boolean;
  maxDepth?: number;
  defaultOpenKeys?: Array<number | string>;
  openKeys?: Set<number | string>;
  onOpenKeysChange?: (openKeys: Set<number | string>) => void;
  onItemClick?: (item: CollapseItem<T>, depth: number) => void;
  className?: string;
  renderItem?: (
    props: {
      item: CollapseItem<T>;
      depth: number;
      isOpen: boolean;
      hasChildren: boolean;
    },
    api: CollapseAPI
  ) => React.ReactNode;
  renderLeafItem?: (
    props: {
      item: CollapseItem<T>;
      depth: number;
    },
    api: CollapseAPI
  ) => React.ReactNode;
  onDragEnd?: DragDropContextProps["onDragEnd"];
}

export function Collapse<T = unknown>(props: CollapseProps<T>) {
  const {
    items,
    maxDepth,
    defaultOpenKeys = [],
    openKeys: controlledOpenKeys,
    onOpenKeysChange,
    onItemClick,
    className,
    renderItem,
    renderLeafItem,
    onDragEnd = () => {},
    draggable = false,
    ...rest
  } = props;

  // 비제어 컴포넌트 모드의 내부 state
  const [internalOpenKeys, setInternalOpenKeys] = useState<
    Set<number | string>
  >(new Set(defaultOpenKeys));

  // 제어/비제어 모드 선택
  const isControlled = controlledOpenKeys !== undefined;
  const openKeys = isControlled ? controlledOpenKeys : internalOpenKeys;

  const onToggle = useCallback(
    (id: number | string) => {
      const nextOpenKeys = new Set(openKeys);
      if (nextOpenKeys.has(id)) {
        nextOpenKeys.delete(id);
      } else {
        nextOpenKeys.add(id);
      }

      if (isControlled) {
        onOpenKeysChange?.(nextOpenKeys);
      } else {
        setInternalOpenKeys(nextOpenKeys);
      }
    },
    [isControlled, openKeys, onOpenKeysChange]
  );

  const onOpen = useCallback(
    (id: number | string) => {
      const nextOpenKeys = new Set(openKeys).add(id);

      if (isControlled) {
        onOpenKeysChange?.(nextOpenKeys);
      } else {
        setInternalOpenKeys(nextOpenKeys);
      }
    },
    [isControlled, openKeys, onOpenKeysChange]
  );

  const onClose = useCallback(
    (id: number | string) => {
      const nextOpenKeys = new Set(openKeys);
      nextOpenKeys.delete(id);

      if (isControlled) {
        onOpenKeysChange?.(nextOpenKeys);
      } else {
        setInternalOpenKeys(nextOpenKeys);
      }
    },
    [isControlled, openKeys, onOpenKeysChange]
  );

  const api: CollapseAPI = useMemo(
    () => ({ toggleItem: onToggle, openItem: onOpen, closeItem: onClose }),
    [onClose, onOpen, onToggle]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd} {...rest}>
      <div
        className={cn(
          "bg-card border border-border rounded-lg overflow-hidden shadow-sm",
          className
        )}
      >
        <InternalCollapseList
          parentId={null}
          items={items}
          depth={1}
          maxDepth={maxDepth}
          openKeys={openKeys}
          draggable={draggable}
          onToggle={onToggle}
          api={api}
          onItemClick={onItemClick}
          renderItem={renderItem}
          renderLeafItem={renderLeafItem}
        />
      </div>
    </DragDropContext>
  );
}
