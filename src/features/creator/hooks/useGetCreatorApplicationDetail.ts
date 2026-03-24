import { CREATOR_APPLICATION_DETAIL_QUERY_KEY } from "@/features/creator/constants/queryKey";
import { creatorService } from "@/features/creator/services/creatorService";
import { useQuery } from "@tanstack/react-query";

export function useGetCreatorApplicationDetail(creatorId: number) {
  return useQuery({
    queryKey: [CREATOR_APPLICATION_DETAIL_QUERY_KEY, creatorId],
    queryFn: () => creatorService.getCreatorApplicationDetail(creatorId),
  });
}
