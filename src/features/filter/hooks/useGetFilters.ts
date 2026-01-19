import { FILTERS_QUERY_KEY } from "@/features/filter/constants/queryKey";
import { filterService } from "@/features/filter/services/filterService";
import { useQuery } from "@tanstack/react-query";

export function useGetFilters() {
  return useQuery({
    queryKey: [FILTERS_QUERY_KEY],
    queryFn: filterService.getFilters,
  });
}
