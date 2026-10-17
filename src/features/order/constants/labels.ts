import type { OrderRailNotice, Rich } from "@/features/order/types";

/**
 * 송장 대행 등록의 택배사 — 추적 연동 목록 하나로 출고·회수·재발송이 공통이다.
 * 이 목록 밖의 택배사는 추적이 원래 없는 건이 되므로 자유 입력을 두지 않는다(시안 B3·B4).
 */
export const TRACKING_CARRIERS = [
  "CJ대한통운",
  "한진택배",
  "롯데글로벌로지스",
  "우체국택배",
  "로젠택배",
  "대신택배",
  "경동택배",
  "일양로지스",
  "합동택배",
  "천일택배",
  "건영택배",
];

/** 송장번호 자릿수 — 택배사 공통 10~14자리 숫자 */
export const INVOICE_MIN_LENGTH = 10;
export const INVOICE_MAX_LENGTH = 14;

/** 운영자 사유 환불 — 반려 이의 인용 · 위해성 리콜 · 기타 3종 */
export const REFUND_CATEGORIES = [
  { value: "RECALL", label: "위해성 리콜" },
  { value: "OBJECTION_ACCEPTED", label: "반려 이의 인용" },
  { value: "OTHER", label: "기타(직접 입력)" },
] as const;

/** 반품 대신 열기 하자 유형 — 단순 변심이 없다(셀프 반품을 열지 않은 이유) */
export const DEFECT_TYPES = [
  { value: "DEFECT", label: "불량 · 파손" },
  { value: "MISMATCH", label: "표시·광고와 다름" },
  { value: "WRONG_ITEM", label: "오배송" },
] as const;

/** 레일 「조치할 것이 없습니다」 카드 문구 */
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
