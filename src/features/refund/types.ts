/*
  환불 관리 — 와이어프레임 파생 타입(ui-admin-06c-refunds rev.1).

  백엔드에 어드민 환불 API는 아직 없다(주문 쪽에 환불 큐 엔티티 OrderRefundTask만 있다).
  그래서 이 파일은 시안에 그려진 열·문구·다이얼로그에서만 역산한 **임시 계약**이고,
  서버 필드명이 정해지면 이 파일과 services/ 본문만 고친다. 시안에 없는 필드는 만들지 않았다.
*/
import type { PageParams, PageResponse } from "@/common/types/page";

/**
 * 환불 상태 = 탭. 집행 대기(경고) · 실패(위험) · 완료(성공) — 시안 A1~A3.
 * 집행 대기는 운영자 사유 환불만 온다(취소·반품 통과·반송 완료는 PG 즉시 자동 환불이라 대기가 없다).
 */
export type RefundStatus = "PENDING" | "FAILED" | "DONE";

/** 경로 필터 — 시안 셀렉트: 경로 전체 · 취소 · 반품 · 반송 · 운영자 사유 */
export type RefundRouteGroup = "CANCEL" | "RETURN" | "RETURN_BACK" | "OPERATOR";
export type RefundRouteFilter = "" | RefundRouteGroup;

/** 출처 열 — PG 자동(중립) · 운영자 사유(경고) */
export type RefundSource = "PG_AUTO" | "OPERATOR";

/** 결제 열 꼬리표 — 원래 · 추가(교환·반려 재발송비) · 원래 부분(일부 반려) */
export type RefundPaymentScope = "ORIGINAL" | "ADDITIONAL" | "ORIGINAL_PARTIAL";

/** 정렬 — 시안 셀렉트: 일시 최신순 · 환불액 높은순 */
export type RefundSort = "LATEST" | "AMOUNT_DESC";

export interface RefundListParams extends PageParams {
  tab: RefundStatus;
  route: RefundRouteFilter;
  /** 환불번호 · 주문번호 · PG 거래번호 */
  keyword: string;
  sort: RefundSort;
}

export interface RefundListItem {
  refundId: number;
  /** RFD-0918 */
  refundNumber: string;
  /** ORD-24171 */
  orderNumber: string;
  routeGroup: RefundRouteGroup;
  /** 경로 열 본문 — "반려 이의 인용" · "취소 요청 자동 승인" */
  routeLabel: string;
  /** 경로 열 보조 — "CLM-3008" · "교환 철회". 없으면 null */
  routeDetail: string | null;
  source: RefundSource;
  brandName: string;
  /** 결제 수단 — "카드" · "카카오페이" */
  paymentMethod: string;
  paymentScope: RefundPaymentScope | null;
  amount: number;
  status: RefundStatus;
  /** 일시 열 — 집행 대기=편입 · 실패=실패 · 완료=환불 완료 시각 */
  occurredAt: string;
  /** 집행 대기: 편입자 */
  enrolledBy: string | null;
  /** 완료(운영자 사유): 집행자 */
  executedBy: string | null;
  /** 실패: PG 응답 코드를 운영자 말로 옮긴 원인 — "PG 응답 오류" */
  failureLabel: string | null;
  /** 실패: 시스템 자동 재시도 횟수 */
  autoRetryCount: number | null;
}

/** 표 위 요약 줄 — 탭마다 쓰는 필드가 다르다 */
export interface RefundListSummary {
  count: number;
  totalAmount: number;
  /** 실패 탭: 소비자 대기 일수(가장 오래된 실패 건 기준) */
  consumerWaitingDays: number | null;
  /** 완료 탭: 조회 기간 라벨 — "최근 1개월" */
  periodLabel: string | null;
  /** 완료 탭: 출처별 건수 */
  pgAutoCount: number | null;
  operatorCount: number | null;
}

export interface RefundListResponse extends PageResponse<RefundListItem> {
  summary: RefundListSummary;
}

/** 탭 카운트 · 사이드바 배지(집행 대기 + 실패) */
export interface RefundSummary {
  tabCounts: Record<RefundStatus, number>;
  actionRequiredCount: number;
}

/** 결제 건별 취소 대상 — 원래 결제와 추가 결제는 PG 거래가 따로라 취소도 따로다 */
export interface RefundCancelTarget {
  methodLabel: string;
  pgTransactionId: string;
  amount: number;
  /** 원래 결제의 일부만 취소(일부 반려)면 true — M1 「전액」 꼬리표가 빠진다 */
  partial: boolean;
}

/** 다이얼로그 M1(집행 재확인) · M2(재시도) 공용 상세 */
export interface RefundDetail {
  refundId: number;
  refundNumber: string;
  orderNumber: string;
  routeLabel: string;
  routeDetail: string | null;
  source: RefundSource;
  amount: number;
  /** M1 — 06a·06b에서 편입할 때 남긴 사유·근거·편입자. PG 자동 건은 null */
  enrollment: {
    enrolledBy: string;
    enrolledAt: string;
    /** 근거 — "1:1 문의 #4527 사진상 배송 시점 오염으로 판단" */
    ground: string;
  } | null;
  originalPayment: RefundCancelTarget;
  /** 교환·반려 재발송비의 별도 PG 거래 — 결제되지 않았으면 null */
  additionalPayment: RefundCancelTarget | null;
  /** 추가 결제가 없을 때 이유 — "재발송비 결제 요청은 편입 시 취소됨" */
  additionalPaymentNote: string | null;
  /** M1 정산 줄 — 정산 확정 건이면 클로백(다음 정산 차감) */
  settlement: { clawback: boolean; clawbackAmount: number | null };
  /** M2 — 실패 원인 · 코드 · 시각 */
  failure: { label: string; code: string; failedAt: string } | null;
  /** M2 — 시스템 자동 재시도 이력 */
  autoRetry: { count: number; failedAt: string } | null;
}

/** 집행 — 버튼 라벨의 금액과 서버 금액이 어긋나면(그 사이 바뀜) 서버가 거절하도록 확인 금액을 보낸다 */
export interface RefundExecuteRequest {
  confirmedAmount: number;
}

export interface RefundExecuteResponse {
  refundId: number;
  status: RefundStatus;
}

/** 재시도 — 바꿀 값이 없다(원래 요청을 그대로 다시 보낸다). 결과만 돌아온다 */
export interface RefundRetryResponse {
  refundId: number;
  result: "SUCCEEDED" | "FAILED";
  failureLabel: string | null;
}
