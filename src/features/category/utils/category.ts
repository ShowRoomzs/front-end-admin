import { DEFAULT_CATEGORY_NAME } from "@/features/category/constants/categoryName";
import type { Category } from "@/features/category/services/categoryService";

function countCategoriesWithNewPrefix(
  categories: Array<Category>,
  parentId?: number
): number {
  const filteredCategories = parentId
    ? categories.filter((category) => category.parentId === parentId)
    : categories;

  const newCategories = filteredCategories.filter((category) =>
    category.name.startsWith(DEFAULT_CATEGORY_NAME)
  );

  const lastNum = newCategories[newCategories.length - 1].name.split(
    DEFAULT_CATEGORY_NAME
  )[1];

  return Number(lastNum) + 1;
}

export function getNewCategoryName(
  categories: Array<Category>,
  parentId?: number
): string {
  const suffixNum = countCategoriesWithNewPrefix(categories, parentId);
  return `${DEFAULT_CATEGORY_NAME} ${suffixNum}`;
}

export function getCategoryOrder(
  categories: Array<Category>,
  parentId?: number
): number {
  const filteredCategories = parentId
    ? categories.filter((category) => category.parentId === parentId)
    : categories;

  return filteredCategories.length;
}
