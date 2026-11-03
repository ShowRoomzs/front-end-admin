import { apiInstance } from "@/common/lib/apiInstance";

/**
 * 정책 영업일 · 일수 — `GET /v1/common/policy-values`(인증 불요 · 백엔드 58 계획 6-1).
 *
 * 시안의 「N영업일 [정책값 미정]」 자리를 채우는 값이다. 서버 설정이 바뀌면 화면이 따라오도록 숫자를
 * 화면에 하드코딩하지 말고 이 값을 쓴다. 설정이 없는 값은 null — 그때는 화면이 「N영업일」로 둔다.
 */
export interface PolicyValues {
  /** 택배 도착 후 자동 입고(기-17) */
  claimAutoReceiveBusinessDays: number | null;
  /** 마지막 추적 이벤트 후 추적 정지 판정 */
  trackingStallAlertDays: number | null;
  /** 추적 정지 판정 후 소비자 선택(재발송/환불) 개방(기-15) */
  stallConsumerChoiceDays: number | null;
  /** 정산 확인 기간 */
  settlementReviewBusinessDays: number | null;
  /** 확정 후 지급(기-10) */
  settlementPayoutBusinessDays: number | null;
  /** 조정 합의 기한 */
  adjustmentDeadlineBusinessDays: number | null;
  fixedFeePaymentBusinessDays: number | null;
  /** 정지 이의 신청 기한(기-02) */
  sanctionAppealBusinessDays: number | null;
  /** 소명 검토(기-02 · 지금은 null) */
  sanctionAppealReviewBusinessDays: number | null;
  /** 취소 요청 응답 마감 */
  cancelRequestRespondBusinessDays: number | null;
  creatorAccountReviewBusinessDays: number | null;
  /** 공구 직권 중단 소명 기한(기-21) */
  groupBuySuspensionAppealBusinessDays: number | null;
}

export const policyValuesService = {
  get: async () => {
    const { data } = await apiInstance.get<PolicyValues>(
      "/common/policy-values",
      // 문구 보조값이라 실패해도 화면이 「N영업일」로 버틴다 — 토스트를 띄우지 않는다
      { suppressErrorToast: true }
    );
    return data;
  },
};
