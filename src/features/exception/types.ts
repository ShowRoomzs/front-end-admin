import type { PageResponse } from "@/common/types/page";

/*
  어드민 예외 관리 타입 — 백엔드 `AdminOrderExceptionDto`(06d · 40 설계서)와 1:1이다.
  LocalDateTime은 시간대 없는 ISO 문자열(「2026-10-07T23:59:59」 · 서버 한국 시각)로 온다.

  이 화면은 관찰 화면이다 — 쓰기 엔드포인트가 없고 행은 [열기]로 주문·클레임 상세에 간다.
  기한 · 경과 · 다음 단계 · 처리 주체 문장은 서버가 만든다(FE가 유형별 매핑표를 들지 않는다).
*/

/** `ExceptionTab` — 처리 지연(기본 진입 · 운영자가 개입할 수 있는 유일한 탭) · 배송 예외 */
export type ExceptionTab = "DELAY" | "DELIVERY";

/** `ExceptionKind` — 앞 셋은 처리 지연, 뒤 넷은 배송 예외 탭 소속이다 */
export type ExceptionKind =
  | "SHIP_OVERDUE"
  | "INSPECT_OVERDUE"
  | "RESHIP_DELAYED"
  | "PICKUP_UNCONFIRMED"
  | "TRACKING_STALLED"
  | "RETURNING"
  | "COLLECTION_UNSCANNED";

/** `LinkType` — ORDER = 06a 주문 상세 · CLAIM = 06b 클레임 상세 */
export type ExceptionLinkType = "ORDER" | "CLAIM";

/** 택배사 — 백엔드 `DeliveryCarrier` enum 이름. 표시는 서버 `carrierLabel`을 쓴다 */
export type DeliveryCarrier =
  | "CJ"
  | "EPOST"
  | "HANJIN"
  | "LOTTE"
  | "LOGEN"
  | "KYUNGDONG"
  | "DAESIN"
  | "ILYANG"
  | "CU"
  | "GS25"
  | "HAPDONG"
  | "WOORI"
  | (string & {});

/** `Link` — [열기]의 목적지. 서버가 정한다(FE는 kind로 고르지 않는다) */
export interface ExceptionLink {
  type: ExceptionLinkType;
  orderId: number;
  deliveryGroupId: number;
  claimId: number | null;
}

/** `Invoice` — 주문 송장(집화 · 추적 정지 · 반송) 또는 회수 송장. 서버는 가리지 않는다 */
export interface ExceptionInvoice {
  carrier: DeliveryCarrier | null;
  carrierLabel: string | null;
  trackingNumber: string | null;
}

/**
 * `ExceptionItem` — 처리 지연 행은 기한 · 알림 · 다음 단계가, 배송 예외 행은 송장 · 기준 · 처리 주체가 찬다.
 */
export interface ExceptionItem {
  tab: ExceptionTab;
  kind: ExceptionKind;
  kindLabel: string;
  /** 대상 열 — 주문번호 또는 접수번호(CLM-). 회수 송장 미조회는 주문번호 */
  targetNumber: string;
  subOrderNumber: string | null;
  orderId: number;
  deliveryGroupId: number;
  claimId: number | null;
  marketId: number;
  brandName: string;
  /** 기한 — 처리 지연만 */
  dueAt: string | null;
  /** 기한 보조 문장(「입고 + 2영업일」) */
  dueBasisLabel: string | null;
  /** 기준 시각 — 정렬 기준(처리 지연은 기한과 같다) */
  basisAt: string | null;
  /** 기준 열 문장 — 배송 예외만(「집화 후 7일」) */
  basisLabel: string | null;
  elapsedHours: number;
  /** 기한 다음 날부터 오늘까지 영업일 — 처리 지연만 */
  elapsedBusinessDays: number | null;
  /** 경과 열 문장(「3영업일」 · 「8일 무갱신」) */
  elapsedLabel: string;
  /** 기한 · 기준을 넘겼는가 — 탭 정의상 전부 참(색은 FE) */
  overdue: boolean;
  /** 시스템 자동 알림 횟수 — 재발송 지연 · 배송 예외는 null(「—」) */
  noticeCount: number | null;
  lastNoticeAt: string | null;
  nextNoticeAt: string | null;
  /** 대행 가능 조건 충족(알림 N회 무응답) — 상태가 아니라 조건이다 */
  actOnBehalfAvailable: boolean;
  /** 다음 단계 열 — 처리 지연만 */
  nextStepLabel: string | null;
  nextStepNote: string | null;
  /** 송장 — 배송 예외만 */
  invoice: ExceptionInvoice | null;
  /** 처리 주체 — 배송 예외만 · CS 답변 문장 */
  handlerLabel: string | null;
  link: ExceptionLink;
}

/** `ExceptionPage` — 목록 응답. `asOf`는 경과 · 다음 회차 계산의 서버 기준 시각 */
export interface ExceptionPage {
  asOf: string;
  page: PageResponse<ExceptionItem>;
}

/** `ExceptionSummary` — 탭 · 유형 건수는 필터 · 검색과 무관한 전체 기준 */
export interface ExceptionSummary {
  asOf: string;
  /** DELAY가 06a 툴바 「처리 지연 N건」이다 */
  tabCounts: Record<ExceptionTab, number>;
  /** 7종 전부(0건 포함) */
  kindCounts: Record<ExceptionKind, number>;
  /** 툴바 「대행 가능 N건」 — 처리 지연 중 대행 조건 충족 */
  actOnBehalfCount: number;
  /** 사이드바 배지 */
  badge: number;
  /** 배지 범위 — ALL(처리 지연 + 배송 예외) · DELAY(처리 지연만) */
  badgeScope: "ALL" | "DELAY";
}

/** 유형 필터 — 빈 문자열은 「유형 전체」. 탭이 바뀌면 값 집합이 달라 초기화한다 */
export type ExceptionKindFilter = "" | ExceptionKind;

/** 화면(주소창) 파라미터 — 정렬은 서버 고정(경과 오래된순)이라 없다 */
export interface ExceptionListParams {
  tab: ExceptionTab;
  kind: ExceptionKindFilter;
  /** 주문번호 · 하위주문번호 · 브랜드명 부분 일치, CLM-N은 접수번호 정확 일치 */
  keyword: string;
  page: number;
  size: number;
}
