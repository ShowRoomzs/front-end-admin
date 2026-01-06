import type { CollapseItem } from "@/components/ui/collapse";
import type { Category } from "@/features/category/services/categoryService";

export function convertCategoriesToCollapseItems(
  categories: Array<Category>
): Array<CollapseItem<Category>> {
  return categories.map((category) => ({
    id: category.categoryId,
    parentId: category.parentId ?? null,
    order: category.order,
    data: category,
  }));
}
