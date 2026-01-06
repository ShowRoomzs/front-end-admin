import { useGetCategory } from "@/features/category/hooks/useGetCategory";
import CategoryCollapse from "@/features/category/components/CategoryCollapse/CategoryCollapse";
import { useCallback, useState, useEffect } from "react";
import type { Category } from "@/features/category/services/categoryService";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { usePromiseQueue } from "@/common/hooks/usePromiseQueue/usePromiseQueue";

import {
  getCategoryOrder,
  getNewCategoryName,
} from "@/features/category/utils/category";
import { nanoid } from "nanoid";
import toast from "react-hot-toast";

export default function CategoryManagement() {
  const { data: categories } = useGetCategory();
  const [localCategories, setLocalCategories] = useState<Array<Category>>([]);

  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  const { update, queue, create, execute, remove } = usePromiseQueue<Category>({
    originData: categories,
    keyString: "categoryId",
    methodUrlMap: {
      POST: "/admin/categories",
      PUT: "/admin/categories",
      DELETE: "/admin/categories",
    },
  });

  const handleChange = useCallback(
    (updatedItems: Array<Category>, changedItems: Array<Category>) => {
      setLocalCategories(updatedItems);

      changedItems.forEach((item) => {
        update(item);
      });
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
      name: getNewCategoryName(localCategories),
      order: getCategoryOrder(localCategories),
      iconUrl: "",
      parentId: undefined,
      categoryId: nanoid() as unknown as number,
    };
    addCategory(newCategory);
  }, [addCategory, localCategories]);

  const handleRemove = useCallback(
    (category: Category) => {
      setLocalCategories((prev) =>
        prev.filter((item) => item.categoryId !== category.categoryId)
      );
      remove(category);
    },
    [remove]
  );

  const handleClickSave = useCallback(async () => {
    await execute();
    toast.success("정상적으로 저장되었습니다.");
  }, [execute]);

  const handleAddChildCategory = useCallback(
    (category: Category) => {
      const newCategory: Category = {
        name: getNewCategoryName(localCategories, category.categoryId),
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
        >
          저장
        </Button>
      </div>
      <CategoryCollapse
        onRemove={handleRemove}
        onChange={handleChange}
        onAddChild={handleAddChildCategory}
        items={localCategories}
      />
    </div>
  );
}
