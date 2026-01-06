import { cn } from "@/lib/utils";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DragDropContextProps,
} from "@hello-pangea/dnd";
import { useCallback, useMemo, useState, type ReactNode } from "react";
export interface CollapseAPI {
  toggleItem: (id: number) => void;
}
interface CollapseItem<T = unknown> {
  id: number;
  parentId: number | null;
  order: number;
  data?: T;
}
interface RenderItemProps<T = unknown> {
  item: CollapseItem<T>;
  depth: number;
  isOpen: boolean;
  hasChildren: boolean;
}
interface CollapseProps<T = unknown>
  extends Omit<DragDropContextProps, "onDragEnd" | "children"> {
  items: Array<CollapseItem<T>>;
  draggable?: boolean;
  maxDepth?: number;
  defaultOpenKeys?: number[];
  onItemClick?: (item: CollapseItem<T>, depth: number) => void;
  className?: string;
  renderItem?: (props: RenderItemProps<T>, api: CollapseAPI) => ReactNode;
  renderLeafItem?: (item: CollapseItem<T>, depth: number) => ReactNode;
  onDragEnd?: DragDropContextProps["onDragEnd"];
}

interface ItemNode<T = unknown> {
  id: number;
  parentId: number | null;
  depth: number;
  order: number;
  item: CollapseItem<T>;
  childrenIds: number[];
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={cn(
        "w-4 h-4 transition-transform duration-200",
        isOpen ? "rotate-0" : "-rotate-90"
      )}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function buildItemMap<T = unknown>(
  items: Array<CollapseItem<T>>
): Map<number, ItemNode<T>> {
  const itemMap = new Map<number, ItemNode<T>>();
  const childrenMap = new Map<number | null, number[]>();

  items.forEach((item) => {
    if (!childrenMap.has(item.parentId)) {
      childrenMap.set(item.parentId, []);
    }
    childrenMap.get(item.parentId)!.push(item.id);
  });

  childrenMap.forEach((children) => {
    children.sort((a, b) => {
      const itemA = items.find((i) => i.id === a);
      const itemB = items.find((i) => i.id === b);
      return (itemA?.order || 0) - (itemB?.order || 0);
    });
  });

  const calculateDepth = (parentId: number | null): number => {
    if (parentId === null) return 0;
    const parent = items.find((item) => item.id === parentId);
    if (!parent) return 0;
    return calculateDepth(parent.parentId) + 1;
  };

  items.forEach((item) => {
    itemMap.set(item.id, {
      id: item.id,
      parentId: item.parentId,
      depth: calculateDepth(item.parentId),
      order: item.order,
      item,
      childrenIds: childrenMap.get(item.id) || [],
    });
  });

  return itemMap;
}

function getVisibleItems<T = unknown>(
  itemMap: Map<number, ItemNode<T>>,
  openKeys: Set<number>,
  maxDepth?: number
): Array<ItemNode<T>> {
  const result: Array<ItemNode<T>> = [];
  const rootItems = Array.from(itemMap.values())
    .filter((node) => node.parentId === null)
    .sort((a, b) => a.order - b.order);

  const traverse = (nodes: Array<ItemNode<T>>) => {
    for (const node of nodes) {
      result.push(node);

      const isMaxDepth = maxDepth !== undefined && node.depth >= maxDepth;
      const hasChildren = node.childrenIds.length > 0;

      if (!isMaxDepth && hasChildren && openKeys.has(node.id)) {
        const children = node.childrenIds
          .map((childId) => itemMap.get(childId))
          .filter((child): child is ItemNode<T> => child !== undefined)
          .sort((a, b) => a.order - b.order);
        traverse(children);
      }
    }
  };

  traverse(rootItems);
  return result;
}

interface CollapseItemRowProps<T = unknown> {
  node: ItemNode<T>;
  index: number;
  isOpen: boolean;
  maxDepth?: number;
  draggable?: boolean;
  itemMap: Map<number, ItemNode<T>>;
  onToggle: () => void;
  onItemClick?: (item: CollapseItem<T>, depth: number) => void;
  renderItem?: (props: RenderItemProps<T>, api: CollapseAPI) => ReactNode;
  renderLeafItem?: (item: CollapseItem<T>, depth: number) => ReactNode;
  api: CollapseAPI;
}

function CollapseItemRow<T = unknown>(props: CollapseItemRowProps<T>) {
  const {
    node,
    index,
    isOpen,
    maxDepth,
    draggable = false,
    itemMap,
    onToggle,
    onItemClick,
    renderItem,
    renderLeafItem,
    api,
  } = props;

  const { item, depth, childrenIds } = node;
  const hasChildren = childrenIds.length > 0;
  const isMaxDepth = maxDepth !== undefined && depth >= maxDepth;
  const isLeaf = !hasChildren || isMaxDepth;

  const paddingLeft = `${depth * 1.5}rem`;

  const handleClick = () => {
    if (isLeaf) {
      onItemClick?.(item, depth);
    } else {
      onToggle();
    }
  };

  const leafChildren =
    isMaxDepth && hasChildren && isOpen
      ? childrenIds
          .map((childId) => itemMap.get(childId))
          .filter((child): child is ItemNode<T> => child !== undefined)
          .sort((a, b) => a.order - b.order)
      : [];

  return (
    <Draggable draggableId={item.id.toString()} index={index}>
      {(provided) => (
        <>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="border-b border-border last:border-b-0"
          >
            <div
              onClick={handleClick}
              className={cn(
                "w-full flex items-center gap-2 py-3 text-left transition-all duration-200 cursor-pointer",
                "hover:bg-accent/80 hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                depth === 0 && "px-4",
                depth > 0 && "pr-4"
              )}
              style={{ paddingLeft: depth === 0 ? undefined : paddingLeft }}
            >
              {draggable && (
                <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>
              )}
              {renderItem ? (
                renderItem({ item, depth, isOpen, hasChildren: !isLeaf }, api)
              ) : (
                <>
                  {!isLeaf && (
                    <span className="ml-2 shrink-0 text-muted-foreground">
                      <ChevronIcon isOpen={isOpen} />
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {leafChildren.length > 0 && (
            <div className="bg-muted/20 dark:bg-muted/5">
              <div className="divide-y divide-border">
                {leafChildren.map((childNode) => (
                  <div
                    key={childNode.id}
                    className={cn(
                      "py-2.5 text-sm transition-all duration-200 cursor-pointer",
                      "hover:bg-accent/60 hover:text-accent-foreground"
                    )}
                    style={{ paddingLeft: `${(depth + 1) * 1.5}rem` }}
                    onClick={() => onItemClick?.(childNode.item, depth + 1)}
                  >
                    {renderLeafItem ? (
                      renderLeafItem(childNode.item, depth + 1)
                    ) : (
                      <span className="text-muted-foreground hover:text-foreground transition-colors">
                        {childNode.item.id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Draggable>
  );
}

function Collapse<T = unknown>(props: CollapseProps<T>) {
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
  } = props;

  const [openKeys, setOpenKeys] = useState<Set<number>>(
    new Set(defaultOpenKeys)
  );

  const itemMap = useMemo(() => buildItemMap(items), [items]);
  const visibleItems = useMemo(
    () => getVisibleItems(itemMap, openKeys, maxDepth),
    [itemMap, openKeys, maxDepth]
  );

  const toggleItem = useCallback((id: number) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const api: CollapseAPI = useMemo(() => ({ toggleItem }), [toggleItem]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="collapse">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "bg-card border border-border rounded-lg overflow-hidden shadow-sm",
              className
            )}
          >
            {visibleItems.map((node, index) => (
              <CollapseItemRow
                key={node.id}
                node={node}
                index={index}
                isOpen={openKeys.has(node.id)}
                maxDepth={maxDepth}
                draggable={draggable}
                itemMap={itemMap}
                onToggle={() => toggleItem(node.id)}
                api={api}
                onItemClick={onItemClick}
                renderItem={renderItem}
                renderLeafItem={renderLeafItem}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export { Collapse, ChevronIcon };
export type { CollapseItem, CollapseProps };
