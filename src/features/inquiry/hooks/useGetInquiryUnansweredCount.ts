import { INQUIRY_SUMMARY_QUERY_KEY } from "@/features/inquiry/constants/queryKey";
import { inquiryService } from "@/features/inquiry/services/inquiryService";
import { useQuery } from "@tanstack/react-query";

/**
 * 사이드바 뱃지에 쓸 1:1 문의 미답변 건수.
 *
 * `CS·콘텐츠 관리` 그룹 뱃지도 이 값이다 — 상품 문의 답변대기는 **브랜드** 조치라
 * 운영자 뱃지에 더하지 않는다(§17-7).
 */
export function useGetInquiryUnansweredCount() {
  const { data, isLoading } = useQuery({
    queryKey: [INQUIRY_SUMMARY_QUERY_KEY],
    queryFn: () => inquiryService.getInquirySummary(),
    select: (response) => response.unansweredCount ?? 0,
  });

  return {
    unansweredCount: data ?? 0,
    isLoading,
  };
}
