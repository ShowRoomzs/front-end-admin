import { fileService } from "@/common/services/fileService";
import { Collapse } from "@/components/ui/collapse";
import AddFilterModal from "@/features/category/components/AddFilterModal/AddFilterModal";
import CategoryCollapseContent from "@/features/category/components/CategoryCollapse/CategoryCollapseContent";
import { convertCategoriesToCollapseItems } from "@/features/category/components/CategoryCollapse/config";
import type {
  Category,
  CategoryFilter,
} from "@/features/category/services/categoryService";
import { extractFilterIds } from "@/features/category/utils/extractFilterIds";
import type { Filter } from "@/features/filter/services/filterService";
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
  const [filterModalConfig, setFilterModalConfig] = useState<{
    isOpen: boolean;
    categoryId: number | string | null;
    initialFilters: Array<CategoryFilter | Category>;
    disabledFilterIds: Array<number | string>;
  }>({
    isOpen: false,
    categoryId: null,
    initialFilters: [],
    disabledFilterIds: [],
  });
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
      // 1. id 추출
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
          (i) => i.categoryId.toString(30) === draggedId
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

      // 변경사항을 먼저 onChange로 전달
      onChange(updatedAllItems, changedCategories);

      // 실제 제거 작업
      onRemove(category);
    },
    [items, onChange, onRemove]
  );

  const handleClickAddFilter = useCallback(
    (categoryId: number | string) => {
      const targetCategory = items.find((v) => v.categoryId === categoryId);
      if (!targetCategory) {
        return;
      }

      // 부모들의 필터 ID 추출
      const parentFilterIds: Array<number | string> = [];
      let currentParentId = targetCategory.parentId;

      while (currentParentId) {
        const parent = items.find((v) => v.categoryId === currentParentId);
        if (!parent) break;

        if (parent.filters && parent.filters.length > 0) {
          const filterIds = extractFilterIds(
            parent.filters as Array<CategoryFilter | Filter>
          );
          parentFilterIds.push(...filterIds);
        }

        currentParentId = parent.parentId;
      }

      setFilterModalConfig({
        isOpen: true,
        categoryId: categoryId as number | string,
        initialFilters:
          (targetCategory?.filters as unknown as Array<Category>) ?? [],
        disabledFilterIds: parentFilterIds,
      });
    },
    [items]
  );

  const handleAddFilter = useCallback(
    (newFilters: Array<Filter>) => {
      // 현재 카테고리에 추가된 필터 ID 추출
      const newFilterIds = extractFilterIds(newFilters);
      const newFilterIdsSet = new Set(newFilterIds);

      // 하위 자식들 찾기 (재귀적으로)
      const findChildren = (parentId: number | string): Array<Category> => {
        const children = items.filter(
          (item) => item.parentId?.toString() === parentId.toString()
        );
        return [
          ...children,
          ...children.flatMap((child) => findChildren(child.categoryId)),
        ];
      };

      const children = filterModalConfig.categoryId
        ? findChildren(filterModalConfig.categoryId)
        : [];

      const updatedCategories = items.map((item) => {
        // 현재 카테고리: 새 필터 적용
        if (item.categoryId === filterModalConfig.categoryId) {
          return { ...item, filters: newFilters };
        }

        // 하위 자식: 부모와 겹치는 필터 제거
        const isChild = children.some(
          (child) => child.categoryId === item.categoryId
        );
        if (isChild && item.filters && item.filters.length > 0) {
          const updatedFilters = (item.filters as Array<Filter>)
            .map((filter) => {
              // 필터 전체가 부모에 있는지 확인
              if (newFilterIdsSet.has(filter.id)) {
                return null;
              }

              // values가 있는 경우, 겹치지 않는 값들만 남김
              if (filter.values && filter.values.length > 0) {
                const remainingValues = filter.values.filter(
                  (value) => !newFilterIdsSet.has(`${filter.id}-${value.id}`)
                );

                if (remainingValues.length === 0) {
                  return null;
                }

                return {
                  ...filter,
                  values: remainingValues,
                };
              }

              return filter;
            })
            .filter((f): f is Filter => f !== null);

          return { ...item, filters: updatedFilters };
        }

        return item;
      });

      const changedCategories: Array<Category> = [];

      // 현재 카테고리 추가
      const changedCategory = updatedCategories.find(
        (v) => v.categoryId === filterModalConfig.categoryId
      );
      if (changedCategory) {
        changedCategories.push(changedCategory);
      }

      // 필터가 변경된 하위 자식들 추가
      children.forEach((child) => {
        const updated = updatedCategories.find(
          (v) => v.categoryId === child.categoryId
        );
        const original = items.find((v) => v.categoryId === child.categoryId);

        if (
          updated &&
          original &&
          JSON.stringify(updated.filters) !== JSON.stringify(original.filters)
        ) {
          changedCategories.push(updated);
        }
      });

      onChange(updatedCategories, changedCategories);
    },
    [filterModalConfig.categoryId, items, onChange]
  );

  const handleClickAddImage = useCallback(
    async (category: Category, file: File): Promise<string> => {
      const response = await fileService.upload(file, "CATEGORY");
      const updatedCategories = items.map((item) =>
        item.categoryId === category.categoryId
          ? { ...item, iconUrl: response.imageUrl }
          : item
      );
      const changedCategory = updatedCategories.find(
        (v) => v.categoryId === category.categoryId
      );
      if (!changedCategory) {
        return "";
      }
      onChange(updatedCategories, [changedCategory]);
      return changedCategory.iconUrl;
    },
    [items, onChange]
  );
  return (
    <>
      <AddFilterModal
        open={filterModalConfig.isOpen}
        onOpenChange={(isOpen) =>
          setFilterModalConfig({
            ...filterModalConfig,
            initialFilters: [],
            isOpen,
          })
        }
        initialFilters={
          filterModalConfig.initialFilters as Array<CategoryFilter>
        }
        disabledFilterIds={filterModalConfig.disabledFilterIds}
        onAddFilter={handleAddFilter}
      />
      <Collapse
        draggable
        onDragEnd={handleDragEnd}
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
            onClickAddFilter={handleClickAddFilter}
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
            onClickAddFilter={handleClickAddFilter}
            onClickAddImage={handleClickAddImage}
          />
        )}
      />
    </>
  );
}

export { type CategoryCollapseProps };
