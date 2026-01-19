import { Collapse } from "@/components/ui/collapse";
import CategoryCollapseContent from "@/features/category/components/CategoryCollapse/CategoryCollapseContent";
import { convertCategoriesToCollapseItems } from "@/features/category/components/CategoryCollapse/config";
import type { Category } from "@/features/category/services/categoryService";
import type { DropResult } from "@hello-pangea/dnd";
import { useCallback, useEffect, useMemo, useState } from "react";

interface CategoryCollapseProps {
  items: Array<Category>;
  onChange: (
    updatedItems: Array<Category>,
    changedItems: Array<Category>
  ) => void;
  onRemove: (category: Category) => void;
  onAddChild: (category: Category, depth: number) => void;
  idMapping?: Map<number | string, number | string>;
}

export default function CategoryCollapse(props: CategoryCollapseProps) {
  const { items, onChange, onRemove, onAddChild, idMapping } = props;

  const [openKeys, setOpenKeys] = useState<Set<number | string>>(new Set());

  useEffect(() => {
    if (!idMapping || idMapping.size === 0) return;

    setOpenKeys((prev) => {
      const next = new Set(prev);
      idMapping.forEach((newId) => {
        next.add(newId);
      });
      return next;
    });
  }, [idMapping]);

  const collapseItems = useMemo(
    () => convertCategoriesToCollapseItems(items),
    [items]
  );

  const reorderCategories = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      // 1. ID 및 ParentID 추출 (prefix 제거)
      const extractId = (id: string) =>
        id.replace("draggable-", "").replace("droppable-", "");
      const draggedId = extractId(draggableId);
      const sourceParentId =
        extractId(source.droppableId) === "root"
          ? null
          : extractId(source.droppableId);
      const destParentId =
        extractId(destination.droppableId) === "root"
          ? null
          : extractId(destination.droppableId);

      // 2. 형제 그룹 찾기 및 정렬
      const siblings = items
        .filter(
          (item) =>
            (item.parentId ?? null)?.toString() ===
            (destParentId ?? null)?.toString()
        )
        .sort((a, b) => a.order - b.order);

      // 3. 순서 변경
      const newSiblings = Array.from(siblings);

      // 만약 같은 부모 내 이동이라면
      if (sourceParentId === destParentId) {
        const [removed] = newSiblings.splice(source.index, 1);
        newSiblings.splice(destination.index, 0, removed);
      } else {
        // 다른 부모로 이동하는 경우 (현재 UI 구조상으로는 지원 안할 수도 있지만 로직은 대비)
        const draggedItem = items.find(
          (i) => i.categoryId.toString() === draggedId
        );
        if (draggedItem) {
          const updatedDraggedItem = {
            ...draggedItem,
            parentId: destParentId ? Number(destParentId) : undefined,
          };
          newSiblings.splice(destination.index, 0, updatedDraggedItem);
        }
      }

      // 4. 새로운 order 부여 및 전체 리스트 업데이트
      const changedCategories: Array<Category> = [];
      const updatedSiblings = newSiblings.map((item, index) => {
        if (item.order !== index || item.categoryId.toString() === draggedId) {
          const updated = {
            ...item,
            order: index,
            parentId: destParentId
              ? isNaN(Number(destParentId))
                ? destParentId
                : Number(destParentId)
              : undefined,
          };
          changedCategories.push(updated);
          return updated;
        }
        return item;
      });

      const updatedAllItems = items.map((item) => {
        const updatedSibling = updatedSiblings.find(
          (s) => s.categoryId === item.categoryId
        );
        return updatedSibling || item;
      });

      onChange(updatedAllItems, changedCategories);
    },
    [items, onChange]
  );

  const handleChangeName = useCallback(
    (category: Category) => {
      const updatedCategories = items.map((item) =>
        item.categoryId === category.categoryId ? category : item
      );
      onChange(updatedCategories, [category]);
    },
    [items, onChange]
  );

  const handleAddCategory = useCallback(
    (category: Category, depth: number) => {
      onAddChild(category, depth + 1);
    },
    [onAddChild]
  );

  const handleRemoveCategory = useCallback(
    (category: Category) => {
      // 삭제될 카테고리를 제외한 같은 부모의 형제들을 order 순으로 정렬
      const siblings = items
        .filter(
          (item) =>
            (item.parentId ?? null)?.toString() ===
              (category.parentId ?? null)?.toString() &&
            item.categoryId !== category.categoryId
        )
        .sort((a, b) => a.order - b.order);

      // 정렬된 순서대로 0부터 order 재부여
      const changedCategories: Array<Category> = [];
      const updatedSiblings = siblings.map((item, index) => {
        if (item.order !== index) {
          const updated = { ...item, order: index };
          changedCategories.push(updated);
          return updated;
        }
        return item;
      });

      // 삭제될 카테고리를 제외한 전체 리스트 업데이트
      const updatedAllItems = items
        .filter((item) => item.categoryId !== category.categoryId)
        .map((item) => {
          const updatedSibling = updatedSiblings.find(
            (s) => s.categoryId === item.categoryId
          );
          return updatedSibling || item;
        });
      console.log('ㅁㄴㅇㄹ');

      
      // 변경사항을 먼저 onChange로 전달
      onChange(
        updatedAllItems,

        changedCategories
      );

      // 실제 제거 작업
      onRemove(category);
    },
    [items, onChange, onRemove]
  );

  return (
    <Collapse
      draggable
      onDragEnd={reorderCategories}
      items={collapseItems}
      maxDepth={3}
      openKeys={openKeys}
      onOpenKeysChange={setOpenKeys}
      renderLeafItem={(props, api) => (
        <CategoryCollapseContent
          {...props}
          api={api}
          onChange={handleChangeName}
          onRemoveCategory={handleRemoveCategory}
          isLeaf
        />
      )}
      renderItem={(props, api) => (
        <CategoryCollapseContent
          {...props}
          api={api}
          onChange={handleChangeName}
          onAddCategory={handleAddCategory}
          onRemoveCategory={handleRemoveCategory}
        />
      )}
    />
  );
}

export { type CategoryCollapseProps };
