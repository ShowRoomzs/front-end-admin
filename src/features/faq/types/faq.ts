import type { BaseParams, PageResponse } from "@/common/types";

export interface FaqCategory {
  key: string;
  description: string;
}

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

export type FaqListResponse = PageResponse<Faq>;
