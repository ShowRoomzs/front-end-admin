import { useGetCategory } from "@/features/category/hooks/useGetCategory";
import CategoryCollapse from "@/features/category/components/CategoryCollapse/CategoryCollapse";
import { useCallback, useState, useEffect } from "react";
import type { Category } from "@/features/category/services/categoryService";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  usePromiseQueue,
  type ResolvePayload,
} from "@/common/hooks/usePromiseQueue/usePromiseQueue";

import {
  getCategoryOrder,
  getNewCategoryName,
} from "@/features/category/utils/category";
import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import { queryClient } from "@/common/lib/queryClient";

export default function CategoryManagement() {
  const { data: categories } = useGetCategory();
  const [localCategories, setLocalCategories] = useState<Array<Category>>([]);

  const [lastIdMapping, setLastIdMapping] =
    useState<Map<number | string, number | string>>();

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  // create 시 임시 parentId 를 실제 parentId 로 변경
  const resolvePayload: ResolvePayload<Category> = useCallback(
    (payload: Category, idMapping: Map<string | number, string | number>) => {
      const actualParentId = idMapping.get(
        payload.parentId as string
      ) as number;

      if (payload.parentId && actualParentId) {
        return {
          ...payload,
          parentId: actualParentId,
        };
      }
      return payload;
    },
    []
  );

  const { update, queue, create, execute, remove, isLoading } =
    usePromiseQueue<Category>({
      originData: categories,
      keyString: "categoryId",
      endpoint: "/admin/categories",
      resolvePayload,
    });

  const handleChange = useCallback(
    (updatedItems: Array<Category>, changedItems: Array<Category>) => {
      setLocalCategories(updatedItems);

      changedItems.forEach(update);
    },
    [update]
  );

  const addCategory = useCallback(
    (category: Category) => {
      setLocalCategories((prev) => [...prev, category]);
      create(category);
    },
    [create]
  );

  const handleClickAddCategory = useCallback(() => {
    const newCategory: Category = {
      name: getNewCategoryName(localCategories, undefined, 1),
      order: getCategoryOrder(localCategories),
      iconUrl: "",
      parentId: undefined,
      categoryId: nanoid(),
    };
    addCategory(newCategory);
  }, [addCategory, localCategories]);

  const handleRemove = useCallback(
    (category: Category) => {
      setLocalCategories((prev) =>
        prev.filter((item) => item.categoryId !== category.categoryId)
      );
      const removeArr: Array<Category> = [];

      // 말단 노드부터 순서대로 쌓이도록
      const loop = (category: Category) => {
        const children = localCategories.filter(
          (c) => c.parentId === category.categoryId
        );

        children.forEach(loop);

        removeArr.push(category);
      };

      loop(category);
      removeArr.forEach(remove);
    },
    [localCategories, remove]
  );

  const handleClickSave = useCallback(async () => {
    const result = await execute();

    // idMapping을 CategoryCollapse에 전달하여 UI 상태 동기화
    if (result?.idMapping && result.idMapping.size > 0) {
      setLastIdMapping(result.idMapping);
    }

    queryClient.invalidateQueries({ queryKey: ["categories"] }); // TODO : 쿼리키 상수로 분리
    toast.success("정상적으로 저장되었습니다.");
  }, [execute]);

  const handleAddChildCategory = useCallback(
    (category: Category, depth: number) => {
      const newCategory: Category = {
        name: getNewCategoryName(localCategories, category.categoryId, depth),
        order: getCategoryOrder(localCategories, category.categoryId),
        iconUrl: "",
        parentId: category.categoryId,
        categoryId: nanoid(),
      };

      addCategory(newCategory);
    },
    [addCategory, localCategories]
  );

  if (!categories) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-end gap-2 items-center">
        <Button
          onClick={handleClickAddCategory}
          variant={"outline"}
          className="w-fit"
        >
          카테고리 추가
          <PlusIcon className="w-fit" />
        </Button>
        <Button
          onClick={handleClickSave}
          disabled={queue.length === 0}
          variant="default"
          className="w-fit"
          isLoading={isLoading}
        >
          저장
        </Button>
      </div>
      <CategoryCollapse
        onRemove={handleRemove}
        onChange={handleChange}
        onAddChild={handleAddChildCategory}
        items={localCategories}
        idMapping={lastIdMapping}
      />
    </div>
  );
}
