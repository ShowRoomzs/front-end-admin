import type { Rich } from "@/features/order/components/shared/RichText";
import type {
  ClaimReason,
  DeliveryCarrier,
  OperatorRefundReason,
  OrderBadgeData,
  OrderBadgeTone,
  RefundTaskStatus,
  SellerCancelReason,
  TrackingAlert,
} from "@/features/order/types";

/*
  서버가 라벨을 내리지 않는 값만 여기 둔다 — 상태 · 추적 경고 · 택배사 · 환불 출처 라벨은 응답의
  `*Label` 필드를 그대로 쓴다. 아래 표는 전부 백엔드 enum의 라벨을 옮긴 것이다.
*/

/**
 * 송장 대행 등록의 택배사 — `DeliveryCarrier.selectable()`(추적 연동 업체 · 선언 순서).
 * 쿠팡택배는 추적 코드가 없어 고를 수 없다.
 */
export const TRACKING_CARRIERS: Array<{
  value: DeliveryCarrier;
  label: string;
}> = [
  { value: "CJ", label: "CJ대한통운" },
  { value: "EPOST", label: "우체국택배" },
  { value: "HANJIN", label: "한진택배" },
  { value: "LOTTE", label: "롯데택배" },
  { value: "LOGEN", label: "로젠택배" },
  { value: "KYUNGDONG", label: "경동택배" },
  { value: "DAESIN", label: "대신택배" },
  { value: "ILYANG", label: "일양로지스" },
  { value: "CU", label: "CU 편의점택배" },
  { value: "GS25", label: "GS25 편의점택배" },
  { value: "HAPDONG", label: "합동택배" },
  { value: "WOORI", label: "우리택배" },
];

/** `TrackingAlert` 톤 — 목록 응답에 경고 톤이 없어 enum 정의를 옮겼다 */
export const TRACKING_ALERT_TONE: Record<TrackingAlert, OrderBadgeTone> = {
  PICKUP_UNCONFIRMED: "WARNING",
  STALLED: "DANGER",
};

/** 운영자 사유 환불 — 06a가 받는 2종(`OperatorRefundReason`) */
export const REFUND_REASONS: Array<{
  value: OperatorRefundReason;
  label: string;
}> = [
  { value: "RECALL", label: "위해성 리콜" },
  { value: "POST_CONFIRM_DEFECT", label: "구매확정 후 하자" },
];

/** 대행 직권 취소 사유(`SellerCancelReason`) — DEFECT만 대행 조건 없이 열린다 */
export const CANCEL_REASONS: Array<{
  value: SellerCancelReason;
  label: string;
}> = [
  { value: "DEFECT", label: "상품 하자" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "UNDELIVERABLE_AREA", label: "배송 불가 지역" },
  { value: "ETC", label: "기타" },
];

/** 반품 대신 열기 하자 유형 — 브랜드 귀책 사유만(`ClaimReason`) */
export const DEFECT_REASONS: Array<{ value: ClaimReason; label: string }> = [
  { value: "DAMAGED_OR_DEFECTIVE", label: "배송 상품 파손 및 불량" },
  { value: "WRONG_OR_LATE_DELIVERY", label: "오배송 및 배송 지연" },
];

/** 결제 상태(`PaymentStatus`) — 응답이 이름만 내린다 */
export const PAYMENT_STATUS_BADGE: Record<string, OrderBadgeData> = {
  READY: { label: "결제 대기", tone: "NEUTRAL" },
  PAID: { label: "결제 완료", tone: "SUCCESS" },
  FAILED: { label: "결제 실패", tone: "DANGER" },
  EXPIRED: { label: "만료", tone: "NEUTRAL" },
  SUPERSEDED: { label: "대체됨", tone: "NEUTRAL" },
  CANCELLED: { label: "취소", tone: "NEUTRAL" },
  CANCEL_REQUESTED: { label: "취소 요청", tone: "WARNING" },
  CANCELLED_MISMATCH: { label: "불일치 자동 취소", tone: "NEUTRAL" },
  CANCEL_FAILED: { label: "취소 실패", tone: "DANGER" },
};

/** 항목 상태(`OrderProductStatus`) — 응답이 이름만 내린다 */
export const ITEM_STATUS_BADGE: Record<string, OrderBadgeData> = {
  PENDING: { label: "결제 대기", tone: "NEUTRAL" },
  PAID: { label: "결제 완료", tone: "INFO" },
  PURCHASE_CONFIRMED: { label: "구매 확정", tone: "SUCCESS" },
  CANCELLED: { label: "취소", tone: "NEUTRAL" },
  RETURNED: { label: "반품", tone: "NEUTRAL" },
};

