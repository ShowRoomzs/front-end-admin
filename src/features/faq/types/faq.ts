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

/** 서버 `AdminFaqCategoryCount` — 전체(ALL)가 맨 앞이고 5종이 뒤따르는 6개 배열의 한 칸 */
export interface FaqCategoryCountItem {
  category: string;
  displayName: string;
  count: number;
}

/**
 * 서버에서 막 받은 목록 응답.
 *
 * 건수를 배열로 주므로 화면이 쓰기 좋은 맵으로 바꿔서 넘긴다(서비스 계층에서 처리).
 * 배열째로 화면까지 들고 가면 탭마다 `find`를 돌아야 한다.
 */
export interface RawFaqListResponse extends PageResponse<Faq> {
  categoryCounts?: Array<FaqCategoryCountItem>;
}

export interface FaqListResponse extends PageResponse<Faq> {
  /**
   * 탭 배지용 카테고리별 건수. 정규화를 거친 값이라 항상 `{ 키: 숫자 }`다.
   *
   * 필드를 안 내려주는 서버 버전에서는 `undefined`이고, 이때 배지는 그리지 않는다
   * (0으로 대신 그리면 "집계 없음"과 "정말 0건"이 같은 모양이 된다).
   */
  categoryCounts?: FaqCategoryCounts;
}
