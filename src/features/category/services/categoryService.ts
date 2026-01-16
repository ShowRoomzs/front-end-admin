import { apiInstance } from "@/common/lib/apiInstance";

export interface Category {
  categoryId: number | string; // 실제 타입은 number
  name: string;
  order: number;
  iconUrl: string;
  parentId?: number | string; // 실제 타입은 number
}
type CategoryResponse = Array<Category>;

export const categoryService = {
  getCategories: async () => {
    const { data: response } = await apiInstance.get<CategoryResponse>(
      "/common/categories"
    );

    return response;
  },
};
