import { REGION_LIST_QUERY_KEY } from "@/features/user/constants/queryKey";
import { commonUserService } from "@/features/user/services/commonUserService";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useGetRegionList() {
  const query = useQuery({
    queryKey: [REGION_LIST_QUERY_KEY],
    queryFn: commonUserService.getRegionList,
  });

  const regionMap = useMemo(() => {
    if (!query.data) {
      return {};
    }
    return query.data.reduce(
      (acc, region) => {
        if (!acc[region.country]) {
          acc[region.country] = region.cities;
          return acc;
        }
        acc[region.country].push(...region.cities);
        return acc;
      },
      {} as Record<string, Array<string>>
    );
  }, [query.data]);
  return {
    ...query,
    regionMap,
  };
}
