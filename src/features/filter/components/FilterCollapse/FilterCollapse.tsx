import { Collapse, type CollapseItem } from "@/components/ui/collapse";
import FilterCollapseContent from "@/features/filter/components/FilterCollapse/FilterCollapseContent";
import FilterCollapseLeaf from "@/features/filter/components/FilterCollapse/FilterCollapseLeaf";
import type {
  Filter,
  FilterValue,
} from "@/features/filter/services/filterService";
import type { DropResult } from "@hello-pangea/dnd";
import { useCallback, useMemo, useState } from "react";

interface FilterCollapseProps {
  items: Array<Filter>;
  onChange?: (updatedItems: Array<Filter>, changedItems: Array<Filter>) => void;
  onAddValues: (filter: Filter) => void;
  onRemove: (filter: Filter) => void;
}

export default function FilterCollapse(props: FilterCollapseProps) {
  const { items, onChange, onAddValues, onRemove } = props;
  const [openKeys, setOpenKeys] = useState<Set<number | string>>(new Set());

  const collapseItems = useMemo(() => {
    const result: Array<CollapseItem<Filter>> = [];

    items.forEach((item) => {
      // 1뎁스: 필터 아이템
      result.push({
        id: item.id,
        parentId: null,
        order: item.sortOrder,
        data: item,
      });

      // 2뎁스: values
      if (item.values && item.values.length > 0) {
        item.values.forEach((value) => {
          result.push({
            id: value.id,
            parentId: item.id,
            order: value.sortOrder,
            data: {
              ...item,
              values: item.values,
            },
          });
        });
      }
    });

    return result;
  }, [items]);

  const handleChange = useCallback(
    (filter: Filter) => {
      const updatedItems = items.map((item) =>
        item.id === filter.id ? filter : item
      );
      onChange?.(updatedItems, [filter]);
    },
    [items, onChange]
  );

  const handleChangeLeaf = useCallback(
    (filter: Filter) => {
      const updatedItems = items.map((item) =>
        item.id === filter.id ? filter : item
      );
      onChange?.(updatedItems, [filter]);
    },
    [items, onChange]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const extractDraggableItemId = (id: string) => {
        const depthMatch = id.match(/^draggable-\d+-(.+)$/);
        if (depthMatch) return depthMatch[1];

        const match = id.match(/^draggable-(.+)$/);
        return match ? match[1] : id;
      };

      const extractDroppableParentId = (id: string) => {
        const match = id.match(/^droppable-(.+)$/);
        return match ? match[1] : id;
      };

      const draggedId = extractDraggableItemId(draggableId);
      const sourceParentIdRaw = extractDroppableParentId(source.droppableId);
      const destParentIdRaw = extractDroppableParentId(destination.droppableId);

      const sourceParentId =
        sourceParentIdRaw === "root" ? null : sourceParentIdRaw;
      const destParentId = destParentIdRaw === "root" ? null : destParentIdRaw;

      // case 1) 루트(필터 리스트) 재정렬
      if (destParentId === null) {
        const siblings = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
        const newSiblings = Array.from(siblings);

        const [removed] = newSiblings.splice(source.index, 1);
        newSiblings.splice(destination.index, 0, removed);

        const changedFilters: Array<Filter> = [];
        const updatedSiblings = newSiblings.map((item, index) => {
          if (item.sortOrder !== index || item.id.toString() === draggedId) {
            const updated: Filter = { ...item, sortOrder: index };
            changedFilters.push(updated);
            return updated;
          }
          return item;
        });

        const updatedAllItems = items.map((item) => {
          const updatedSibling = updatedSiblings.find(
            (s) => s.id.toString() === item.id.toString()
          );
          return updatedSibling || item;
        });

        onChange?.(updatedAllItems, changedFilters);
        return;
      }

      // case 2) 특정 필터(values) 재정렬
      if (sourceParentId !== destParentId) {
        // 현재 Collapse 구현상 이동 불가지만 안전장치로 종료
        return;
      }

      const parentFilter = items.find(
        (item) => item.id.toString() === destParentId.toString()
      );
      if (!parentFilter) return;

      const siblings = [...(parentFilter.values ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );

      const newSiblings = Array.from(siblings);
      const [removed] = newSiblings.splice(source.index, 1);
      newSiblings.splice(destination.index, 0, removed);

      const updatedValues: Array<FilterValue> = newSiblings.map(
        (value, index) =>
          value.sortOrder !== index || value.id.toString() === draggedId
            ? { ...value, sortOrder: index }
            : value
      );

      const updatedFilter: Filter = { ...parentFilter, values: updatedValues };
      const updatedAllItems = items.map((item) =>
        item.id.toString() === updatedFilter.id.toString()
          ? updatedFilter
          : item
      );

      onChange?.(updatedAllItems, [updatedFilter]);
    },
    [items, onChange]
  );

  const handleRemove = useCallback(
    (filter: Filter) => {
      onRemove(filter);
    },
    [onRemove]
  );

  const handleRemoveLeaf = useCallback(
    (parentId: number | string, filterValue: FilterValue) => {
      const targetFilter = items.find((v) => v.id === parentId);
      if (!targetFilter) {
        return;
      }
      const newValues = targetFilter?.values.filter(
        (v) => v.id !== filterValue.id
      );
      const newFilter: Filter = {
        ...targetFilter,
        values: newValues ?? [],
      };
      handleChange(newFilter);
    },
    [handleChange, items]
  );
  return (
    <Collapse
      draggable
      items={collapseItems}
      openKeys={openKeys}
      maxDepth={2}
      onDragEnd={handleDragEnd}
      onOpenKeysChange={setOpenKeys}
      renderItem={(props, api) => (
        <FilterCollapseContent
          {...props}
          api={api}
          onChange={handleChange}
          onAddValues={onAddValues}
          onRemove={handleRemove}
        />
      )}
      renderLeafItem={(props, api) => (
        <FilterCollapseLeaf
          {...props}
          api={api}
          onChange={handleChangeLeaf}
          onRemove={handleRemoveLeaf}
        />
      )}
    />
  );
}
