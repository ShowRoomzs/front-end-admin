import { categoryService } from "@/features/category/services/categoryService";
import { useQuery } from "@tanstack/react-query";

export function useGetCategory() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getCategories,
  });
}
