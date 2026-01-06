import { Collapse } from "@/components/ui/collapse";
import CategoryCollapseContent from "@/features/category/components/CategoryCollapse/CategoryCollapseContent";
import { convertCategoriesToCollapseItems } from "@/features/category/components/CategoryCollapse/config";
import type { Category } from "@/features/category/services/categoryService";
import type { DropResult } from "@hello-pangea/dnd";
import { useCallback, useMemo } from "react";

interface CategoryCollapseProps {
  items: Array<Category>;
  onChange: (
    updatedItems: Array<Category>,
    changedItems: Array<Category>
  ) => void;
  onRemove: (category: Category) => void;
}

export default function CategoryCollapse(props: CategoryCollapseProps) {
  const { items, onChange, onRemove } = props;

  const collapseItems = useMemo(
    () => convertCategoriesToCollapseItems(items),
    [items]
  );

  const reorderCategories = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) return;

      // 1. 드래그된 아이템 식별
      const draggedId = Number(result.draggableId);
      const draggedItem = items.find((i) => i.categoryId === draggedId);
      if (!draggedItem) return;

      // 2. 현재 화면에 보이는 것과 동일한 순서의 리스트 생성
      // (Collapse 컴포넌트의 getVisibleItems 로직과 유사)
      const itemMap = new Map<number | string, Category>();
      const childrenMap = new Map<
        number | string | null,
        Array<number | string>
      >();
      items.forEach((item) => {
        itemMap.set(item.categoryId, item);
        const pId = item.parentId || null;
        if (!childrenMap.has(pId)) childrenMap.set(pId, []);
        childrenMap.get(pId)!.push(item.categoryId);
      });
      childrenMap.forEach((ids) => {
        ids.sort(
          (a, b) => (itemMap.get(a)?.order || 0) - (itemMap.get(b)?.order || 0)
        );
      });

      const visibleIds: Array<number | string> = [];
      const traverse = (pId: number | string | null) => {
        const ids = childrenMap.get(pId) || [];
        ids.forEach((id) => {
          visibleIds.push(id);
          traverse(id);
        });
      };
      traverse(null);

      // 3. visibleIds에서 순서 변경
      const newVisibleIds = Array.from(visibleIds);
      const [removedId] = newVisibleIds.splice(sourceIndex, 1);
      newVisibleIds.splice(destinationIndex, 0, removedId);

      // 4. 새로운 순서를 바탕으로 모든 아이템의 order 재계산 (동일 부모 그룹별로)
      const changedCategories: Array<Category> = [];
      const newItems = items.map((item) => {
        // 드래그된 아이템과 같은 부모를 가진 형제들 내에서의 새로운 순서 찾기
        const parentId = item.parentId || null;
        const siblingsInNewOrder = newVisibleIds
          .map((id) => itemMap.get(id)!)
          .filter((i) => (i.parentId || null) === parentId);

        const newOrder = siblingsInNewOrder.findIndex(
          (i) => i.categoryId === item.categoryId
        );

        if (item.order !== newOrder) {
          const updated = { ...item, order: newOrder };
          changedCategories.push(updated);
          return updated;
        }
        return item;
      });

      if (changedCategories.length > 0) {
        onChange(newItems, changedCategories);
      }
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

  const handleAddCategory = useCallback((category: Category, depth: number) => {
    console.log("add category", category, depth);
  }, []);

  const handleRemoveCategory = useCallback(
    (category: Category) => {
      onRemove(category);
    },
    [onRemove]
  );

  return (
    <Collapse
      draggable
      onDragEnd={reorderCategories}
      items={collapseItems}
      maxDepth={3}
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
