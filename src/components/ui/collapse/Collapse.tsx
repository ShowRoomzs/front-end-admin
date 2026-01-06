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
  defaultOpenKeys?: (number | string)[];
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
  renderLeafItem?: (item: CollapseItem<T>, depth: number) => React.ReactNode;
  onDragEnd?: DragDropContextProps["onDragEnd"];
}

export function Collapse<T = unknown>(props: CollapseProps<T>) {
  const {
    items,
    maxDepth,
    defaultOpenKeys = [],
    onItemClick,
    className,
    renderItem,
    renderLeafItem,
    onDragEnd = () => {},
    draggable = false,
    ...rest
  } = props;

  const [openKeys, setOpenKeys] = useState<Set<number | string>>(
    new Set(defaultOpenKeys)
  );

  const onToggle = useCallback((id: number | string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const api: CollapseAPI = useMemo(
    () => ({ toggleItem: onToggle }),
    [onToggle]
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
