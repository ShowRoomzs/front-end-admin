import type { BaseParams, PageInfo } from "@/common/types";

/**
 * 계정 상태 3종 (§25-3).
 *
 * 서버 `UserStatus`에는 `DORMANT`(휴면)도 있지만 탭을 두지 않았다 — 휴면으로 전환하는
 * 경로가 아직 없어서다(휴면 배치 미구현). 값이 생겨도 전체 탭에서는 보이므로 목록에서
 * 사라지지 않는다.
 */
export type ConsumerStatus = "NORMAL" | "DORMANT" | "WITHDRAWN" | "SUSPENDED";

/** 목록 상태 탭 — 서버 `AdminUserTab`과 1:1 */
export type ConsumerTab = "ALL" | "ACTIVE" | "SUSPENDED" | "WITHDRAWN";

/** 정렬 3종 — 서버 `AdminUserSort`와 1:1 */
export type ConsumerSort = "RECENT_JOINED" | "ORDER_COUNT_DESC" | "MEMBER_NO";

/**
 * 가입 수단.
 *
 * 서버 `ProviderType`은 6종(GOOGLE·FACEBOOK·NAVER·KAKAO·APPLE·LOCAL)이지만 시안이 정한
 * 소비자 가입 수단은 4종이다. 그래서 필터 셀렉트에는 4종만 올리되, 목록 표기는 서버가
 * 어떤 값을 주든 깨지지 않게 fallback을 둔다.
 */
export type ConsumerProvider =
  "KAKAO" | "NAVER" | "APPLE" | "GOOGLE" | "FACEBOOK" | "LOCAL";

export interface ConsumerListItem {
  userId: number;
  /** `CST-88231` — 서버가 포맷해서 내려준다. 프론트에서 접두사를 붙이지 말 것 */
  memberNo: string;
  nickname: string;
  /**
   * 가운데 1자 마스킹(홍*동).
   *
   * **마스킹은 서버가 끝낸다.** 목록에는 해제 경로가 없어(§25-1) 원본이 응답에 아예
   * 담기지 않는다 — 화면이 가리는 방식이면 페이로드에 전체 값이 남아 열람 통제가
   * 성립하지 않는다. 그러니 여기서 다시 가공하지 말고 받은 문자열을 그대로 그린다.
   */
  maskedName: string;
  /** 가운데 4자리 마스킹(010-****-1234) — 뒤 4자리가 남아 검색·대조가 된다 */
  maskedPhone: string;
  providerType: ConsumerProvider;
  joinedAt: string;
  /** 취소만 남은 주문은 세지 않는다. 0건은 화면에서 회색으로 강등한다 */
  orderCount: number;
  status: ConsumerStatus;
}

/** 탭 건수 — 상태 조건만 빼고 검색어·가입 수단은 반영한 값 */
export interface ConsumerListSummary {
  total: number;
  active: number;
  suspended: number;
  withdrawn: number;
  /**
   * 최근 30일 신규 정지 — **정지 탭에서만** 값이 있고 다른 탭에서는 null이다.
   *
   * 전체 탭의 4분할 요약을 정지 탭에 그대로 두면 지금 보고 있는 범위와 어긋나므로,
   * 서버가 탭에 맞춰 이 값을 채워 준다(§25-3).
   */
  newSuspendedIn30Days: number | null;
}

export interface ConsumerListResponse {
  content: Array<ConsumerListItem>;
  pageInfo: PageInfo;
  summary: ConsumerListSummary;
}

export interface ConsumerListParams extends BaseParams {
  tab: ConsumerTab;
  /** 회원번호(CST-) · 닉네임 · 휴대폰 뒤 4자리 — 축을 서버가 판별한다 */
  keyword: string;
  /** null = 전체 수단 */
  providerType: ConsumerProvider | null;
  sort: ConsumerSort;
}
