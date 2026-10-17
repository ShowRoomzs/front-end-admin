import type { PageResponse } from "@/common/types/page";

/*
  어드민 예외 관리 타입 — **시안에서 역산한 임시 타입**이다(ui-admin-06d-exceptions rev.1).
  이 화면의 백엔드 API는 아직 없다. API가 생기면 서버 DTO 이름·필드에 맞춰 이 파일만 고친다.

  이 화면은 관찰 화면이다 — 실행 버튼이 없고 행은 [열기]로 주문·클레임 상세에 간다.
  운영자가 개입할 수 있는 것은 처리 지연 탭뿐이고(대행은 주문 상세에서), 배송 예외는 플랫폼 미개입이다.
*/

/** 탭 2종 — 기본 진입은 처리 지연(운영자가 실제로 개입할 수 있는 유일한 탭) */
export type ExceptionTab = "DELAY" | "DELIVERY";

/**
 * 처리 지연 3종 — 당사자가 기한을 넘긴 건.
 * 발송 기한 경과 = 공구 마감 + 주문 시점 N영업일(기본 3) · 검수 지연 = 입고 확인 + 2영업일 ·
 * 재발송 지연 = 검수 통과·재발송비 결제 + 2영업일(근거 대기).
 * 취소 요청 미응답은 1영업일 자동 승인이라 이 탭에 오지 않는다.
 */
export type DelayType =
  "SHIPPING_OVERDUE" | "INSPECTION_OVERDUE" | "RESHIP_OVERDUE";

/**
 * 배송 예외 4종 — 택배·추적 이상(플랫폼 미개입).
 * 집화 확인 필요(등록 후 24시간) · 추적 정지(집화 후 7일) · 반송 중 · 회수 송장 미조회.
 */
export type DeliveryExceptionType =
  | "PICKUP_UNCONFIRMED"
  | "TRACKING_STALLED"
  | "RETURNING"
  | "RETURN_INVOICE_UNTRACKED";

/** 목록 정렬 — 시안은 「경과 오래된순」 하나뿐이다 */
export type ExceptionSort = "ELAPSED_DESC";

/** 유형 필터 — 빈 문자열은 「유형 전체」. 탭이 바뀌면 값 집합이 달라져 초기화한다 */
export type ExceptionTypeFilter = "" | DelayType | DeliveryExceptionType;

export interface ExceptionListParams {
  tab: ExceptionTab;
  type: ExceptionTypeFilter;
  /** 주문번호 · 접수번호 · 브랜드명 */
  keyword: string;
  sort: ExceptionSort;
  page: number;
  size: number;
}

/** 처리 지연 대상 — 주문(ORD-) 또는 클레임(CLM-). 열기 링크가 갈라진다 */
export type DelayTargetKind = "ORDER" | "CLAIM";

/** 처리 지연 행 */
export interface DelayItem {
  tab: "DELAY";
  /** 행 키 — 대상번호는 주문과 클레임이 겹치지 않지만 서버 식별자를 따로 받는다 */
  id: string;
  targetKind: DelayTargetKind;
  /** 「ORD-24190」 / 「CLM-3015」 */
  targetNo: string;
  delayType: DelayType;
  brandName: string;
  /** 기한 시각(ISO) */
  deadlineAt: string;
  /** 기한 기준 라벨(「입고+2」) — 있으면 시각 대신 「09.16 · 입고+2」로 적는다 */
  deadlineBasis: string | null;
  /** 경과 영업일 */
  elapsedBusinessDays: number;
  /** 시스템 자동 알림 횟수 — 독촉 버튼은 없고 횟수만 보여준다 */
  notifyCount: number;
  /**
   * 알림 3회 무응답이면 운영자 대행이 열린다(근거 대기).
   * 상태가 아니라 조건이라 배지가 아니라 글자로 적는다.
   */
  proxyAvailable: boolean;
  /** 다음 자동 알림 회차·일자 — 대행 가능이면 null */
  nextNotifyRound: number | null;
  nextNotifyAt: string | null;
}

/** 배송 예외 행 */
export interface DeliveryItem {
  tab: "DELIVERY";
  id: string;
  /** 「ORD-24151」 */
  orderNo: string;
  exceptionType: DeliveryExceptionType;
  brandName: string;
  carrierName: string;
  /** 가운데를 가린 송장번호(「6512****2240」) — 서버가 마스킹해 내린다 */
  trackingNoMasked: string;
  /** 기준 시점부터 지난 시간(시간 단위) — 정렬 키이기도 하다 */
  elapsedHours: number;
}

export type ExceptionRow = DelayItem | DeliveryItem;

/** 목록 응답 — 「대행 가능 N건」은 현재 조건(탭·유형·검색) 결과 안의 건수 */
export interface ExceptionListResponse extends PageResponse<ExceptionRow> {
  proxyAvailableCount: number;
}

/** 탭 카운트 · 유형 드롭다운의 건수(「발송 기한 경과 2」) */
export interface ExceptionSummary {
  tabCounts: Record<ExceptionTab, number>;
  delayTypeCounts: Record<DelayType, number>;
  deliveryTypeCounts: Record<DeliveryExceptionType, number>;
}
