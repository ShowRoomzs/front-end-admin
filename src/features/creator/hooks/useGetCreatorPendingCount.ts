import { CREATOR_APPLICATION_LIST_QUERY_KEY } from "@/features/creator/constants/queryKey";
import {
  creatorService,
  type CreatorApplicationParams,
} from "@/features/creator/services/creatorService";
import { useQuery } from "@tanstack/react-query";

// 목록 응답에 statusCounts가 함께 오므로 행은 최소로만 받는다
const PENDING_COUNT_PARAMS: CreatorApplicationParams = {
  status: "PENDING",
  keyword: "",
  page: 1,
  size: 1,
};

/**
 * 사이드바 뱃지에 쓸 인플루언서 심사 대기 건수.
 * 목록 API가 내려주는 statusCounts.pending을 그대로 사용한다.
 */
export function useGetCreatorPendingCount() {
  const { data, isLoading } = useQuery({
    queryKey: [
      CREATOR_APPLICATION_LIST_QUERY_KEY,
      "count",
      PENDING_COUNT_PARAMS,
    ],
    queryFn: () =>
      creatorService.getCreatorApplicationList(PENDING_COUNT_PARAMS),
    select: (data) => data.statusCounts?.pending ?? 0,
  });

  return {
    pendingCount: data ?? 0,
    isLoading,
  };
}
