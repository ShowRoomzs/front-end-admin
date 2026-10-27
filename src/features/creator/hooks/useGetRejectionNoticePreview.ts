import { CREATOR_REJECTION_NOTICE_PREVIEW_QUERY_KEY } from "@/features/creator/constants/queryKey";
import {
  creatorService,
  type CreatorRejectionReasonType,
} from "@/features/creator/services/creatorService";
import { useQuery } from "@tanstack/react-query";

/** 반려 모달의 신청자 통지 미리보기 — 사유를 고르기 전에는 부르지 않는다 */
export function useGetRejectionNoticePreview(
  applicationId: number,
  reasonType: CreatorRejectionReasonType | ""
) {
  return useQuery({
    queryKey: [
      CREATOR_REJECTION_NOTICE_PREVIEW_QUERY_KEY,
      applicationId,
      reasonType,
    ],
    queryFn: () =>
      creatorService.getRejectionNoticePreview(
        applicationId,
        reasonType as CreatorRejectionReasonType
      ),
    enabled: reasonType !== "",
  });
}
