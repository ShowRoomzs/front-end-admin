import { cn } from "@/lib/utils";
import { Droppable } from "@hello-pangea/dnd";
import { useMemo } from "react";
import { InternalCollapseItem } from "./InternalCollapseItem";
import { type InternalCollapseSharedProps } from "./types";

interface InternalCollapseListProps<
  T = unknown,
> extends InternalCollapseSharedProps<T> {
  parentId: number | string | null;
  depth: number;
}

export function InternalCollapseList<T = unknown>(
  props: InternalCollapseListProps<T>
) {
  const { parentId, items, depth, ...rest } = props;

  const siblings = useMemo(
    () =>
      items
        .filter(
          (item) =>
            (item.parentId === null ? null : item.parentId.toString()) ===
            (parentId === null ? null : parentId.toString())
        )
        .sort((a, b) => a.order - b.order),
    [items, parentId]
  );

  const droppableId = parentId?.toString() ?? "root";

  const getDepthBg = (d: number) => {
    if (d <= 1) return "";
    if (d === 2) return "bg-muted/30 dark:bg-muted/20";
    if (d === 3) return "bg-muted/50 dark:bg-muted/40";
    return "bg-muted/70 dark:bg-muted/60";
  };

  return (
    <Droppable
      droppableId={`droppable-${droppableId}`}
      type={`droppable-${droppableId}`}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "flex flex-col min-h-[10px]",
            depth > 1 && "ml-6 my-1",
            getDepthBg(depth)
          )}
        >
          {siblings.map((item, index) => (
            <InternalCollapseItem
              key={`${depth}-${item.id}`}
              item={item}
              index={index}
              items={items}
              depth={depth}
              {...rest}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
