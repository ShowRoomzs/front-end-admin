import { CHANGE_REQUEST_SUMMARY_QUERY_KEY } from "@/features/changeRequest/constants/queryKey";
import { changeRequestService } from "@/features/changeRequest/services/changeRequestService";
import { useQuery } from "@tanstack/react-query";

/**
 * 사이드바 뱃지에 쓸 변경 요청 검토 대기 건수.
 *
 * 입점 심사 쪽은 집계 API가 없어 목록을 `size: 1`로 불러 statusCounts를 훔쳐 쓰지만,
 * 변경 요청은 전용 summary 엔드포인트가 있어 그대로 쓴다.
 */
export function useGetChangeRequestPendingCount() {
  const { data, isLoading } = useQuery({
    queryKey: [CHANGE_REQUEST_SUMMARY_QUERY_KEY],
    queryFn: () => changeRequestService.getChangeRequestSummary(),
    select: (data) => data.pendingCount ?? 0,
  });

  return {
    pendingCount: data ?? 0,
    isLoading,
  };
}
