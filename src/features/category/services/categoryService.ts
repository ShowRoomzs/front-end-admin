import { apiInstance } from "@/common/lib/apiInstance";

export interface Category {
  categoryId: number | string;
  name: string;
  order: number;
  iconUrl: string;
  parentId?: number;
}
type CategoryResponse = Array<Category>;

export const categoryService = {
  getCategories: async () => {
    const { data: response } = await apiInstance.get<CategoryResponse>(
      "/admin/categories"
    );

    return response;
  },
};
