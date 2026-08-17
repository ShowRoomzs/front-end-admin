import type { FaqListParams } from "@/features/faq/types/faq";

/** 시안 툴바 우측 표시 건수 드롭다운(.sel-sm) */
export const FAQ_PAGE_SIZES = [20, 50, 100];

export const FAQ_INITIAL_PARAMS: FaqListParams = {
  page: 1,
  size: FAQ_PAGE_SIZES[0],
  category: null,
  keyword: "",
};
