import type { CategoryFilter } from "@/features/category/services/categoryService";
import type { Filter } from "@/features/filter/services/filterService";

export function extractFilterIds(filters: Array<Filter | CategoryFilter>) {
  const result: Array<number | string> = [];

  filters.forEach((filter) => {
    if ("filterId" in filter) {
      const categoryFilter = filter as CategoryFilter;
      if (categoryFilter.selectedValueIds.length === 0) {
        result.push(categoryFilter.filterId);
        return;
      }

      filter.selectedValueIds.forEach((valueId) => {
        result.push(`${filter.filterId}-${valueId}`);
      });
    } else {
      const filterItem = filter as Filter;
      if (filterItem.values.length === 0) {
        result.push(filterItem.id);
        return;
      }

      filterItem.values.forEach((value) => {
        result.push(`${filterItem.id}-${value.id}`);
      });
    }
  });

  return result;
}
