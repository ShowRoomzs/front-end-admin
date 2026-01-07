import { cn } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { ChevronIcon } from "./ChevronIcon";
import { InternalCollapseList } from "./InternalCollapseList";
import { type CollapseItem, type InternalCollapseSharedProps } from "./types";
import DragHandle from "@/components/ui/collapse/DragHandle";

interface InternalCollapseItemProps<T = unknown>
  extends InternalCollapseSharedProps<T> {
  item: CollapseItem<T>;
  index: number;
  depth: number;
}

export function InternalCollapseItem<T = unknown>(
  props: InternalCollapseItemProps<T>
) {
  const {
    item,
    index,
    items,
    depth,
    maxDepth,
    openKeys,
    draggable,
    onToggle,
    api,
    onItemClick,
    renderItem,
    renderLeafItem,
  } = props;

  const isOpen = openKeys.has(item.id);
  const children = items.filter(
    (i) => i.parentId?.toString() === item.id.toString()
  );

  const hasChildren = children.length > 0;

  // 현재 아이템이 마지막 깊이(maxDepth)인지 확인
  const isAtMaxDepth = maxDepth !== undefined && depth >= maxDepth;

  // 1. 자식이 없거나
  // 2. 이미 maxDepth에 도달한 아이템은 Leaf로 간주
  const isLeaf = !hasChildren || isAtMaxDepth;

  // 다음 단계가 maxDepth인지 확인 (즉, 현재 아이템의 자식들이 Leaf List로 렌더링되어야 하는지)
  const isNextLevelLeafList = maxDepth !== undefined && depth === maxDepth - 1;

  const handleClick = () => {
    if (isLeaf) {
      onItemClick?.(item, depth);
    } else {
      onToggle(item.id);
    }
  };

  return (
    <Draggable draggableId={`draggable-${item.id.toString()}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="border-b border-border last:border-b-0 bg-card"
        >
          <div
            onClick={handleClick}
            className={cn(
              "w-full flex items-center gap-2 py-3 text-left cursor-pointer",
              "hover:bg-accent/80 hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              depth === 1 && "px-4",
              depth > 1 && "pr-4"
            )}
            style={{
              paddingLeft: depth === 1 ? undefined : `${(depth - 1) * 1.5}rem`,
            }}
          >
            {draggable && (
              <DragHandle dragHandleProps={provided.dragHandleProps} />
            )}
            {renderItem ? (
              renderItem({ item, depth, isOpen, hasChildren: !isLeaf }, api)
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {item.label ?? item.id}
                </span>
                {!isLeaf && <ChevronIcon isOpen={isOpen} />}
              </div>
            )}
          </div>

          {isOpen &&
            hasChildren &&
            !isAtMaxDepth &&
            (isNextLevelLeafList ? (
              <Droppable
                droppableId={`droppable-${item.id.toString()}`}
                type={`droppable-${item.id.toString()}`}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-muted/20 dark:bg-muted/5 divide-y divide-border ml-4 min-h-[10px]"
                  >
                    {children
                      .sort((a, b) => a.order - b.order)
                      .map((child, childIndex) => (
                        <Draggable
                          key={child.id.toString()}
                          draggableId={`draggable-${child.id.toString()}`}
                          index={childIndex}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center py-2.5 px-4 text-sm cursor-pointer hover:bg-accent/60 bg-card"
                              style={{
                                ...provided.draggableProps.style,
                                paddingLeft: `${depth * 1.5}rem`,
                              }}
                              onClick={() => onItemClick?.(child, depth + 1)}
                            >
                              {draggable && (
                                <DragHandle
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              )}
                              {renderLeafItem ? (
                                renderLeafItem(
                                  { item: child, depth: depth + 1 },
                                  api
                                )
                              ) : (
                                <span>{child.label ?? child.id}</span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <InternalCollapseList
                parentId={item.id}
                items={items}
                depth={depth + 1}
                maxDepth={maxDepth}
                openKeys={openKeys}
                draggable={draggable}
                onToggle={onToggle}
                api={api}
                onItemClick={onItemClick}
                renderItem={renderItem}
                renderLeafItem={renderLeafItem}
              />
            ))}
        </div>
      )}
    </Draggable>
  );
}
