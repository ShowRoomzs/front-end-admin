import { DEFAULT_CATEGORY_NAME } from "@/features/category/constants/categoryName";
import type { Category } from "@/features/category/services/categoryService";

function countCategoriesWithNewPrefix(
  categories: Array<Category>,
  prefixText: string,
  parentId?: number | string
): number {
  const filteredCategories = parentId
    ? categories.filter((category) => category.parentId === parentId)
    : categories;

  const newCategories = filteredCategories.filter(
    (category) =>
      category.name.startsWith(prefixText) &&
      !isNaN(Number(category.name.split(prefixText)[1]))
  );

  if (newCategories.length === 0) {
    return 1;
  }
  const lastNum =
    newCategories[newCategories.length - 1].name.split(prefixText)[1];

  return Number(lastNum) + 1;
}

export function getNewCategoryName(
  categories: Array<Category>,
  parentId: number | string | undefined,
  depth: number
): string {
  const prefixText =
    depth === 1
      ? DEFAULT_CATEGORY_NAME
      : categories.find((c) => c.categoryId === parentId)?.name;

  if (!prefixText) {
    return "";
  }
  const suffixNum = countCategoriesWithNewPrefix(
    categories,
    prefixText,
    parentId
  );
  return `${prefixText} ${suffixNum}`;
}

export function getCategoryOrder(
  categories: Array<Category>,
  parentId?: number | string
): number {
  const filteredCategories = parentId
    ? categories.filter((category) => category.parentId === parentId)
    : categories;

  return filteredCategories.length;
}
