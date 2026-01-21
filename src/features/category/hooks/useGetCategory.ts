import {
  categoryService,
  type Category,
  type CategoryFilter,
} from "@/features/category/services/categoryService";
import type { Filter } from "@/features/filter/services/filterService";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface CategoryMap {
  byId: Map<number | string, Category>;
  byParentId: Map<number | string, Array<Category>>;
  mainCategories: Category[];
}

export function useGetCategory() {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });
  const parseFilters = (filters: Array<Filter>): Array<CategoryFilter> => {
    return filters.map((filter) => ({
      filterId: Number(filter.id),
      selectedValueIds: filter.values.map((value) => Number(value.id)),
    }));
  };
  const categoryMap = useMemo<CategoryMap | null>(() => {
    if (!query.data) return null;

    const byId = new Map<number | string, Category>();
    const byParentId = new Map<number | string, Array<Category>>();
    const mainCategories: Category[] = [];

    query.data.forEach((originCategory) => {
      const category = {
        ...originCategory,
        filter: parseFilters((originCategory.filters as Array<Filter>) || []),
      };
      byId.set(category.categoryId, category);

      if (!category.parentId) {
        mainCategories.push(category);
      } else {
        const parentCategories = byParentId.get(category.parentId) || [];
        parentCategories.push(category);
        byParentId.set(category.parentId, parentCategories);
      }
    });

    mainCategories.sort((a, b) => a.order - b.order);

    byParentId.forEach((categories) => {
      categories.sort((a, b) => a.order - b.order);
    });

    return {
      byId,
      byParentId,
      mainCategories,
    };
  }, [query.data]);

  return {
    ...query,
    categoryMap,
  };
}
