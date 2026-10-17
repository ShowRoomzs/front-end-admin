import { parseServerDateTime } from "@/common/utils/formatDate";
import type { RefundPaymentScope } from "@/features/refund/types";

/** 27,200 — 표 안 금액(단위는 열 머리에 없고 시안도 숫자만 적는다) */
export function formatAmount(value: number) {
  return value.toLocaleString("ko-KR");
}

/** 27,200원 */
export function formatWon(value: number) {
  return `${formatAmount(value)}원`;
}

/** 09.18 14:20 — 시안 일시 열 */
export function formatMonthDayTime(value: string) {
  return parseServerDateTime(value).format("MM.DD HH:mm");
}

const SCOPE_LABEL: Record<RefundPaymentScope, string> = {
  ORIGINAL: "원래",
  ADDITIONAL: "추가",
  ORIGINAL_PARTIAL: "원래 부분",
};

/** 결제 열 — "카드 · 원래" · "카카오페이 · 추가". 꼬리표가 없으면 수단만 */
export function paymentText(method: string, scope: RefundPaymentScope | null) {
  return scope ? `${method} · ${SCOPE_LABEL[scope]}` : method;
}
