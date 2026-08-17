import type { BaseParams, PageResponse } from "@/common/types";

export interface FaqCategory {
  key: string;
  description: string;
}

/**
 * 필터 전용 값. `/common/faqs/categories`는 저장용 5종 앞에 이 값을 함께 내려주므로
 * 탭·셀렉트를 만들 때 걸러내야 한다(전체 탭은 화면이 직접 만든다).
 */
export const FAQ_CATEGORY_ALL = "ALL";

export interface Faq {
  id: number;
  category: string;
  categoryDisplayName: string;
  question: string;
  answer: string;
  createdAt: string;
  modifiedAt: string;
  displayOrder: number;
}

export interface FaqListParams extends BaseParams {
  category: string | null;
  keyword: string;
}

export interface FaqRequest {
  category: string;
  question: string;
  answer: string;
}

export interface FaqReorderItem {
  faqId: number;
  displayOrder: number;
}
export type FaqReorderRequest = Array<FaqReorderItem>;

/** 카테고리 키 → 건수. 탭 배지에 쓴다 */
export type FaqCategoryCounts = Record<string, number>;

export interface FaqListResponse extends PageResponse<Faq> {
  /**
   * 탭 배지용 카테고리별 건수.
   *
   * 변경 요청 목록(§16)처럼 목록 응답에 함께 실어 별도 집계 호출을 만들지 않는 방향이나,
   * BE 추가 전까지는 내려오지 않는다. 그동안 탭 배지는 값을 비워 둔다
   * (0으로 대신 그리면 "정말 0건"과 구분이 안 된다).
   */
  categoryCounts?: FaqCategoryCounts;
}
