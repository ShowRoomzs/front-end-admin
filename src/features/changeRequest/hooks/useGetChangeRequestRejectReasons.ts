import { CHANGE_REQUEST_REJECT_REASONS_QUERY_KEY } from "@/features/changeRequest/constants/queryKey";
import {
  changeRequestService,
  type ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import { useQuery } from "@tanstack/react-query";

/**
 * 반려 사유 목록. **유형마다 다르다**(사업자 정보 6종 / 정산 계좌 5종).
 *
 * 프론트 상수로 박지 않는 이유는 이 목록과 "기타일 때만 상세 사유 필수"라는 규칙의
 * SoT가 서버 enum이기 때문이다. 모달을 열 때만 부르고, 서버 enum이라 사실상 불변이므로
 * 세션 내내 캐시한다.
 */
export function useGetChangeRequestRejectReasons(
  type: ChangeRequestType | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: [CHANGE_REQUEST_REJECT_REASONS_QUERY_KEY, type],
    queryFn: () => changeRequestService.getChangeRequestRejectReasons(type!),
    enabled: enabled && Boolean(type),
    staleTime: Infinity,
  });
}
