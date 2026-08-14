import { CHANGE_REQUEST_DETAIL_QUERY_KEY } from "@/features/changeRequest/constants/queryKey";
import {
  changeRequestService,
  type ChangeRequestStatusFilter,
} from "@/features/changeRequest/services/changeRequestService";
import { useQuery } from "@tanstack/react-query";

/**
 * `status`는 조회 조건이 아니라 이전/다음 계산 범위라 쿼리키에 포함해야 한다.
 * 같은 건이라도 어느 탭에서 들어왔느냐에 따라 prev/next가 달라진다.
 */
export function useGetChangeRequestDetail(
  requestId: number,
  status: ChangeRequestStatusFilter
) {
  return useQuery({
    queryKey: [CHANGE_REQUEST_DETAIL_QUERY_KEY, requestId, status],
    queryFn: () =>
      changeRequestService.getChangeRequestDetail(requestId, status),
    enabled: Number.isFinite(requestId),
  });
}