/** 환불 큐 상태(`RefundTaskStatus`) — enum에 라벨이 없어 환불 관리 화면의 말로 옮겼다 */
export const REFUND_STATUS_BADGE: Record<RefundTaskStatus, OrderBadgeData> = {
  PENDING: { label: "집행 대기", tone: "WARNING" },
  EXECUTING: { label: "집행 중", tone: "INFO" },
  DONE: { label: "환불 완료", tone: "SUCCESS" },
  FAILED: { label: "환불 실패", tone: "DANGER" },
  VOID: { label: "철회", tone: "NEUTRAL" },
};

/** 이력 주체(`FulfillmentActorType`) */
export const ACTOR_LABEL: Record<string, string> = {
  SYSTEM: "시스템",
  SELLER: "브랜드",
  ADMIN: "운영자",
  CONSUMER: "소비자",
  TRACKER: "배송 추적",
};

/** 레일 「조치할 것이 없습니다」 카드 문구 */
export type OrderRailNotice =
  | "RETURNED"
  | "CANCEL_REQUESTED"
  | "EXCHANGING"
  | "RETURN_OPENED"
  | "CANCELED"
  | "NO_ACTION";

export const RAIL_NOTICE_TEXT: Record<OrderRailNotice, Rich> = {
  RETURNED: [
    "조치할 것이 없습니다 — 반송 건은 ",
    { t: "재발송하지 않고 환불로 종결", k: "b" },
    "됩니다. 환불이 실패하면 ",
    { t: "환불 관리", k: "b" },
    "로 올라옵니다.",
  ],
  CANCEL_REQUESTED: [
    "조치할 것이 없습니다 — 브랜드가 마감까지 응답하지 않으면 ",
    { t: "자동 승인", k: "b" },
    "되고 PG가 바로 환불합니다. 운영자가 대신 승인·거부하지 않습니다.",
  ],
  EXCHANGING: [
    "조치할 것이 없습니다 — 검수와 재발송은 ",
    { t: "브랜드", k: "b" },
    "의 일이고, 반려 이의가 들어오면 ",
    { t: "반품·교환", k: "b" },
    "에서 처리합니다.",
  ],
  RETURN_OPENED: [
    "조치할 것이 없습니다 — 회수 송장 · 검수 · 환불은 ",
    { t: "반품·교환", k: "b" },
    "에서 이어집니다.",
  ],
  CANCELED: [
    "조치할 것이 없습니다 — 취소·환불은 ",
    { t: "PG 자동 환불", k: "b" },
    "로 종결됐습니다. 환불이 실패하면 ",
    { t: "환불 관리", k: "b" },
    "로 올라옵니다.",
  ],
  NO_ACTION: ["조치할 것이 없습니다."],
};

/**
 * 기-16 — 신규 단계 판매 취소도 「직권 취소」(06a rev.5). main 서버는 `OrderCancelType.SELLER_DIRECT`
 * 라벨을 「직권 취소」로 바꿨지만, 배포된 서버는 아직 「브랜드 직권 취소」를 내린다 — 둘 다 같은
 * 표시로 맞춘다(백엔드 배포 뒤에도 그대로 둬도 된다).
 */
export function cancelTypeText(label: string) {
  return label === "브랜드 직권 취소" ? "직권 취소" : label;
}

/*
  【잠정】 기-15 추적 정지 → 소비자 선택(재발송 / 환불) 개방 — 변호사 확인 뒤 문구가 바뀔 수 있어
  한 곳에 모은다. N(개방까지 남은 일수)은 서버 값(`stallChoice.daysUntilOpen`)이고, 값이 없으면
  시안 그대로 「N일 [정책값 미정]」으로 둔다(하드코딩 금지).
*/
export const STALL_CHOICE_TEXT = {
  /** 개방 전 — 「소비자 선택 개방까지 N일」(06a A3 · 06d A2 보조줄) */
  waiting: (days: number | null) =>
    days === null
      ? "소비자 선택 개방까지 N일 [정책값 미정]"
      : `소비자 선택 개방까지 ${days}일`,
  /** 개방 뒤 · 선택 전 */
  open: "소비자 선택 가능 · 재발송 / 환불",
  /** 선택 뒤 — 처리는 브랜드(재발송 = 송장 수정 · 환불 = 소비자 환불 처리) */
  chosen: (choiceLabel: string | null) => `소비자 선택 · ${choiceLabel ?? "—"}`,
} as const;
