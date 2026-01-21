import { apiInstance } from "@/common/lib/apiInstance";
import type { Filter } from "@/features/filter/services/filterService";

export interface CategoryFilter {
  filterId: number;
  selectedValueIds: number[];
}
export interface Category {
  categoryId: number | string; // 실제 타입은 number
  name: string;
  order: number;
  iconUrl: string;
  parentId?: number | string; // 실제 타입은 number
  filters?: Array<Filter | CategoryFilter>;
}

export type CategoryResponse = Array<Category>;

export const categoryService = {
  getCategories: async () => {
    const { data: response } =
      await apiInstance.get<CategoryResponse>("/common/categories");

    return response;
  },
};
