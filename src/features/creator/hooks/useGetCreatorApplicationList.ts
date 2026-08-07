import { CREATOR_APPLICATION_LIST_QUERY_KEY } from "@/features/creator/constants/queryKey";
import {
  creatorService,
  type CreatorApplicationParams,
} from "@/features/creator/services/creatorService";
import { useQuery } from "@tanstack/react-query";

export function useGetCreatorApplicationList(
  params: CreatorApplicationParams
) {
  return useQuery({
    queryKey: [CREATOR_APPLICATION_LIST_QUERY_KEY, params],
    queryFn: () => creatorService.getCreatorApplicationList(params),
  });
}
