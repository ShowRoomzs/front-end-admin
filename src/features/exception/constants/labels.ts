import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type {
  DelayType,
  DeliveryExceptionType,
} from "@/features/exception/types";

export const DELAY_TYPE_LABEL: Record<DelayType, string> = {
  SHIPPING_OVERDUE: "발송 기한 경과",
  INSPECTION_OVERDUE: "검수 지연",
  RESHIP_OVERDUE: "재발송 지연",
};

export const DELIVERY_TYPE_LABEL: Record<DeliveryExceptionType, string> = {
  PICKUP_UNCONFIRMED: "집화 확인 필요",
  TRACKING_STALLED: "추적 정지",
  RETURNING: "반송 중",
  RETURN_INVOICE_UNTRACKED: "회수 송장 미조회",
};

/**
 * 배송 예외 배지색 — 시안 [상태색]: 집화 확인 필요 = 경고(24시간 판정),
 * 추적 정지 · 반송 중 = 위험(소비자 물건이 멈춘 상태).
 * 회수 송장 미조회는 시안에 색이 없다 — 24시간 판정류와 같은 경고로 둔다(미확정).
 */
export const DELIVERY_TYPE_VARIANT: Record<
  DeliveryExceptionType,
  StatusBadgeVariant
> = {
  PICKUP_UNCONFIRMED: "warning",
  TRACKING_STALLED: "danger",
  RETURNING: "danger",
  RETURN_INVOICE_UNTRACKED: "warning",
};

/** 「기준」 열 — 어느 시점부터 세는가 */
export const DELIVERY_BASIS_LABEL: Record<DeliveryExceptionType, string> = {
  PICKUP_UNCONFIRMED: "등록 후 24시간",
  TRACKING_STALLED: "집화 후 7일",
  RETURNING: "반송 감지",
  // 시안에 없다 — 회수 송장도 등록 시점부터 센다고 보고 임시로 적는다
  RETURN_INVOICE_UNTRACKED: "회수 송장 등록 후",
};

/**
 * 「처리 주체」 열 — 운영자가 CS 통화에서 답할 문장이다.
 * 분실 판정·보상은 택배사와 브랜드 사이의 일이라 플랫폼은 개입하지 않는다.
 */
export const DELIVERY_HANDLER_LABEL: Record<DeliveryExceptionType, string> = {
  PICKUP_UNCONFIRMED: "브랜드 확인 · 시스템 알림",
  TRACKING_STALLED: "소비자·브랜드가 택배사 조회",
  RETURNING: "완료 감지 시 PG 자동 환불",
  // 시안에 없다 — 소비자 입력 송장도 같은 기준이라 브랜드 확인 + 시스템 알림으로 임시 표기
  RETURN_INVOICE_UNTRACKED: "브랜드 확인 · 시스템 알림",
};
